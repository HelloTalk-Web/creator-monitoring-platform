import type {
  ProfileData,
  VideoData,
  VideosResponse,
  PlatformType
} from '@/types'
import type {
  TikTokProfileResponse,
  TikTokVideoResponse,
  TikTokVideosResponse,
  InstagramProfileResponse,
  InstagramPostResponse,
  YouTubeChannelResponse,
  YouTubeVideoResponse
} from '@/types/platforms'
import type {
  FieldMapping,
  TransformError,
  TransformResult,
  AdapterErrorType,
  AdapterError
} from '@/types/adapters'
import { logger } from './logger'

/**
 * 强类型数据转换器
 * 负责将平台特定的原始响应转换为我们统一的数据结构
 */
export class DataTransformer {
  private fieldMappings: Map<PlatformType, any>

  constructor() {
    this.fieldMappings = new Map()
    this.initializeFieldMappings()
  }

  /**
   * 初始化字段映射配置
   */
  private initializeFieldMappings(): void {
    // TikTok字段映射
    this.fieldMappings.set('tiktok', {
      profile: {
        displayName: [
          { source: 'nickname', required: true },
          { source: 'title', defaultValue: '' }
        ],
        username: [
          { source: 'uniqueId', required: true }
        ],
        bio: [
          { source: 'signature', defaultValue: '' }
        ],
        avatarUrl: [
          { source: 'avatarLarger', required: true },
          { source: 'avatarMedium' },
          { source: 'avatarThumb' }
        ],
        followerCount: [
          { source: 'followerCount', required: true, transform: this.toNumber }
        ],
        followingCount: [
          { source: 'followingCount', required: true, transform: this.toNumber }
        ],
        totalVideos: [
          { source: 'videoCount', required: true, transform: this.toNumber }
        ],
        isVerified: [
          { source: 'verified', required: true, transform: this.toBoolean }
        ],
        externalId: [
          { source: 'uniqueId', required: true }
        ]
      },
      video: {
        videoUrl: [
          { source: 'id', required: true, transform: (id: string) => this.buildTikTokUrl(id) }
        ],
        thumbnailUrl: [
          { source: 'video.cover', required: true },
          { source: 'video.dynamicCover' },
          { source: 'video.staticCover' },
          { source: 'video.originCover' }
        ],
        publishedAt: [
          { source: 'createTime', required: true, transform: this.parseTimestamp }
        ],
        title: [
          { source: 'desc', required: true }
        ],
        tags: [
          { source: 'challenges', required: true, transform: this.extractTikTokTags },
          { source: 'textExtra', transform: this.extractTextExtraTags }
        ],
        viewCount: [
          { source: 'stats.playCount', required: true, transform: this.toNumber },
          { source: 'statsV2.playCount', transform: this.toNumber }
        ],
        likeCount: [
          { source: 'stats.diggCount', required: true, transform: this.toNumber },
          { source: 'statsV2.diggCount', transform: this.toNumber }
        ],
        commentCount: [
          { source: 'stats.commentCount', required: true, transform: this.toNumber },
          { source: 'statsV2.commentCount', transform: this.toNumber }
        ],
        shareCount: [
          { source: 'stats.shareCount', required: true, transform: this.toNumber },
          { source: 'statsV2.shareCount', transform: this.toNumber }
        ],
        description: [
          { source: 'desc', defaultValue: '' }
        ],
        duration: [
          { source: 'video.duration', transform: this.toNumber }
        ],
        saveCount: [
          { source: 'stats.collectCount', transform: this.toNumber },
          { source: 'statsV2.collectCount', transform: this.toNumber }
        ]
      }
    })

    // Instagram字段映射（待实现）
    this.fieldMappings.set('instagram', {
      profile: {
        displayName: [
          { source: 'fullName', required: true },
          { source: 'name', defaultValue: '' }
        ],
        username: [
          { source: 'username', required: true }
        ],
        bio: [
          { source: 'biography', defaultValue: '' }
        ],
        avatarUrl: [
          { source: 'profilePicUrl', required: true }
        ],
        followerCount: [
          { source: 'followersCount', required: true, transform: this.toNumber }
        ],
        followingCount: [
          { source: 'followingCount', required: true, transform: this.toNumber }
        ],
        totalVideos: [
          { source: 'postsCount', required: true, transform: this.toNumber }
        ],
        isVerified: [
          { source: 'isVerified', required: true, transform: this.toBoolean }
        ],
        externalId: [
          { source: 'id', required: true }
        ]
      },
      video: {
        videoUrl: [
          { source: 'permalinkUrl', required: true }
        ],
        thumbnailUrl: [
          { source: 'displayUrl', required: true }
        ],
        publishedAt: [
          { source: 'timestamp', required: true, transform: this.parseTimestamp }
        ],
        title: [
          { source: 'caption', required: true }
        ],
        tags: [
          { source: 'hashtags', required: true, transform: this.extractInstagramTags }
        ],
        viewCount: [
          { source: 'videoViewCount', required: true, transform: this.toNumber },
          { source: 'videoPlayCount', transform: this.toNumber }
        ],
        likeCount: [
          { source: 'likeCount', required: true, transform: this.toNumber }
        ],
        commentCount: [
          { source: 'commentsCount', required: true, transform: this.toNumber }
        ],
        shareCount: [
          { source: 'shareCount', required: true, transform: this.toNumber, defaultValue: 0 }
        ],
        description: [
          { source: 'caption', defaultValue: '' }
        ],
        duration: [
          { source: 'length', transform: this.toNumber }
        ]
      }
    })

    // YouTube字段映射（待实现）
    this.fieldMappings.set('youtube', {
      profile: {
        displayName: [
          { source: 'title', required: true }
        ],
        username: [
          { source: 'customUrl', required: true },
          { source: 'id', defaultValue: '' }
        ],
        bio: [
          { source: 'description', defaultValue: '' }
        ],
        avatarUrl: [
          { source: 'thumbnails.high.url', required: true },
          { source: 'thumbnails.medium.url' },
          { source: 'thumbnails.default.url' }
        ],
        followerCount: [
          { source: 'subscriberCount', required: true, transform: this.parseNumberString }
        ],
        followingCount: [
          { source: 'followingCount', transform: this.parseNumberString, defaultValue: 0 }
        ],
        totalVideos: [
          { source: 'videoCount', required: true, transform: this.parseNumberString }
        ],
        isVerified: [
          { source: 'isVerified', transform: this.toBoolean, defaultValue: false }
        ],
        externalId: [
          { source: 'id', required: true }
        ]
      },
      video: {
        videoUrl: [
          { source: 'id', required: true, transform: (id: string) => this.buildYouTubeUrl(id) }
        ],
        thumbnailUrl: [
          { source: 'thumbnails.high.url', required: true },
          { source: 'thumbnails.medium.url' },
          { source: 'thumbnails.standard.url' }
        ],
        publishedAt: [
          { source: 'publishedAt', required: true }
        ],
        title: [
          { source: 'title', required: true }
        ],
        tags: [
          { source: 'tags', required: true, defaultValue: [] }
        ],
        viewCount: [
          { source: 'viewCount', required: true, transform: this.parseNumberString }
        ],
        likeCount: [
          { source: 'likeCount', transform: this.parseNumberString, defaultValue: 0 }
        ],
        commentCount: [
          { source: 'commentCount', transform: this.parseNumberString, defaultValue: 0 }
        ],
        shareCount: [
          { source: 'shareCount', transform: this.parseNumberString, defaultValue: 0 }
        ],
        description: [
          { source: 'description', defaultValue: '' }
        ],
        duration: [
          { source: 'duration', transform: this.parseDuration }
        ]
      }
    })
  }

