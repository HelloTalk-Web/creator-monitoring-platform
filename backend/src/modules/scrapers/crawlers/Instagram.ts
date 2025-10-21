import { apiKeyService } from '../../../shared/infrastructure/api-key.service'
import { logger } from '../../../shared/utils/logger'

// Force reload: 2025-10-20 12:15

/**
 * Instagram 爬虫适配器
 * 集成 ScrapeCreators API 进行 Instagram 数据抓取
 * 支持 Instagram 用户资料、帖子数据抓取
 */
export class InstagramAdapter {
  readonly platformName = 'Instagram'
  readonly platformType = 'instagram' as const
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.SCRAPE_CREATORS_BASE_URL || 'https://api.scrapecreators.com'
  }

  /**
   * 初始化爬虫
   */
  async initialize(): Promise<void> {
    const apiKeyCount = apiKeyService.getApiKeyCount()
    if (apiKeyCount === 0) {
      console.warn('InstagramAdapter: SCRAPE_CREATORS_API_KEY not configured')
    } else {
      console.log(`InstagramAdapter initialized with ${apiKeyCount} API key(s)`)
    }
    console.log(`InstagramAdapter initialized with base URL: ${this.baseUrl}`)
  }

  /**
   * 从URL提取用户名或shortcode
   */
  private extractIdentifier(url: string): { type: 'user' | 'post' | 'reel'; value: string } {
    // 先清理URL
    const cleanUrl = this.cleanUrl(url)

    // 检查是否是reel链接
    const reelMatch = cleanUrl.match(/instagram\.com\/reel\/([a-zA-Z0-9_-]+)/)
    if (reelMatch) {
      return { type: 'reel', value: reelMatch[1] }
    }

    // 检查是否是post链接
    const postMatch = cleanUrl.match(/instagram\.com\/p\/([a-zA-Z0-9_-]+)/)
    if (postMatch) {
      return { type: 'post', value: postMatch[1] }
    }

    // 检查是否是用户主页链接
    const userMatch = cleanUrl.match(/instagram\.com\/([a-zA-Z0-9._]+)/)
    if (userMatch) {
      return { type: 'user', value: userMatch[1] }
    }

    throw new Error('Invalid Instagram URL format')
  }

  /**
   * 从URL提取用户名（兼容旧方法）
   */
  private extractUsername(url: string): string {
    const identifier = this.extractIdentifier(url)
    if (identifier.type === 'user') {
      return identifier.value
    }

    // 如果是post或reel，需要通过API获取用户名，这里先抛出错误
    throw new Error(`Cannot extract username directly from ${identifier.type} URL. Use getUserInfoWithPost() instead.`)
  }

  /**
   * 从post/reel URL获取用户信息
   * 先获取帖子信息，再提取用户名，最后获取完整用户资料
   */
  async getUserInfoFromPost(url: string): Promise<any> {
    const identifier = this.extractIdentifier(url)

    if (identifier.type === 'user') {
      // 直接是用户主页，使用原有逻辑
      return this.getUserInfo(url)
    }

    // 如果是post或reel，先获取帖子信息
    const postData = await this.getVideoInfo(url)

    // 从帖子数据中提取用户名
    const username = postData.owner?.username
    if (!username) {
      throw new Error(`Cannot extract username from ${identifier.type} data`)
    }

    // 构建用户主页URL
    const profileUrl = `https://www.instagram.com/${username}/`

    // 获取完整的用户信息
    return this.getUserInfo(profileUrl)
  }

  /**
   * 清理URL，移除查询参数和多余的引号
   */
  private cleanUrl(url: string): string {
    return url.trim()
      .replace(/^["']/, '')  // 移除开头的引号
      .replace(/["']$/, '')  // 移除结尾的引号
      .split('?')[0]         // 移除查询参数
  }

  /**
   * 从URL提取帖子shortcode
   */
  private extractShortcode(url: string): string {
    // 先清理URL
    const cleanUrl = this.cleanUrl(url)

    const patterns = [
      /instagram\.com\/p\/([a-zA-Z0-9_-]+)/,
      /instagram\.com\/reel\/([a-zA-Z0-9_-]+)/
    ]

    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern)
      if (match) {
        return match[1]
      }
    }

    throw new Error('Invalid Instagram post/reel URL format')
  }

  
  
  
  /**
   * 获取用户信息（原始数据）
   * 包含智能API Key选择和重试机制
   */
  async getUserInfo(url: string): Promise<any> {
    const identifier = this.extractIdentifier(url)

    if (identifier.type === 'post' || identifier.type === 'reel') {
      // 对于post和reel链接，先获取帖子信息再获取用户信息
      return this.getUserInfoFromPost(url)
    }

    const username = identifier.value

    // 首先尝试使用有积分的API Key
    let apiKey = await apiKeyService.getNextApiKeyWithCredits()

    // 如果没有找到有积分的Key，使用普通轮换方式
    if (!apiKey) {
      apiKey = apiKeyService.getNextApiKey()
    }

    // 添加详细日志
    console.log('🔍 Instagram API Debug:')
    console.log('- Username:', username)
    console.log('- API Key (masked):', apiKey.substring(0, 8) + '...')
    console.log('- Request URL:', `${this.baseUrl}/v1/instagram/profile?handle=${username}`)

    const response = await fetch(`${this.baseUrl}/v1/instagram/profile?handle=${username}`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    })

    console.log('- Response Status:', response.status)
    console.log('- Response Headers:', Object.fromEntries(response.headers.entries()))

    // 如果是402错误（积分不足），尝试获取其他有积分的API Key
    if (response.status === 402) {
      console.warn('Instagram API: 当前API Key积分不足，尝试切换到其他Key')

      // 重新获取有积分的API Key
      const retryApiKey = await apiKeyService.getNextApiKeyWithCredits()
      if (!retryApiKey) {
        throw new Error('Instagram API error: 所有API Key积分均不足')
      }

      const retryResponse = await fetch(`${this.baseUrl}/v1/instagram/profile?handle=${username}`, {
        headers: {
          'x-api-key': retryApiKey,
          'Content-Type': 'application/json'
        }
      })

      if (!retryResponse.ok) {
        throw new Error(`Instagram API error: ${retryResponse.status} ${retryResponse.statusText}`)
      }

      return await retryResponse.json()
    }

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * 获取用户帖子信息（返回原始API数据）
   * 使用v2 posts端点获取完整的帖子数据
   */
  async getUserVideos(url: string, options: {
    limit?: number
    cursor?: string
  } = {}): Promise<any[]> {
    const identifier = this.extractIdentifier(url)

    if (identifier.type === 'post' || identifier.type === 'reel') {
      // 对于post和reel链接，先获取用户信息，然后获取该用户的视频
      const userInfo = await this.getUserInfoFromPost(url)
      const username = userInfo.username
      const profileUrl = `https://www.instagram.com/${username}/`

      // 用用户主页URL获取该用户的视频列表
      return this.getUserVideos(profileUrl, options)
    }

    const username = identifier.value
    const targetLimit = options.limit && options.limit > 0 ? options.limit : 100

    if (targetLimit <= 0) {
      return []
    }
    const collected: any[] = []

    let nextCursor: string | undefined = options.cursor
    let remaining = targetLimit
    const maxPerRequest = 50

    while (true) {
      const fetchLimit = Math.min(remaining, maxPerRequest)
      if (fetchLimit <= 0) {
        break
      }
      logger.info('Instagram fetch batch start', {
        username,
        fetchLimit,
        remaining,
        cursor: nextCursor
      })

      try {
        const { data, nextCursor: newCursor } = await this.fetchPostsBatch({
          username,
          limit: fetchLimit,
          cursor: nextCursor
        })

        logger.info('Instagram fetch batch success', {
          username,
          received: data.length,
          nextCursor: newCursor
        })

        if (data.length > 0) {
          collected.push(...data)
        }

        remaining = targetLimit - collected.length

        if (!newCursor || remaining <= 0) {
          break
        }

        nextCursor = newCursor
      } catch (error) {
        logger.error('Instagram fetch batch failed', {
          username,
          cursor: nextCursor,
          remaining,
          error: (error as Error).message
        })
        break
      }
    }

    return collected.slice(0, targetLimit)
  }

  private async fetchPostsBatch(params: { username: string; limit: number; cursor?: string }): Promise<{ data: any[]; nextCursor?: string }> {
    const { username, limit, cursor } = params

    // 首先尝试使用有积分的API Key
    let apiKey = await apiKeyService.getNextApiKeyWithCredits()
    if (!apiKey) {
      apiKey = apiKeyService.getNextApiKey()
    }

    let requestUrl = `${this.baseUrl}/v2/instagram/user/posts?handle=${username}`
    if (cursor) {
      requestUrl += `&next_max_id=${cursor}`
    }
    if (limit) {
      requestUrl += `&limit=${limit}`
    }

    const performRequest = async (apiKeyToUse: string) => {
      logger.info('Instagram fetch request', {
        username,
        limit,
        cursor,
        apiKey: apiKeyToUse.substring(0, 6) + '***'
      })

      const response = await fetch(requestUrl, {
        headers: {
          'x-api-key': apiKeyToUse,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        logger.warn('Instagram fetch request error', {
          username,
          limit,
          cursor,
          status: response.status,
          statusText: response.statusText
        })
        throw new Error(`Instagram API error: ${response.status} ${response.statusText}`)
      }

      logger.info('Instagram fetch request ok', {
        username,
        limit,
        cursor,
        status: response.status
      })

      return response.json() as Promise<any>
    }

    try {
      const result = await performRequest(apiKey)
      return this.parsePostsResponse(result)
    } catch (error: any) {
      if (error.message?.includes('402') || error.message?.includes('403')) {
        const retryApiKey = await apiKeyService.getNextApiKeyWithCredits()
        if (!retryApiKey) {
          throw new Error('Instagram API error: 所有API Key积分均不足')
        }
        logger.warn('Instagram fetch request retry with new API key', {
          username,
          cursor,
          limit
        })
        const retryResult = await performRequest(retryApiKey)
        return this.parsePostsResponse(retryResult)
      }

      logger.error('Instagram fetch request failed', {
        username,
        cursor,
        limit,
        error: (error as Error).message
      })
      throw error
    }
  }

  private parsePostsResponse(response: any): { data: any[]; nextCursor?: string } {
    if (!response) {
      return { data: [] }
    }

    const items = response.items || response.data?.items || response.data || []
    let nextCursor = response.next_max_id
      || response.pagination?.next_max_id
      || response.pagination?.cursor
      || response.page_info?.end_cursor
      || response.data?.page_info?.end_cursor

    const edgePageInfo = response.data?.user?.edge_owner_to_timeline_media?.page_info
    if (!nextCursor && edgePageInfo?.has_next_page) {
      nextCursor = edgePageInfo.end_cursor
    }

    logger.info('Instagram parse posts response', {
      received: Array.isArray(items) ? items.length : 0,
      hasNextPage: Boolean(nextCursor)
    })

    return {
      data: Array.isArray(items) ? items : [],
      nextCursor: typeof nextCursor === 'string' && nextCursor.length > 0 ? nextCursor : undefined
    }
  }

  /**
   * 获取单个帖子信息（返回原始API数据）
   * 包含智能API Key选择和重试机制
   */
  async getVideoInfo(videoUrl: string): Promise<any> {
    const shortcode = this.extractShortcode(videoUrl)
    const cleanUrl = this.cleanUrl(videoUrl)  // 使用清理后的URL

    // 首先尝试使用有积分的API Key
    let apiKey = await apiKeyService.getNextApiKeyWithCredits()

    // 如果没有找到有积分的Key，使用普通轮换方式
    if (!apiKey) {
      apiKey = apiKeyService.getNextApiKey()
    }

    console.log(`🎯 获取视频信息: ${videoUrl} -> 清理后: ${cleanUrl}`)

    const response = await fetch(`${this.baseUrl}/v1/instagram/post?url=${encodeURIComponent(cleanUrl)}`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    })

    // 如果是402错误（积分不足），尝试获取其他有积分的API Key
    if (response.status === 402) {
      console.warn('Instagram API: 当前API Key积分不足，尝试切换到其他Key')

      // 重新获取有积分的API Key
      const retryApiKey = await apiKeyService.getNextApiKeyWithCredits()
      if (!retryApiKey) {
        throw new Error('Instagram API error: 所有API Key积分均不足')
      }

      const retryResponse = await fetch(`${this.baseUrl}/v1/instagram/post?url=${encodeURIComponent(cleanUrl)}`, {
        headers: {
          'x-api-key': retryApiKey,
          'Content-Type': 'application/json'
        }
      })

      if (!retryResponse.ok) {
        throw new Error(`Instagram API error: ${retryResponse.status} ${retryResponse.statusText}`)
      }

      return await retryResponse.json()
    }

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * 验证Instagram URL格式
   */
  isValidInstagramUrl(url: string): boolean {
    // 先清理URL
    const cleanUrl = this.cleanUrl(url)

    const patterns = [
      /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?$/,
      /^https?:\/\/(www\.)?instagram\.com\/p\/[a-zA-Z0-9_-]+\/?$/,
      /^https?:\/\/(www\.)?instagram\.com\/reel\/[a-zA-Z0-9_-]+\/?$/
    ]

    return patterns.some(pattern => pattern.test(cleanUrl))
  }

  /**
   * 标准化Instagram URL
   */
  normalizeUrl(url: string): string {
    const identifier = this.extractIdentifier(url)

    if (identifier.type === 'post' || identifier.type === 'reel') {
      // 对于post和reel链接，返回清理后的URL
      return this.cleanUrl(url)
    }

    // 对于用户主页，标准化格式
    return `https://www.instagram.com/${identifier.value}/`
  }

  /**
   * 获取API使用统计
   */
  getApiStats() {
    return {
      apiKeyCount: apiKeyService.getApiKeyCount(),
      baseUrl: this.baseUrl
    }
  }

  /**
   * 获取用户所有视频数据（别名方法，与getUserVideos功能相同）
   * Instagram的getUserVideos已经内置分页功能，所以直接调用即可
   */
  async getAllUserVideos(url: string, options: { maxLimit?: number } = {}): Promise<any[]> {
    const { maxLimit = 100 } = options

    // Instagram的getUserVideos已经实现了完整的分页功能
    // 直接调用并传递limit参数即可
    return this.getUserVideos(url, {
      limit: maxLimit
    })
  }
}

// 重新导出，保持向后兼容性
export { BaseCrawler } from './ICrawler'

