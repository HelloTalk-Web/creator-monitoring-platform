/**
 * YouTube API 响应类型定义
 */
interface YouTubeChannelResponse {
  items: Array<{
    id: string
    snippet: {
      title: string
      description: string
      customUrl?: string
      publishedAt: string
      thumbnails: {
        default?: { url: string }
        medium?: { url: string }
        high?: { url: string }
      }
    }
    statistics: {
      viewCount: string
      subscriberCount: string
      hiddenSubscriberCount: boolean
      videoCount: string
    }
    contentDetails: {
      relatedPlaylists: {
        uploads: string
      }
    }
  }>
}

interface YouTubeSearchResponse {
  items: Array<{
    id: {
      kind: string
      videoId: string
    }
    snippet: {
      publishedAt: string
      channelId: string
      title: string
      description: string
    }
  }>
  nextPageToken?: string
}

interface YouTubeVideosResponse {
  items: Array<{
    id: string
    snippet: {
      publishedAt: string
      channelId: string
      title: string
      description: string
      thumbnails: {
        default?: { url: string }
        medium?: { url: string }
        high?: { url: string }
        maxres?: { url: string }
      }
      channelTitle: string
    }
    statistics: {
      viewCount: string
      likeCount: string
      commentCount: string
    }
    contentDetails: {
      duration: string
      dimension: string
      definition: string
    }
  }>
}

/**
 * YouTube 爬虫适配器
 * 使用 YouTube Data API v3 进行数据抓取
 */
export class YouTubeAdapter {
  readonly platformName = 'YouTube'
  readonly platformType = 'youtube' as const
  private apiKey: string
  private baseUrl = 'https://www.googleapis.com/youtube/v3'

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || ''
  }

  // 数据转换逻辑已移除，现在由YouTubeTransformer处理
// 这样保持了与TikTok相同的设计模式：
// Adapter: 获取原始API数据
// Transformer: 负责数据转换

  /**
   * 从视频ID提取频道ID
   */
  private async extractChannelIdFromVideo(videoId: string): Promise<string> {
    const apiUrl = `${this.baseUrl}/videos?part=snippet&id=${videoId}&key=${this.apiKey}`

    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error(`Failed to get video info: ${response.status}`)
    }

    const data = await response.json() as any

    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found')
    }

    const channelId = data.items[0].snippet.channelId
    if (!channelId) {
      throw new Error('Channel ID not found in video data')
    }

    return channelId
  }

  // 视频数据转换逻辑也已移除，现在由YouTubeTransformer处理
