import type {
  IPlatformAdapter,
  ParsedUrl,
  PlatformType,
  ProfileData,
  VideoData,
  VideosResponse
} from '@/types'
import { UrlParser } from '@/utils/urlParser'
import { TikTokAdapter } from './adapters/tiktokAdapter'
import { logger } from '@/utils/logger'

/**
 * 平台服务工厂
 * 统一管理所有平台适配器，提供统一的接口
 */
export class PlatformServiceFactory {
  private adapters: Map<PlatformType, IPlatformAdapter>
  private urlParser: UrlParser

  constructor() {
    this.adapters = new Map()
    this.urlParser = new UrlParser()
    this.initializeAdapters()
  }

  /**
   * 初始化所有平台适配器
   */
  private initializeAdapters(): void {
    // 注册平台适配器
    this.adapters.set('tiktok', new TikTokAdapter())

    // 其他平台的适配器可以在后续添加
    // this.adapters.set('instagram', new InstagramAdapter())
    // this.adapters.set('youtube', new YouTubeAdapter())
    // this.adapters.set('facebook', new FacebookAdapter())
    // this.adapters.set('xiaohongshu', new XiaohongshuAdapter())
    // this.adapters.set('douyin', new DouyinAdapter())

    logger.info('Platform adapters initialized', {
      platforms: Array.from(this.adapters.keys())
    })
  }

  /**
   * 解析URL并返回平台信息
   */
  parseUrl(url: string): ParsedUrl | null {
    try {
      const result = this.urlParser.parse(url)
      if (result) {
        logger.debug('URL parsed successfully', {
          url,
          platform: result.platform,
          username: result.username
        })
      } else {
        logger.warn('URL parsing failed', { url })
      }
      return result
    } catch (error) {
      logger.error('Error parsing URL', { url, error: (error as Error).message })
      return null
    }
  }

  /**
   * 获取指定平台的适配器
   */
  getAdapter(platform: PlatformType): IPlatformAdapter {
    const adapter = this.adapters.get(platform)
    if (!adapter) {
      const error = new Error(`Unsupported platform: ${platform}`)
      logger.error('Platform adapter not found', { platform })
      throw error
    }
    return adapter
  }

  /**
   * 获取所有支持的平台
   */
  getSupportedPlatforms(): PlatformType[] {
    return Array.from(this.adapters.keys())
  }

  /**
   * 检查平台是否支持
   */
  isPlatformSupported(platform: PlatformType): boolean {
    return this.adapters.has(platform)
  }

  /**
   * 获取用户资料（统一接口）
   */
  async getProfile(platform: PlatformType, username: string): Promise<ProfileData> {
    const adapter = this.getAdapter(platform)
    logger.info('Fetching profile', { platform, username })

    try {
      const profile = await adapter.getProfile(username)
      logger.info('Profile fetched successfully', {
        platform,
        username,
        displayName: profile.displayName,
        followerCount: profile.followerCount
      })
      return profile
    } catch (error) {
      logger.error('Failed to fetch profile', {
        platform,
        username,
        error: (error as Error).message
      })
      throw error
    }
  }

  /**
   * 获取视频列表（统一接口）
   */
  async getVideos(
    platform: PlatformType,
    username: string,
    cursor?: string
  ): Promise<VideosResponse> {
    const adapter = this.getAdapter(platform)
    logger.info('Fetching videos', { platform, username, cursor })

    try {
      const response = await adapter.getVideos(username, cursor)
      logger.info('Videos fetched successfully', {
        platform,
        username,
        count: response.videos.length,
        hasMore: response.hasMore
      })
      return response
    } catch (error) {
      logger.error('Failed to fetch videos', {
        platform,
        username,
        cursor,
        error: (error as Error).message
      })
      throw error
    }
  }

  /**
   * 获取视频详情（统一接口）
   */
  async getVideoDetails(
    platform: PlatformType,
    videoId: string
  ): Promise<VideoData> {
    const adapter = this.getAdapter(platform)
    logger.info('Fetching video details', { platform, videoId })

    try {
      const video = await adapter.getVideoDetails(videoId)
      logger.info('Video details fetched successfully', {
        platform,
        videoId,
        title: video.title,
        viewCount: video.viewCount
      })
      return video
    } catch (error) {
      logger.error('Failed to fetch video details', {
        platform,
        videoId,
        error: (error as Error).message
      })
      throw error
    }
  }