  /**
   * 转换用户资料数据
   */
  transformProfile<T>(
    platform: PlatformType,
    data: T,
    username: string,
    profileUrl: string
  ): TransformResult<ProfileData> {
    try {
      const mapping = this.fieldMappings.get(platform)?.profile
      if (!mapping) {
        throw new AdapterError(
          `No profile mapping found for platform: ${platform}`,
          AdapterErrorType.UNSUPPORTED_PLATFORM,
          platform
        )
      }

      const result: Partial<ProfileData> = {
        platform,
        profileUrl
      }

      const errors: TransformError[] = []

      // 应用字段映射
      for (const [targetField, mappings] of Object.entries(mapping)) {
        const fieldResult = this.extractFieldValue(data, mappings, targetField)
        if (fieldResult.value !== undefined) {
          (result as any)[targetField] = fieldResult.value
        }
        if (fieldResult.errors) {
          errors.push(...fieldResult.errors)
        }
      }

      // 验证必需字段
      const validationErrors = this.validateProfileData(result as ProfileData)
      errors.push(...validationErrors)

      if (errors.length > 0) {
        return {
          success: false,
          errors
        }
      }

      return {
        success: true,
        data: result as ProfileData
      }
    } catch (error) {
      logger.error('Profile transformation failed', {
        platform,
        username,
        error: (error as Error).message
      })

      return {
        success: false,
        errors: [{
          field: 'transformation',
          expectedType: 'ProfileData',
          actualValue: data,
          message: (error as Error).message
        }]
      }
    }
  }

