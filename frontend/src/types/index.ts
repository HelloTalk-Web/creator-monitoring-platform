// 平台类型
export type PlatformType = 'tiktok' | 'instagram' | 'youtube' | 'facebook' | 'xiaohongshu' | 'douyin'

// 平台信息
export interface Platform {
  id: number
  name: PlatformType
  displayName: string
  baseUrl: string
  urlPattern: string
  colorCode: string
  iconUrl?: string
  rateLimit: number
  supportedFeatures: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 账号状态
export type AccountStatus = 'active' | 'paused' | 'deleted' | 'error'

// 创作者账号
export interface CreatorAccount {
  id: number
  userId: number
  platformId: number
  platformUserId: string
  username: string
  displayName?: string
  profileUrl: string
  avatarUrl?: string
  bio?: string
  followerCount: number
  followingCount: number
  totalVideos: number
  isVerified: boolean
  status: AccountStatus
  lastScrapedAt?: string
  lastVideoCrawlAt?: string
  scrapeFrequency: number
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string

  // 关联的平台信息
  platform?: Platform
}

// 视频数据
export interface Video {
  id: number
  accountId: number
  platformVideoId: string
  title: string
  description?: string
  videoUrl: string
  thumbnailUrl?: string
  thumbnailLocalPath?: string
  duration?: number
  publishedAt: string
  tags: string[]

  // 互动数据
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  saveCount: number

  // 数据追踪
  firstScrapedAt: string
  lastUpdatedAt: string
  dataSource: 'api' | 'manual' | 'upload'
  metadata: Record<string, any>

  // 关联信息
  account?: CreatorAccount
}

// 视频指标历史
export interface VideoMetricsHistory {
  id: number
  videoId: number
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  saveCount: number
  recordedAt: string
}

// 抓取任务类型
export type TaskType = 'initial_scrape' | 'refresh_scrape' | 'single_video'

// 任务状态
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

// 抓取任务
export interface ScrapeTask {
  id: number
  userId: number
  accountId?: number
  taskType: TaskType
  status: TaskStatus
  priority: number
  config: Record<string, any>
  startedAt?: string
  completedAt?: string
  errorMessage?: string
  retryCount: number
  maxRetries: number
  totalVideosFound: number
  newVideosAdded: number
  videosUpdated: number
  createdAt: string
  updatedAt: string

  // 关联信息
  account?: CreatorAccount
}

// 统计数据
export interface AccountStats {
  id: number
  username: string
  displayName?: string
  platformName: string
  platformDisplayName: string
  followerCount: number
  totalVideos: number
  videoCount: number
  totalViews: number
  totalLikes: number
  totalComments: number
  latestVideoDate?: string
  lastScrapedAt?: string
  status: AccountStatus
}

// 用户统计
export interface UserStats {
  id: number
  username: string
  planType: string
  accountCount: number
  activeAccounts: number
  totalVideos: number
  daysWithContent: number
  totalViews: number
  apiQuota: number
  apiUsed: number
  createdAt: string
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

// 查询参数
export interface AccountQueryParams extends PaginationParams {
  platform?: PlatformType
  status?: AccountStatus
  search?: string
}

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

// 更新账号请求
export interface UpdateAccountRequest {
  displayName?: string
  status?: AccountStatus
  scrapeFrequency?: number
}

// 系统配置
export interface SystemConfig {
  scrapeLimits: {
    dailyPerUser: number
    hourlyPerAccount: number
    concurrentPerUser: number
  }
  dataRetention: {
    videoMetricsDays: number
    taskLogsDays: number
  }
  apiSettings: {
    timeout: number
    retryAttempts: number
    rateLimitWindow: number
  }
}

// 用户信息
export interface User {
  id: number
  email: string
  username: string
  avatarUrl?: string
  planType: string
  apiQuota: number
  apiUsed: number
  status: string
  preferences: Record<string, any>
  createdAt: string
  updatedAt: string
}

// 表格列配置
export interface TableColumn {
  prop: string
  label: string
  width?: string | number
  minWidth?: string | number
  sortable?: boolean
  formatter?: (row: any, column: any, cellValue: any) => string
  align?: 'left' | 'center' | 'right'
}