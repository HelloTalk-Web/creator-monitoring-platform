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

  /**
   * 将 YouTube 频道数据转换为标准格式(兼容 TikTok 格式)
   */
  private transformChannelData(channelData: YouTubeChannelResponse['items'][0]): any {
    // 获取customUrl并确保不包含@符号(与TikTok格式保持一致)
    let uniqueId = channelData.snippet.customUrl || channelData.id
    // 如果customUrl包含@符号,移除它
    if (uniqueId.startsWith('@')) {
      uniqueId = uniqueId.substring(1)
    }

    return {
      user: {
        id: channelData.id,
        uniqueId: uniqueId,
        nickname: channelData.snippet.title,
        avatarLarger: channelData.snippet.thumbnails.high?.url || channelData.snippet.thumbnails.medium?.url,
        avatarMedium: channelData.snippet.thumbnails.medium?.url || channelData.snippet.thumbnails.default?.url,
        avatarThumb: channelData.snippet.thumbnails.default?.url,
        signature: channelData.snippet.description,
        verified: false // YouTube API 不直接提供此信息
      },
      stats: {
        followerCount: Number(channelData.statistics.subscriberCount),
        followingCount: 0, // YouTube 没有关注数概念
        videoCount: Number(channelData.statistics.videoCount)
      }
    }
  }

  /**
   * 将 YouTube 视频数据转换为标准格式(兼容 TikTok 格式)
   */
  private transformVideoData(videoData: YouTubeVideosResponse['items'][0]): any {
    // 解析 ISO 8601 duration (PT1M30S -> 90秒)
    const durationMatch = videoData.contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    const hours = durationMatch?.[1] ? parseInt(durationMatch[1]) : 0
    const minutes = durationMatch?.[2] ? parseInt(durationMatch[2]) : 0
    const seconds = durationMatch?.[3] ? parseInt(durationMatch[3]) : 0
    const durationInSeconds = hours * 3600 + minutes * 60 + seconds

    return {
      aweme_id: videoData.id,
      desc: videoData.snippet.title,
      create_time: Math.floor(new Date(videoData.snippet.publishedAt).getTime() / 1000),
      url: `https://www.youtube.com/watch?v=${videoData.id}`,
      video: {
        duration: durationInSeconds * 1000, // 转换为毫秒以兼容 TikTok 格式
        cover: {
          url_list: [
            videoData.snippet.thumbnails.maxres?.url,
            videoData.snippet.thumbnails.high?.url,
            videoData.snippet.thumbnails.medium?.url
          ].filter(Boolean)
        },
        play_addr: {
          url_list: [`https://www.youtube.com/watch?v=${videoData.id}`]
        }
      },
      statistics: {
        play_count: Number(videoData.statistics.viewCount || 0),
        digg_count: Number(videoData.statistics.likeCount || 0),
        comment_count: Number(videoData.statistics.commentCount || 0),
        share_count: 0, // YouTube API 不提供分享数
        collect_count: 0 // YouTube API 不提供收藏数
      }
    }
  }

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
   *
   * 不支持视频URL,需要提供频道URL
   */
  private extractChannelIdentifier(url: string): { type: 'handle' | 'channelId' | 'videoUrl' | 'url', value: string } {
    // 先检查是否是视频URL - 这些不被支持
    const isVideoUrl =
      url.match(/youtube\.com\/watch\?v=/) ||
      url.match(/youtube\.com\/shorts\//) ||
      url.match(/youtu\.be\//)

    if (isVideoUrl) {
      return { type: 'videoUrl', value: url }
    }

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

    // 如果无法解析，直接使用完整URL
    return { type: 'url', value: url }
  }

  /**
   * 获取用户信息（原始数据）
   * 使用 YouTube Data API v3 channels endpoint
   */
  async getUserInfo(url: string): Promise<any> {
    const identifier = this.extractChannelIdentifier(url)

    try {
      let apiUrl: string

      if (identifier.type === 'videoUrl') {
        throw new Error('请提供YouTube频道URL而不是视频URL。支持的格式: https://www.youtube.com/@用户名 或 https://www.youtube.com/channel/频道ID')
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

      const data = await response.json() as YouTubeChannelResponse

      if (!data.items || data.items.length === 0) {
        throw new Error('Channel not found')
      }

      // 转换为标准格式后返回
      return this.transformChannelData(data.items[0])
    } catch (error) {
      console.error('Error fetching YouTube channel info:', error)
      throw new Error(`Failed to fetch YouTube channel info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 获取用户视频数据（原始数据，返回数组以兼容 manager）
   */
  async getUserVideos(url: string, options: { limit?: number; pageToken?: string } = {}): Promise<any[]> {
    const { limit = 50 } = options

    try {
      // 先获取频道ID - 需要直接调用API而不是通过 getUserInfo,避免重复数据转换
      const identifier = this.extractChannelIdentifier(url)
      let channelId: string

      if (identifier.type === 'videoUrl') {
        throw new Error('请提供YouTube频道URL而不是视频URL。支持的格式: https://www.youtube.com/@用户名 或 https://www.youtube.com/channel/频道ID')
      } else if (identifier.type === 'handle') {
        // 使用 forHandle 参数获取频道ID
        const apiUrl = `${this.baseUrl}/channels?part=id&forHandle=${identifier.value}&key=${this.apiKey}`
        const response = await fetch(apiUrl)
        if (!response.ok) {
          throw new Error(`YouTube API error: ${response.status}`)
        }
        const data = await response.json() as YouTubeChannelResponse
        if (!data.items || data.items.length === 0) {
          throw new Error('Channel not found')
        }
        channelId = data.items[0].id
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

      if (videoIds.length === 0) {
        return []
      }

      // 批量获取视频详细信息（包含统计数据）
      const videosData = await this.getVideosDetails(videoIds)

      // 转换为标准格式并直接返回数组
      const transformedVideos = videosData.map(video => this.transformVideoData(video))

      return transformedVideos
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
        throw new Error(`YouTube API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json() as YouTubeVideosResponse
      return data.items || []
    } catch (error) {
      console.error('Error fetching videos details:', error)
      throw new Error(`Failed to fetch videos details: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 获取用户所有视频数据（自动分页获取）
   * 注意: getUserVideos 现在直接返回数组,所以这里需要多次调用来实现分页
   */
  async getAllUserVideos(url: string, options: { maxLimit?: number } = {}): Promise<any[]> {
    const { maxLimit } = options
    const allVideos: any[] = []
    let pageToken: string | undefined = undefined

    console.log('🔄 开始获取 YouTube 频道所有视频数据')

    try {
      // 注意: 由于 getUserVideos 已经简化为返回数组
      // 这里我们只获取一次数据 (默认50个视频)
      const videos = await this.getUserVideos(url, { limit: maxLimit || 50 })

      console.log(`✅ 获取到 ${videos.length} 个视频`)

      return videos
    } catch (error) {
      console.error('❌ 获取所有视频数据失败:', error)
      throw new Error(`Failed to fetch all YouTube videos: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 获取单个视频信息（原始数据）
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

      // 转换为标准格式后返回
      return this.transformVideoData(data.items[0])
    } catch (error) {
      console.error('Error fetching YouTube video info:', error)
      throw new Error(`Failed to fetch YouTube video info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
