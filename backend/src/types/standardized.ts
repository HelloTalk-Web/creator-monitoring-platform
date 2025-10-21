/**
 * 标准化数据类型定义
 *
 * 本文件定义了所有平台适配器必须遵循的统一数据格式。
 * 每个平台的原始数据都应该被转换为这些标准格式,然后再映射到数据库。
 *
 * 数据流:
 * PlatformRawData → StandardizedData (本文件) → DatabaseSchema
 */

import type { PlatformType } from './index'

/**
 * 标准化用户资料数据
 *
 * 对应数据库表: creator_accounts
 *
 * 所有平台的用户资料数据必须转换为此格式
 */
export interface StandardizedProfile {
  // ==================== 平台标识 ====================
  /** 平台类型 (用于查找对应的platform记录) */
  platform: PlatformType

  /** 平台特定的用户ID (对应 creator_accounts.platform_user_id) */
  platformUserId: string

  /** 用户名 (对应 creator_accounts.username) */
  username: string

  // ==================== 基本信息 ====================
  /** 显示名称 (对应 creator_accounts.display_name, 数据库允许null但实际不应为空) */
  displayName: string

  /** 用户资料页URL (对应 creator_accounts.profile_url) */
  profileUrl: string

  /** 头像URL (对应 creator_accounts.avatar_url) */
  avatarUrl: string | null

  /** 个人简介 (对应 creator_accounts.bio) */
  bio: string | null

  // ==================== 统计数据 ====================
  /** 粉丝数 (对应 creator_accounts.follower_count) - 直接使用bigint */
  followerCount: bigint

  /** 关注数 (对应 creator_accounts.following_count) - 直接使用bigint */
  followingCount: bigint

  /** 视频总数 (对应 creator_accounts.total_videos) */
  totalVideos: number

  /** 是否认证 (对应 creator_accounts.is_verified) */
  isVerified: boolean

  // ==================== 元数据 ====================
  /**
   * 平台原始数据 (对应 creator_accounts.metadata)
   * 用于保存平台特有的字段,便于调试和数据追溯
   */
  rawData: unknown
}

/**
 * 标准化视频数据
 *
 * 对应数据库表: videos
 *
 * 所有平台的视频数据必须转换为此格式
 */
export interface StandardizedVideo {
  // ==================== 平台标识 ====================
  /** 平台类型 (用于业务逻辑,不直接存储) */
  platform: PlatformType

  /** 平台特定的视频ID (对应 videos.platform_video_id) */
  platformVideoId: string

  // ==================== 核心信息 ====================
  /** 视频标题 (对应 videos.title, 最大500字符) */
  title: string

  /** 视频描述 (对应 videos.description) */
  description: string | null

  /** 发布时间 (对应 videos.published_at) */
  publishedAt: Date

  // ==================== URL字段 ====================
  /**
   * 视频文件URL/CDN地址 (对应 videos.video_url)
   * 例如: CDN播放地址、下载链接等
   */
  videoUrl: string

  /**
   * 视频页面URL (对应 videos.page_url)
   * 用户可访问的视频详情页链接
   * 例如: https://www.tiktok.com/@username/video/123
   */
  pageUrl: string

  /** 视频缩略图URL (对应 videos.thumbnail_url) */
  thumbnailUrl: string

  // ==================== 互动数据 ====================
  /** 播放量 (对应 videos.view_count) - 直接使用bigint */
  viewCount: bigint

  /** 点赞数 (对应 videos.like_count) - 直接使用bigint */
  likeCount: bigint

  /** 评论数 (对应 videos.comment_count) - 直接使用bigint */
  commentCount: bigint

  /** 分享数 (对应 videos.share_count) - 直接使用bigint */
  shareCount: bigint

  /** 收藏数 (对应 videos.save_count) - 直接使用bigint */
  saveCount: bigint

  // ==================== 其他字段 ====================
  /** 视频时长(秒) (对应 videos.duration) */
  duration: number | null

  /** 标签数组 (对应 videos.tags, 存储为JSON) */
  tags: string[]

  /**
   * 平台原始数据 (对应 videos.metadata)
   * 用于保存平台特有的字段,便于调试和数据追溯
   */
  rawData: unknown
}

/**
 * 标准化用户资料 → 数据库映射器类型
 *
 * 用于将StandardizedProfile转换为数据库可插入的格式
 * 注意: 此接口已简化,大部分字段直接来自StandardizedProfile
 */
export interface ProfileToDatabaseMapping {
  /** 必需字段:需要从外部提供 */
  userId: number
  platformId: number

  /** 从StandardizedProfile映射的字段 (已经是数据库兼容类型) */
  platformUserId: string
  username: string
  displayName: string | null  // 与数据库schema一致,可为null
  profileUrl: string
  avatarUrl: string | null
  bio: string | null
  followerCount: bigint
  followingCount: bigint
  totalVideos: number
  isVerified: boolean
  metadata: unknown

  /** 自动生成的字段 */
  lastScrapedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

/**
 * 标准化视频 → 数据库映射器类型
 *
 * 用于将StandardizedVideo转换为数据库可插入的格式
 * 注意: 此接口已简化,大部分字段直接来自StandardizedVideo
 */
export interface VideoToDatabaseMapping {
  /** 必需字段:需要从外部提供 */
  accountId: number

  /** 从StandardizedVideo映射的字段 (已经是数据库兼容类型) */
  platformVideoId: string
  title: string
  description: string | null
  videoUrl: string
  pageUrl: string  // 改为必需,与StandardizedVideo一致
  thumbnailUrl: string
  duration: number | null
  publishedAt: Date
  tags: string[]
  viewCount: bigint
  likeCount: bigint
  commentCount: bigint
  shareCount: bigint
  saveCount: bigint
  metadata: unknown

  /** 自动生成的字段 */
  firstScrapedAt?: Date
  lastUpdatedAt?: Date
  dataSource?: string
}

/**
 * 平台转换器接口
 *
 * 每个平台适配器都应该实现此接口,负责将平台原始数据转换为标准格式
 */
export interface IPlatformTransformer<TRawProfile = any, TRawVideo = any> {
  /** 平台名称 */
  readonly platformType: PlatformType

  /**
   * 将平台原始用户数据转换为标准格式
   * @param rawData 平台返回的原始用户数据
   * @returns 标准化的用户资料数据
   */
  transformProfile(rawData: TRawProfile): StandardizedProfile

  /**
   * 将平台原始视频数据转换为标准格式
   * @param rawData 平台返回的原始视频数据
   * @returns 标准化的视频数据
   */
  transformVideo(rawData: TRawVideo): StandardizedVideo
}

/**
 * 数据映射器接口
 *
 * 负责将标准化数据映射到数据库格式
 */
export interface IDataMapper {
  /**
   * 将标准化用户资料映射到数据库格式
   * @param profile 标准化的用户资料
   * @param additionalData 额外需要的数据(userId, platformId等)
   * @returns 可直接插入数据库的数据对象
   */
  mapProfileToDatabase(
    profile: StandardizedProfile,
    additionalData: { userId: number; platformId: number }
  ): ProfileToDatabaseMapping

  /**
   * 将标准化视频数据映射到数据库格式
   * @param video 标准化的视频数据
   * @param accountId 创作者账号ID
   * @returns 可直接插入数据库的数据对象
   */
  mapVideoToDatabase(
    video: StandardizedVideo,
    accountId: number
  ): VideoToDatabaseMapping
}
