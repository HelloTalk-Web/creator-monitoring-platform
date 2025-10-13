// 适配器专用类型定义

import type {
  PlatformType,
  ProfileData,
  VideoData,
  VideosResponse
} from './index'
import type {
  TikTokProfileResponse,
  TikTokVideoResponse,
  TikTokVideosResponse,
  InstagramProfileResponse,
  InstagramPostResponse,
  InstagramPostsResponse,
  YouTubeChannelResponse,
  YouTubeVideoResponse,
  YouTubeVideosResponse,
  FacebookProfileResponse,
  FacebookPostResponse,
  FacebookPostsResponse
} from './platforms'

// 平台特定的原始响应类型
export type PlatformProfileResponse =
  | TikTokProfileResponse
  | InstagramProfileResponse
  | YouTubeChannelResponse
  | FacebookProfileResponse

export type PlatformVideoResponse =
  | TikTokVideoResponse
  | InstagramPostResponse
  | YouTubeVideoResponse
  | FacebookPostResponse

export type PlatformVideosResponse =
  | TikTokVideosResponse
  | InstagramPostsResponse
  | YouTubeVideosResponse
  | FacebookPostsResponse

// 平台特定的数据转换器类型
export type ProfileTransformer<T> = (data: T, username: string, profileUrl: string) => ProfileData
export type VideoTransformer<T> = (data: T) => VideoData
export type VideosResponseTransformer<T> = (data: T) => VideosResponse

// 平台适配器配置
export interface PlatformAdapterConfig {
  platform: PlatformType
  name: string
  baseUrl: string
  endpoints: {
    profile: (username: string) => string
    videos: (username: string, cursor?: string) => string
    videoDetails: (videoId: string) => string
  }
  transformers: {
    profile: ProfileTransformer<any>
    video: VideoTransformer<any>
    videosResponse: VideosResponseTransformer<any>
  }
  validators: {
    profile: (data: any) => boolean
    video: (data: any) => boolean
  }
}

// 数据转换错误类型
export interface TransformError {
  field: string
  expectedType: string
  actualValue: any
  message: string
}

export interface TransformResult<T> {
  success: boolean
  data?: T
  errors?: TransformError[]
  warnings?: string[]
}

// 平台数据验证器
export interface PlatformValidator {
  validateProfile(data: any): boolean
  validateVideo(data: any): boolean
  validateVideosResponse(data: any): boolean
  getRequiredProfileFields(): string[]
  getRequiredVideoFields(): string[]
}

// 数据映射配置
export interface FieldMapping {
  source: string | string[] // 原始字段名（支持多个可能的字段名）
  target: string // 目标字段名
  transform?: (value: any) => any // 转换函数
  required?: boolean // 是否必需
  defaultValue?: any // 默认值
}

export interface PlatformFieldMapping {
  profile: Record<string, FieldMapping>
  video: Record<string, FieldMapping>
}

// API客户端配置
export interface ApiClientConfig {
  baseURL: string
  timeout: number
  headers?: Record<string, string>
  retries?: number
  retryDelay?: number
  rateLimit?: {
    requests: number
    window: number // 毫秒
  }
}

// 适配器状态
export interface AdapterStatus {
  platform: PlatformType
  isHealthy: boolean
  lastCheck: string
  responseTime?: number
  errorCount: number
  lastError?: string
  rateLimitRemaining?: number
  rateLimitReset?: string
}

// 批量操作配置
export interface BatchOperationConfig {
  maxConcurrent: number
  delayBetween: number
  retryAttempts: number
  retryDelay: number
  timeout: number
}

// 缓存配置
export interface CacheConfig {
  enabled: boolean
  ttl: number // 缓存时间（秒）
  keyPrefix: string
  maxSize?: number // 最大缓存条目数
}

// 数据同步状态
export interface SyncStatus {
  accountId: number
  platform: PlatformType
  lastSync: string
  nextSync?: string
  status: 'idle' | 'syncing' | 'error' | 'completed'
  progress?: {
    current: number
    total: number
    percentage: number
  }
  error?: string
  videosFound: number
  videosUpdated: number
  videosAdded: number
  duration?: number // 同步耗时（毫秒）
}

// 平台能力配置
export interface PlatformCapabilities {
  supportsProfile: boolean
  supportsVideos: boolean
  supportsVideoDetails: boolean
  supportsComments: boolean
  supportsLive: boolean
  supportsStories: boolean
  supportsReels: boolean
  maxVideosPerRequest?: number
  supportedMetrics: string[]
  hasPagination: boolean
  paginationType?: 'cursor' | 'offset' | 'page'
}

// 平台特定的限制
export interface PlatformLimits {
  maxRequestsPerHour: number
  maxRequestsPerDay: number
  maxVideosPerRequest: number
  maxAccountsPerUser: number
  rateLimitWindow: number // 毫秒
  backoffMultiplier: number
  maxBackoffDelay: number // 毫秒
}

// 错误类型枚举
export enum AdapterErrorType {
  INVALID_URL = 'INVALID_URL',
  UNSUPPORTED_PLATFORM = 'UNSUPPORTED_PLATFORM',
  API_ERROR = 'API_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  TRANSFORM_ERROR = 'TRANSFORM_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR'
}

// 适配器错误类
export class AdapterError extends Error {
  public readonly type: AdapterErrorType
  public readonly platform: PlatformType
  public readonly statusCode?: number
  public readonly retryable: boolean
  public readonly originalError?: any

  constructor(
    message: string,
    type: AdapterErrorType,
    platform: PlatformType,
    options: {
      statusCode?: number
      retryable?: boolean
      originalError?: any
    } = {}
  ) {
    super(message)
    this.name = 'AdapterError'
    this.type = type
    this.platform = platform
    this.statusCode = options.statusCode
    this.retryable = options.retryable ?? this.getDefaultRetryability(type)
    this.originalError = options.originalError
  }

  private getDefaultRetryability(type: AdapterErrorType): boolean {
    switch (type) {
      case AdapterErrorType.RATE_LIMITED:
      case AdapterErrorType.NETWORK_ERROR:
      case AdapterErrorType.TIMEOUT_ERROR:
      case AdapterErrorType.API_ERROR:
        return true
      default:
        return false
    }
  }
}