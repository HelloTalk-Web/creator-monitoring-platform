import { apiKeyService } from '../../../shared/infrastructure/api-key.service'

/**
 * TikTok 爬虫适配器
 * 集成 ScrapeCreators API 进行 TikTok 数据抓取
 */
export class TikTokAdapter {
  readonly platformName = 'TikTok'
  readonly platformType = 'tiktok' as const
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
      console.warn('TikTokAdapter: SCRAPE_CREATORS_API_KEY not configured')
    } else {
      console.log(`TikTokAdapter initialized with ${apiKeyCount} API key(s)`)
    }
    console.log(`TikTokAdapter initialized with base URL: ${this.baseUrl}`)
  }

  /**
   * 从URL提取用户名
   */
  private extractUsername(url: string): string {
    const match = url.match(/tiktok\.com\/@([\w.-]+)/)
    if (!match) {
      throw new Error('Invalid TikTok URL format')
    }
    return match[1]
  }

  /**
   * 获取用户信息（原始数据）
   */
  async getUserInfo(url: string): Promise<any> {
    const username = this.extractUsername(url)

    try {
      const params = new URLSearchParams({ handle: username })

      const response = await fetch(`${this.baseUrl}/v1/tiktok/profile?${params}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKeyService.getNextApiKey(),
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`TikTok API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching TikTok user info:', error)
      throw new Error(`Failed to fetch TikTok user info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 获取用户视频数据（原始数据，支持分页）
   */
  async getUserVideos(url: string, options: { limit?: number } = {}): Promise<any[]> {
    const username = this.extractUsername(url)
    const { limit = 20 } = options

    try {
      const params = new URLSearchParams({
        handle: username,
        amount: limit.toString(),
        trim: 'false'
      })

      const response = await fetch(`${this.baseUrl}/v3/tiktok/profile-videos?${params}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKeyService.getNextApiKey(),
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`TikTok API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return Array.isArray(data) ? data : [] // 确保返回数组类型
    } catch (error) {
      console.error('Error fetching TikTok videos:', error)
      throw new Error(`Failed to fetch TikTok videos: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 获取用户所有视频数据（自动分页获取）
   */
  async getAllUserVideos(url: string, options: { maxLimit?: number } = {}): Promise<any[]> {
    const { maxLimit } = options
    const username = this.extractUsername(url)

    console.log(`🔄 开始获取 ${username} 的所有视频数据`)

    try {
      // 首先获取用户信息，获取总视频数
      const userInfo = await this.getUserInfo(url)
      const totalVideos = userInfo.stats?.videoCount || 0

      console.log(`📊 用户总视频数: ${totalVideos}`)

      // 如果有最大限制且小于总数，则获取限制数量
      const fetchCount = maxLimit && maxLimit < totalVideos ? maxLimit : totalVideos
      console.log(`📥 将获取 ${fetchCount} 个视频`)

      // 一次性获取所有视频
      const videos = await this.getUserVideos(url, { limit: fetchCount })

      console.log(`🎉 视频数据获取完成！获取到: ${videos.length} 个视频`)
      return videos

    } catch (error) {
      console.error('❌ 获取所有视频数据失败:', error)
      throw new Error(`Failed to fetch all TikTok videos: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 获取单个视频信息（原始数据）
   * API文档: GET https://api.scrapecreators.com/v2/tiktok/video
   */
  async getVideoInfo(videoUrl: string): Promise<any> {
    try {
      const params = new URLSearchParams({
        url: videoUrl,
        trim: 'false'
      })

      const response = await fetch(`${this.baseUrl}/v2/tiktok/video?${params}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKeyService.getNextApiKey(),
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`TikTok API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json() as any

      // API返回格式: { success: true, aweme_detail: {...}, credits_remaining: number }
      // 我们需要返回 aweme_detail 部分作为视频数据
      if (!data.success || !data.aweme_detail) {
        throw new Error(`TikTok API returned error or no video data`)
      }

      return data.aweme_detail
    } catch (error) {
      console.error('Error fetching TikTok video info:', error)
      throw new Error(`Failed to fetch TikTok video info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

}