  /**
   * 转换视频数据
   */
  transformVideo<T>(platform: PlatformType, data: T): TransformResult<VideoData> {
    try {
      const mapping = this.fieldMappings.get(platform)?.video
      if (!mapping) {
        throw new AdapterError(
          `No video mapping found for platform: ${platform}`,
          AdapterErrorType.UNSUPPORTED_PLATFORM,
          platform
        )
      }

      const result: Partial<VideoData> = {
        platform,
        lastUpdatedAt: new Date().toISOString()
      }

      const errors: TransformError[] = []

      // 应用字段映射
      for (const [targetField, mappings] of Object.entries(mapping)) {
        const fieldResult = this.extractFieldValue(data, mappings, targetField)
        if (fieldResult.value !== undefined) {
          (result as any)[targetField] = fieldResult.value
        }
        if (fieldResult.errors) {
          errors.push(...fieldResult.errors)
        }
      }

      // 设置videoId（如果有的话）
      if (!result.videoId && (data as any).id) {
        result.videoId = (data as any).id
      }

      // 验证必需字段
      const validationErrors = this.validateVideoData(result as VideoData)
      errors.push(...validationErrors)

      if (errors.length > 0) {
        return {
          success: false,
          errors
        }
      }

      return {
        success: true,
        data: result as VideoData
      }
    } catch (error) {
      logger.error('Video transformation failed', {
        platform,
        error: (error as Error).message,
        data
      })

      return {
        success: false,
        errors: [{
          field: 'transformation',
          expectedType: 'VideoData',
          actualValue: data,
          message: (error as Error).message
        }]
      }
    }
  }

  /**
   * 提取字段值
   */
  private extractFieldValue(
    data: any,
    mappings: FieldMapping[],
    targetField: string
  ): { value?: any; errors?: TransformError[] } {
    const errors: TransformError[] = []

    for (const mapping of mappings) {
      const value = this.getNestedValue(data, mapping.source)

      // 如果找到了值
      if (value !== undefined && value !== null && value !== '') {
        try {
          const transformedValue = mapping.transform
            ? mapping.transform(value)
            : value

          return { value: transformedValue }
        } catch (error) {
          errors.push({
            field: targetField,
            expectedType: typeof mapping.defaultValue,
            actualValue: value,
            message: `Transform error: ${(error as Error).message}`
          })
        }
      }
    }

    // 如果没有找到值，检查是否必需
    const isRequired = mappings.some(m => m.required)
    if (isRequired) {
      errors.push({
        field: targetField,
        expectedType: 'required',
        actualValue: undefined,
        message: `Required field ${targetField} is missing`
      })
    }

    // 使用默认值
    const defaultValue = mappings.find(m => m.defaultValue !== undefined)?.defaultValue
    if (defaultValue !== undefined) {
      return { value: defaultValue }
    }

    return { errors }
  }