  /**
   * 完整的账号同步流程
   * 1. 获取用户资料
   * 2. 获取所有视频
   */
  async syncAccount(
    platform: PlatformType,
    username: string,
    options: {
      maxVideos?: number
      includeProfile?: boolean
    } = {}
  ): Promise<{
    profile?: ProfileData
    videos: VideoData[]
    hasMore: boolean
  }> {
    const { maxVideos = 100, includeProfile = true } = options
    logger.info('Starting account sync', { platform, username, maxVideos })

    const result: {
      profile?: ProfileData
      videos: VideoData[]
      hasMore: boolean
    } = {
      videos: [],
      hasMore: false
    }

    try {
      // 获取用户资料
      if (includeProfile) {
        result.profile = await this.getProfile(platform, username)
      }

      // 获取视频列表（支持分页）
      let cursor: string | undefined
      let hasMore = true

      while (hasMore && result.videos.length < maxVideos) {
        const remainingCount = maxVideos - result.videos.length
        const response = await this.getVideos(platform, username, cursor)

        // 添加视频到结果中
        result.videos.push(...response.videos.slice(0, remainingCount))

        // 检查是否还有更多视频
        hasMore = response.hasMore && result.videos.length < maxVideos
        cursor = response.nextCursor

        // 如果获取的视频数量少于请求的数量，说明没有更多了
        if (response.videos.length < (cursor ? 20 : 20)) {
          hasMore = false
        }

        // 添加延迟避免API限流
        if (hasMore && cursor) {
          await this.delay(1000) // 1秒延迟
        }
      }

      result.hasMore = hasMore

      logger.info('Account sync completed', {
        platform,
        username,
        profileCount: result.profile ? 1 : 0,
        videoCount: result.videos.length,
        hasMore: result.hasMore
      })

      return result
    } catch (error) {
      logger.error('Account sync failed', {
        platform,
        username,
        error: (error as Error).message
      })
      throw error
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 批量同步多个账号
   */
  async batchSync(
    accounts: Array<{ platform: PlatformType; username: string }>,
    options: {
      maxConcurrent?: number
      delayBetween?: number
    } = {}
  ): Promise<Array<{
    platform: PlatformType
    username: string
    success: boolean
    data?: any
    error?: string
  }>> {
    const { maxConcurrent = 3, delayBetween = 2000 } = options
    logger.info('Starting batch sync', {
      accountCount: accounts.length,
      maxConcurrent,
      delayBetween
    })

    const results = []

    // 分批处理
    for (let i = 0; i < accounts.length; i += maxConcurrent) {
      const batch = accounts.slice(i, i + maxConcurrent)

      const batchPromises = batch.map(async (account) => {
        try {
          const data = await this.syncAccount(account.platform, account.username)
          return {
            ...account,
            success: true,
            data
          }
        } catch (error) {
          return {
            ...account,
            success: false,
            error: (error as Error).message
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // 批次间延迟
      if (i + maxConcurrent < accounts.length) {
        await this.delay(delayBetween)
      }
    }

    const successCount = results.filter(r => r.success).length
    logger.info('Batch sync completed', {
      total: accounts.length,
      success: successCount,
      failed: accounts.length - successCount
    })

    return results
  }
}

/**
 * 创建平台服务工厂实例
 */
export const platformServiceFactory = new PlatformServiceFactory()

/**
 * 便捷方法：解析URL
 */
export function parseCreatorUrl(url: string): ParsedUrl | null {
  return platformServiceFactory.parseUrl(url)
}

/**
 * 便捷方法：同步账号
 */
export function syncCreatorAccount(
  platform: PlatformType,
  username: string,
  options?: { maxVideos?: number; includeProfile?: boolean }
) {
  return platformServiceFactory.syncAccount(platform, username, options)
}