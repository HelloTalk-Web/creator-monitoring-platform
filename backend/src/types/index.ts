// 平台类型
export type PlatformType = 'tiktok' | 'instagram' | 'youtube' | 'facebook' | 'xiaohongshu' | 'douyin'

// URL解析结果
export interface ParsedUrl {
  platform: PlatformType
  username: string
  originalUrl: string
  isValid: boolean
  videoId?: string // 如果是视频URL
}

// 统一的用户资料数据格式
export interface ProfileData {
  platform: PlatformType
  username: string
  displayName: string
  avatarUrl: string
  bio: string
  followerCount: number
  followingCount: number
  totalVideos: number
  isVerified: boolean
  externalId: string // 平台特有ID
  profileUrl: string
}

// 统一的视频数据格式 - 必须包含所有指定字段
export interface VideoData {
  platform: PlatformType
  videoId: string

  // 必需字段
  videoUrl: string           // 视频发布页链接（URL）
  thumbnailUrl: string       // 视频缩略图（高清大图）
  publishedAt: string        // 发布时间（精确到日期和时间）
  title: string              // 视频标题（caption）
  tags: string[]             // 话题标签
  viewCount: number          // 播放量（Views）
  likeCount: number          // 点赞数（Likes）
  commentCount: number       // 评论数（Comments）
  shareCount: number         // 分享数（Shares）- 扩展需求

  // 扩展字段
  description?: string       // 视频描述
  duration?: number          // 视频时长
  saveCount?: number         // 收藏数
  lastUpdatedAt: string      // 数据最后更新时间
}

// 视频列表响应
export interface VideosResponse {
  videos: VideoData[]
  hasMore: boolean
  nextCursor?: string
}

// 平台适配器接口
export interface IPlatformAdapter {
  getPlatform(): PlatformType
  getProfile(username: string): Promise<ProfileData>
  getVideos(username: string, cursor?: string): Promise<VideosResponse>
  getVideoDetails(videoId: string): Promise<VideoData>
}

// API响应格式
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  code?: number
}

// 分页参数
export interface PaginationParams {
  page: number
  pageSize: number
  cursor?: string
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  cursor?: string
}

// 账号查询参数
export interface AccountQueryParams extends PaginationParams {
  platform?: PlatformType
  status?: string
  search?: string
}

// 视频查询参数
export interface VideoQueryParams extends PaginationParams {
  accountId?: number
  platform?: PlatformType
  startDate?: string
  endDate?: string
  search?: string
  sortBy?: 'publishedAt' | 'viewCount' | 'likeCount' | 'commentCount'
  sortOrder?: 'asc' | 'desc'
}

// 添加账号请求
export interface AddAccountRequest {
  profileUrl: string
  displayName?: string
  scrapeFrequency?: number
}

// 同步账号请求
export interface SyncAccountRequest {
  accountId: number
  force?: boolean // 是否强制重新同步
}

// Scrape Creators API响应类型
export interface ScrapeCreatorsProfileResponse {
  // TikTok Profile
  username?: string
  displayName?: string
  avatarUrl?: string
  bio?: string
  followerCount?: number
  followingCount?: number
  videoCount?: number
  isVerified?: boolean
  [key: string]: any
}

export interface ScrapeCreatorsVideoResponse {
  // TikTok Video
  videoId?: string
  title?: string
  description?: string
  thumbnailUrl?: string
  videoUrl?: string
  publishedAt?: string
  viewCount?: number
  likeCount?: number
  commentCount?: number
  shareCount?: number
  duration?: number
  tags?: string[]
  [key: string]: any
}

// 错误类型
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

// 环境变量类型
export interface EnvConfig {
  NODE_ENV: string
  PORT: number
  DATABASE_URL: string
  REDIS_URL: string
  JWT_SECRET: string
  JWT_EXPIRES_IN: string
  SCRAPE_CREATORS_BASE_URL: string
  SCRAPE_CREATORS_API_KEY?: string
  LOG_LEVEL: string
}

// 缓存键
export const CACHE_KEYS = {
  PROFILE: (platform: string, username: string) => `profile:${platform}:${username}`,
  VIDEOS: (platform: string, username: string, cursor?: string) =>
    `videos:${platform}:${username}${cursor ? `:${cursor}` : ''}`,
  ACCOUNT_STATS: (accountId: number) => `account:stats:${accountId}`,
  USER_STATS: (userId: number) => `user:stats:${userId}`
} as const

// HTTP状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const

// 平台配置
export const PLATFORM_CONFIG = {
  tiktok: {
    name: 'TikTok',
    baseUrl: 'https://www.tiktok.com',
    patterns: [
      /^https?:\/\/(?:www\.)?tiktok\.com\/@([^\/\?]+)/,
      /^https?:\/\/(?:www\.)?tiktok\.com\/@([^\/\?]+)\/video\/(\d+)/
    ],
    rateLimit: 100, // 每小时请求限制
    color: '#000000'
  },
  instagram: {
    name: 'Instagram',
    baseUrl: 'https://www.instagram.com',
    patterns: [
      /^https?:\/\/(?:www\.)?instagram\.com\/([^\/\?]+)/,
      /^https?:\/\/(?:www\.)?instagram\.com\/p\/([a-zA-Z0-9_-]+)/
    ],
    rateLimit: 100,
    color: '#E4405F'
  },
  youtube: {
    name: 'YouTube',
    baseUrl: 'https://www.youtube.com',
    patterns: [
      /^https?:\/\/(?:www\.)?youtube\.com\/(?:c|channel|user)\/([^\/\?]+)/,
      /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/
    ],
    rateLimit: 100,
    color: '#FF0000'
  },
  facebook: {
    name: 'Facebook',
    baseUrl: 'https://www.facebook.com',
    patterns: [
      /^https?:\/\/(?:www\.)?facebook\.com\/([^\/\?]+)/,
      /^https?:\/\/(?:www\.)?fb\.me\/([^\/\?]+)/
    ],
    rateLimit: 100,
    color: '#1877F2'
  },
  xiaohongshu: {
    name: '小红书',
    baseUrl: 'https://www.xiaohongshu.com',
    patterns: [
      /^https?:\/\/(?:www\.)?xiaohongshu\.com\/user\/profile\/([^\/\?]+)/
    ],
    rateLimit: 50,
    color: '#FE2C55'
  },
  douyin: {
    name: '抖音',
    baseUrl: 'https://www.douyin.com',
    patterns: [
      /^https?:\/\/(?:www\.)?douyin\.com\/user\/([^\/\?]+)/
    ],
    rateLimit: 50,
    color: '#000000'
  }
} as const