  /**
   * 获取嵌套对象值
   */
  private getNestedValue(obj: any, path: string | string[]): any {
    if (typeof path === 'string') {
      path = path.split('.')
    }

    let current = obj
    for (const key of path) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        return undefined
      }
    }

    return current
  }

  /**
   * 验证用户资料数据
   */
  private validateProfileData(data: ProfileData): TransformError[] {
    const errors: TransformError[] = []

    const requiredFields = ['username', 'displayName', 'followerCount', 'totalVideos', 'isVerified', 'externalId']

    for (const field of requiredFields) {
      if (!(data as any)[field]) {
        errors.push({
          field,
          expectedType: 'required',
          actualValue: (data as any)[field],
          message: `Required field ${field} is missing`
        })
      }
    }

    return errors
  }

  /**
   * 验证视频数据
   */
  private validateVideoData(data: VideoData): TransformError[] {
    const errors: TransformError[] = []

    const requiredFields = ['videoUrl', 'thumbnailUrl', 'publishedAt', 'title', 'tags', 'viewCount', 'likeCount', 'commentCount', 'shareCount']

    for (const field of requiredFields) {
      if (!(data as any)[field]) {
        errors.push({
          field,
          expectedType: 'required',
          actualValue: (data as any)[field],
          message: `Required field ${field} is missing`
        })
      }
    }

    return errors
  }

  // 数据转换工具函数
  private toNumber(value: any): number {
    if (typeof value === 'number') return Math.max(0, value)
    if (typeof value === 'string') {
      const parsed = parseInt(value.replace(/[^0-9]/g, ''), 10)
      return isNaN(parsed) ? 0 : Math.max(0, parsed)
    }
    return 0
  }

  private toBoolean(value: any): boolean {
    return Boolean(value)
  }

  private parseTimestamp(value: any): string {
    const timestamp = typeof value === 'number' && value < 10000000000
      ? value * 1000
      : value

    try {
      return new Date(timestamp).toISOString()
    } catch {
      return new Date().toISOString()
    }
  }

  private parseNumberString(value: string): number {
    if (!value) return 0
    const parsed = parseInt(value.replace(/[^0-9]/g, ''), 10)
    return isNaN(parsed) ? 0 : Math.max(0, parsed)
  }

  private parseDuration(duration: string): number {
    // YouTube duration format: PT4M13S -> 253 seconds
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0

    const hours = parseInt(match[1] || '0', 10) * 3600
    const minutes = parseInt(match[2] || '0', 10) * 60
    const seconds = parseInt(match[3] || '0', 10)

    return hours + minutes + seconds
  }

  private buildTikTokUrl(videoId: string): string {
    return `https://www.tiktok.com/@_/video/${videoId}`
  }

  private buildYouTubeUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`
  }

  private extractTikTokTags(challenges: any[]): string[] {
    if (!Array.isArray(challenges)) return []
    return challenges
      .filter(challenge => challenge?.title)
      .map(challenge => challenge.title.replace(/^#/, ''))
      .filter(tag => tag.length > 0)
  }

  private extractTextExtraTags(textExtra: any[]): string[] {
    if (!Array.isArray(textExtra)) return []
    return textExtra
      .filter(item => item?.hashtagName)
      .map(item => item.hashtagName.replace(/^#/, ''))
      .filter(tag => tag.length > 0)
  }

  private extractInstagramTags(hashtags: any[]): string[] {
    if (!Array.isArray(hashtags)) return []
    return hashtags
      .filter(tag => tag?.name)
      .map(tag => tag.name.replace(/^#/, ''))
      .filter(tag => tag.length > 0)
  }
}

/**
 * 创建数据转换器实例
 */
export const dataTransformer = new DataTransformer()

/**
 * 便捷方法：转换用户资料
 */
export function transformProfile<T>(
  platform: PlatformType,
  data: T,
  username: string,
  profileUrl: string
): TransformResult<ProfileData> {
  return dataTransformer.transformProfile(platform, data, username, profileUrl)
}

/**
 * 便捷方法：转换视频数据
 */
export function transformVideo<T>(
  platform: PlatformType,
  data: T
): TransformResult<VideoData> {
  return dataTransformer.transformVideo(platform, data)
}