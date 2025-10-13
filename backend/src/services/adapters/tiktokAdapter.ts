import type {
  ProfileData,
  VideoData,
  VideosResponse,
  PlatformType
} from '@/types'
import type {
  TikTokProfileResponse,
  TikTokVideosResponse
} from '@/types/platforms'
import type {
  TransformResult,
  AdapterError,
  AdapterErrorType
} from '@/types/adapters'
import { BaseAdapter } from './baseAdapter'
import { UrlParser } from '@/utils/urlParser'
import { transformProfile, transformVideo } from '@/utils/dataTransformer'

/**
 * TikTok平台适配器
 * 实现TikTok特定的数据获取和转换逻辑
 */
export class TikTokAdapter extends BaseAdapter {
  constructor() {
    super('tiktok', process.env.SCRAPE_CREATORS_BASE_URL || 'https://api.scrapecreators.com')
  }

  getPlatform(): PlatformType {
    return 'tiktok'
  }

  /**
   * 获取TikTok用户资料
   */
  async getProfile(username: string): Promise<ProfileData> {
    return this.safeApiCall(async () => {
      const cleanUsername = username.startsWith('@') ? username.slice(1) : username
      const endpoint = this.getProfileEndpoint(cleanUsername)
      const profileUrl = UrlParser.buildProfileUrl('tiktok', cleanUsername)

      const response = await this.apiClient.get<TikTokProfileResponse>(endpoint)
      const data = response.data

      if (!data || data.error) {
        throw new AdapterError(
          data?.error?.message || 'Failed to fetch TikTok profile',
          AdapterErrorType.API_ERROR,
          this.platform,
          { statusCode: response.status }
        )
      }

      // 使用强类型转换器
      const transformResult = transformProfile<TikTokProfileResponse>(
        this.platform,
        data,
        cleanUsername,
        profileUrl
      )

      if (!transformResult.success || !transformResult.data) {
        throw new AdapterError(
          'Failed to transform TikTok profile data',
          AdapterErrorType.TRANSFORM_ERROR,
          this.platform,
          { originalError: transformResult.errors }
        )
      }

      return transformResult.data
    }, 'Failed to get TikTok profile')
  }

  /**
   * 获取TikTok用户视频列表
   */
  async getVideos(username: string, cursor?: string): Promise<VideosResponse> {
    return this.safeApiCall(async () => {
      const cleanUsername = username.startsWith('@') ? username.slice(1) : username
      const endpoint = this.getVideosEndpoint(cleanUsername, cursor)

      const response = await this.apiClient.get<TikTokVideosResponse>(endpoint)
      const data = response.data

      if (!data || data.error) {
        throw new AdapterError(
          data?.error?.message || 'Failed to fetch TikTok videos',
          AdapterErrorType.API_ERROR,
          this.platform,
          { statusCode: response.status }
        )
      }

      // 转换视频数据
      const videos: VideoData[] = []
      const transformErrors: any[] = []

      if (Array.isArray(data.videos)) {
        for (const videoData of data.videos) {
          const transformResult = transformVideo(this.platform, videoData)
          if (transformResult.success && transformResult.data) {
            videos.push(transformResult.data)
          } else {
            transformErrors.push({
              videoId: videoData.id,
              errors: transformResult.errors
            })
            logger.warn('Failed to transform TikTok video', {
              videoId: videoData.id,
              errors: transformResult.errors
            })
          }
        }
      }

      // 记录转换错误
      if (transformErrors.length > 0) {
        logger.warn('Some TikTok videos failed to transform', {
          totalVideos: data.videos?.length || 0,
          successCount: videos.length,
          errorCount: transformErrors.length,
          errors: transformErrors
        })
      }

      return {
        videos,
        hasMore: Boolean(data.hasMore || data.has_more || data.cursor),
        nextCursor: data.cursor || data.next_cursor || undefined
      }
    }, 'Failed to get TikTok videos')
  }

  /**
   * 获取TikTok视频详情
   */
  async getVideoDetails(videoId: string): Promise<VideoData> {
    return this.safeApiCall(async () => {
      const endpoint = this.getVideoDetailsEndpoint(videoId)

      const response = await this.apiClient.get<any>(endpoint)
      const data = response.data

      if (!data || data.error) {
        throw new AdapterError(
          data?.error?.message || 'Failed to fetch TikTok video details',
          AdapterErrorType.API_ERROR,
          this.platform,
          { statusCode: response.status }
        )
      }

      // 使用强类型转换器
      const transformResult = transformVideo(this.platform, data)

      if (!transformResult.success || !transformResult.data) {
        throw new AdapterError(
          'Failed to transform TikTok video data',
          AdapterErrorType.TRANSFORM_ERROR,
          this.platform,
          { originalError: transformResult.errors }
        )
      }

      return transformResult.data
    }, 'Failed to get TikTok video details')
  }

  protected getProfileEndpoint(username: string): string {
    return `/tiktok/profile?username=@${username}`
  }

  protected getVideosEndpoint(username: string, cursor?: string): string {
    const endpoint = `/tiktok/profile/videos?username=@${username}`
    return cursor ? `${endpoint}&cursor=${encodeURIComponent(cursor)}` : endpoint
  }

  protected getVideoDetailsEndpoint(videoId: string): string {
    return `/tiktok/video/info?id=${videoId}`
  }

  
  /**
   * 获取TikTok用户ID（从URL中提取）
   */
  static extractUserIdFromUrl(url: string): string | null {
    const match = url.match(/tiktok\.com\/@([^\/\?]+)/)
    return match ? match[1] : null
  }

  /**
   * 获取TikTok视频ID（从URL中提取）
   */
  static extractVideoIdFromUrl(url: string): string | null {
    const match = url.match(/tiktok\.com\/@[^\/\?]+\/video\/(\d+)/)
    return match ? match[1] : null
  }
}