// 保持设计一致性：Adapter只负责获取原始API数据

  /**
   * 初始化爬虫
   */
  async initialize(): Promise<void> {
    if (!this.apiKey) {
      console.warn('YouTubeAdapter: YOUTUBE_API_KEY not configured')
    } else {
      console.log('YouTubeAdapter initialized with YouTube Data API v3')
    }
  }

  /**
   * 从URL提取频道标识符
   * 支持格式:
   * - https://www.youtube.com/@handle
   * - https://www.youtube.com/channel/CHANNEL_ID
   * - https://www.youtube.com/c/CustomName
   * - https://youtube.com/shorts/VIDEO_ID (提取频道)
   * - https://www.youtube.com/watch?v=VIDEO_ID (提取频道)
   */
  private extractChannelIdentifier(url: string): { type: 'handle' | 'channelId' | 'videoUrl' | 'url', value: string } {
    // Handle format: @username
    const handleMatch = url.match(/youtube\.com\/@([\w.-]+)/)
    if (handleMatch) {
      return { type: 'handle', value: handleMatch[1] }
    }

    // Channel ID format: /channel/ID
    const channelIdMatch = url.match(/youtube\.com\/channel\/([\w-]+)/)
    if (channelIdMatch) {
      return { type: 'channelId', value: channelIdMatch[1] }
    }

    // Custom URL format: /c/customname
    const customMatch = url.match(/youtube\.com\/c\/([\w.-]+)/)
    if (customMatch) {
      return { type: 'handle', value: customMatch[1] } // Treat as handle for API
    }

    // Video URL formats - we'll extract the channel ID from video info
    const videoMatch = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    if (videoMatch) {
      return { type: 'videoUrl', value: url } as any
    }

    // 如果无法解析，直接使用完整URL
    return { type: 'url', value: url }
  }

  /**
   * 获取用户信息（原始数据）
   * 使用 YouTube Data API v3 channels endpoint
   * 直接返回YouTube Data API的原始数据，由YouTubeTransformer处理转换
   */
  async getUserInfo(url: string): Promise<any> {
    const identifier = this.extractChannelIdentifier(url)

    try {
      let apiUrl: string

      if (identifier.type === 'videoUrl') {
        // 从视频URL提取频道ID
        const videoMatch = identifier.value.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/)
        const videoId = videoMatch ? videoMatch[1] : null
        if (!videoId) {
          throw new Error('无法从视频URL提取视频ID')
        }
        const channelId = await this.extractChannelIdFromVideo(videoId)
        apiUrl = `${this.baseUrl}/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${this.apiKey}`
      } else if (identifier.type === 'handle') {
        // 使用 forHandle 参数
        apiUrl = `${this.baseUrl}/channels?part=snippet,statistics,contentDetails&forHandle=${identifier.value}&key=${this.apiKey}`
      } else if (identifier.type === 'channelId') {
        // 使用 id 参数
        apiUrl = `${this.baseUrl}/channels?part=snippet,statistics,contentDetails&id=${identifier.value}&key=${this.apiKey}`
      } else {
        throw new Error('无效的YouTube URL格式。请提供频道URL,如: https://www.youtube.com/@用户名')
      }

      const response = await fetch(apiUrl)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`YouTube API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json() as any

      if (!data.items || data.items.length === 0) {
        throw new Error('Channel not found')
      }

      // 直接返回YouTube Data API的原始数据
      // 由YouTubeTransformer负责数据转换
      return data.items[0]
    } catch (error) {
      console.error('Error fetching YouTube channel info:', error)
      throw new Error(`Failed to fetch YouTube channel info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 获取用户视频数据（原始数据，返回数组以兼容 manager）
   * 直接返回YouTube Data API的原始数据，由YouTubeTransformer处理转换
   */
  async getUserVideos(url: string, options: { limit?: number; pageToken?: string } = {}): Promise<any[]> {
    const { limit = 50 } = options

    try {
      // 先获取频道ID - 需要直接调用API而不是通过 getUserInfo,避免重复数据转换
      const identifier = this.extractChannelIdentifier(url)
      let channelId: string

      console.log(`🔍 解析URL: ${url}`)
      console.log(`📋 标识符类型: ${identifier.type}, 值: ${identifier.value}`)

      if (identifier.type === 'videoUrl') {
        // 从视频URL提取频道ID
        const videoMatch = identifier.value.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/)
        const videoId = videoMatch ? videoMatch[1] : null
        if (!videoId) {
          throw new Error('无法从视频URL提取视频ID')
        }
                channelId = await this.extractChannelIdFromVideo(videoId)
      } else if (identifier.type === 'handle') {
        // 使用 forHandle 参数获取频道ID
        const apiUrl = `${this.baseUrl}/channels?part=id&forHandle=${identifier.value}&key=${this.apiKey}`
                const response = await fetch(apiUrl)
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`YouTube API error: ${response.status} - ${errorText}`)
        }
        const data = await response.json() as any
        if (!data.items || data.items.length === 0) {
          throw new Error('Channel not found')
        }
        channelId = data.items[0].snippet.channelId
      } else if (identifier.type === 'channelId') {
        channelId = identifier.value
      } else {
        throw new Error('无效的YouTube URL格式。请提供频道URL,如: https://www.youtube.com/@用户名')
      }

      
      // 使用 search endpoint 获取视频列表
      let apiUrl = `${this.baseUrl}/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=${limit}&key=${this.apiKey}`

      if (options.pageToken) {
        apiUrl += `&pageToken=${options.pageToken}`
      }

      
      const response = await fetch(apiUrl)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`YouTube API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json() as YouTubeSearchResponse

      // 获取视频ID列表
      const videoIds = data.items.map(item => item.id.videoId).filter(Boolean)

      console.log(`📹 找到 ${videoIds.length} 个视频ID: ${videoIds.slice(0, 3).join(', ')}${videoIds.length > 3 ? '...' : ''}`)

      if (videoIds.length === 0) {
        return []
      }

      // 批量获取视频详细信息（包含统计数据）
      const videosData = await this.getVideosDetails(videoIds)

      // 直接返回YouTube Data API的原始数据
      // 由YouTubeTransformer负责数据转换
      return videosData
    } catch (error) {
      console.error('Error fetching YouTube videos:', error)
      throw new Error(`Failed to fetch YouTube videos: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 批量获取视频详细信息
   */
  private async getVideosDetails(videoIds: string[]): Promise<any[]> {
    try {
      // YouTube API 支持一次请求最多50个视频
      const apiUrl = `${this.baseUrl}/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}&key=${this.apiKey}`

            
      const response = await fetch(apiUrl)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ YouTube videos API 失败: ${response.status} - ${errorText}`)
        throw new Error(`YouTube API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json() as YouTubeVideosResponse

      console.log(`✅ 成功获取 ${data.items?.length || 0} 个视频的详细信息`)

      return data.items || []
    } catch (error) {
      console.error('❌ Error fetching videos details:', error)
      throw new Error(`Failed to fetch videos details: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 获取用户所有视频数据（自动分页获取）
   * 实现真正的YouTube API分页功能
   */
  async getAllUserVideos(url: string, options: { maxLimit?: number } = {}): Promise<any[]> {
    const { maxLimit = 200 } = options // 默认最多获取200个视频
    const allVideos: any[] = []
    let pageToken: string | undefined = undefined
    let pageCount = 0

    console.log(`🔄 开始获取 YouTube 频道所有视频数据 (最多 ${maxLimit} 个)`)

    try {
      // 先获取频道ID
      const identifier = this.extractChannelIdentifier(url)
      let channelId: string

      if (identifier.type === 'videoUrl') {
        const videoMatch = identifier.value.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/)
        const videoId = videoMatch ? videoMatch[1] : null
        if (!videoId) {
          throw new Error('无法从视频URL提取视频ID')
        }
        channelId = await this.extractChannelIdFromVideo(videoId)
      } else if (identifier.type === 'handle') {
        const apiUrl = `${this.baseUrl}/channels?part=id&forHandle=${identifier.value}&key=${this.apiKey}`
        const response = await fetch(apiUrl)
        if (!response.ok) {
          throw new Error(`YouTube API error: ${response.status}`)
        }
        const data = await response.json() as any
        if (!data.items || data.items.length === 0) {
          throw new Error('Channel not found')
        }
        channelId = data.items[0].snippet.channelId
      } else if (identifier.type === 'channelId') {
        channelId = identifier.value
      } else {
        throw new Error('无效的YouTube URL格式')
      }

      console.log(`✅ 获取频道ID: ${channelId}`)

      // 循环获取所有页的视频数据
      do {
        pageCount++
        
        // 构建API URL
        let apiUrl = `${this.baseUrl}/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=50&key=${this.apiKey}`

        if (pageToken) {
          apiUrl += `&pageToken=${pageToken}`
        }

        
        const response = await fetch(apiUrl)
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`YouTube API error: ${response.status} ${response.statusText} - ${errorText}`)
        }

        const data = await response.json() as YouTubeSearchResponse

        if (!data.items || data.items.length === 0) {
          console.log('📭 没有更多视频数据')
          break
        }

        // 获取当前页的视频ID列表
        const videoIds = data.items.map(item => item.id.videoId).filter(Boolean)
        
        if (videoIds.length === 0) {
          break
        }

        // 获取视频详细信息
        const videosData = await this.getVideosDetails(videoIds)
        allVideos.push(...videosData)

        
        // 检查是否达到最大限制
        if (allVideos.length >= maxLimit) {
                    allVideos.splice(maxLimit) // 截取到指定数量
          break
        }

        // 获取下一页的令牌
        pageToken = data.nextPageToken

        if (!pageToken) {
          console.log('🏁 已获取所有视频数据')
        } else {
          console.log(`➡️ 还有下一页数据，继续获取...`)
        }

      } while (pageToken && allVideos.length < maxLimit)

      
      return allVideos
    } catch (error) {
      console.error('❌ 获取所有视频数据失败:', error)
      throw new Error(`Failed to fetch all YouTube videos: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 获取单个视频信息（原始数据）
   * 直接返回YouTube Data API的原始数据，由YouTubeTransformer处理转换
   */
  async getVideoInfo(videoUrl: string): Promise<any> {
    try {
      // 从URL提取视频ID
      const videoIdMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
      if (!videoIdMatch) {
        throw new Error('Invalid YouTube video URL')
      }

      const videoId = videoIdMatch[1]

      const apiUrl = `${this.baseUrl}/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${this.apiKey}`

      const response = await fetch(apiUrl)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`YouTube API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json() as YouTubeVideosResponse

      if (!data.items || data.items.length === 0) {
        throw new Error('Video not found')
      }

      // 直接返回YouTube Data API的原始数据
      // 由YouTubeTransformer负责数据转换
      return data.items[0]
    } catch (error) {
      console.error('Error fetching YouTube video info:', error)
      throw new Error(`Failed to fetch YouTube video info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
