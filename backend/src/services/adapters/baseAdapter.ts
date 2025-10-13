import axios, { AxiosInstance } from 'axios'
import type {
  IPlatformAdapter,
  ProfileData,
  VideoData,
  VideosResponse,
  PlatformType,
  ScrapeCreatorsProfileResponse,
  ScrapeCreatorsVideoResponse
} from '@/types'
import { logger } from '@/utils/logger'

/**
 * 平台适配器基类
 * 提供通用的API调用功能和数据处理
 */
export abstract class BaseAdapter implements IPlatformAdapter {
  protected apiClient: AxiosInstance
  protected platform: PlatformType
  protected baseUrl: string

  constructor(platform: PlatformType, baseUrl: string) {
    this.platform = platform
    this.baseUrl = baseUrl

    this.apiClient = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Creator-Monitoring-Platform/1.0'
      }
    })

    // 添加请求拦截器
    this.apiClient.interceptors.request.use(
      (config) => {
        logger.debug(`[API] Request to ${config.url}`, {
          method: config.method,
          params: config.params
        })
        return config
      },
      (error) => {
        logger.error(`[API] Request error: ${error.message}`)
        return Promise.reject(error)
      }
    )

    // 添加响应拦截器
    this.apiClient.interceptors.response.use(
      (response) => {
        logger.debug(`[API] Response from ${response.config.url}`, {
          status: response.status,
          dataKeys: Object.keys(response.data || {})
        })
        return response
      },
      (error) => {
        logger.error(`[API] Response error: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data
        })
        return Promise.reject(error)
      }
    )
  }

  abstract getPlatform(): PlatformType
  abstract getProfile(username: string): Promise<ProfileData>
  abstract getVideos(username: string, cursor?: string): Promise<VideosResponse>
  abstract getVideoDetails(videoId: string): Promise<VideoData>

  /**
   * 转换Profile数据格式
   */
  protected transformProfileData(
    data: ScrapeCreatorsProfileResponse,
    username: string,
    profileUrl: string
  ): ProfileData {
    return {
      platform: this.platform,
      username,
      displayName: data.displayName || username,
      avatarUrl: data.avatarUrl || '',
      bio: data.bio || '',
      followerCount: Number(data.followerCount) || 0,
      followingCount: Number(data.followingCount) || 0,
      totalVideos: Number(data.videoCount) || 0,
      isVerified: Boolean(data.isVerified),
      externalId: data.id || username,
      profileUrl
    }
  }

  /**
   * 转换Video数据格式
   */
  protected transformVideoData(data: ScrapeCreatorsVideoResponse): VideoData {
    return {
      platform: this.platform,
      videoId: data.videoId || data.id || '',
      title: data.title || data.description || '',
      description: data.description || '',
      thumbnailUrl: data.thumbnailUrl || '',
      videoUrl: data.videoUrl || '',
      publishedAt: data.publishedAt || new Date().toISOString(),
      viewCount: Number(data.viewCount) || 0,
      likeCount: Number(data.likeCount) || 0,
      commentCount: Number(data.commentCount) || 0,
      shareCount: Number(data.shareCount) || 0,
      saveCount: Number(data.saveCount) || 0,
      duration: Number(data.duration) || undefined,
      tags: Array.isArray(data.tags) ? data.tags : []
    }
  }

  /**
   * 解析分页响应
   */
  protected parsePaginatedResponse(
    data: any,
    transformVideo: (item: any) => VideoData
  ): VideosResponse {
    const videos = Array.isArray(data.videos)
      ? data.videos.map(transformVideo)
      : Array.isArray(data.data)
        ? data.data.map(transformVideo)
        : []

    return {
      videos,
      hasMore: Boolean(data.hasMore || data.has_more || data.cursor),
      nextCursor: data.cursor || data.next_cursor || undefined
    }
  }

  /**
   * 安全的API调用
   */
  protected async safeApiCall<T>(
    apiCall: () => Promise<T>,
    errorMessage: string
  ): Promise<T> {
    try {
      return await apiCall()
    } catch (error: any) {
      logger.error(`${errorMessage}: ${error.message}`, {
        platform: this.platform,
        error: error.response?.data || error.message
      })

      if (error.response?.status === 429) {
        throw new Error(`API rate limit exceeded for ${this.platform}`)
      }

      if (error.response?.status >= 500) {
        throw new Error(`${this.platform} API service unavailable`)
      }

      throw new Error(`${errorMessage}: ${error.message}`)
    }
  }

  /**
   * 获取平台特定的API端点
   */
  protected abstract getProfileEndpoint(username: string): string
  protected abstract getVideosEndpoint(username: string, cursor?: string): string
  protected abstract getVideoDetailsEndpoint(videoId: string): string
}