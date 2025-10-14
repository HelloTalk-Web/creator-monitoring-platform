import { Video } from '../../../shared/database/schema'

/**
 * 序列化后的视频数据(BigInt转为number用于JSON)
 */
export type SerializedVideo = Omit<Video, 'viewCount' | 'likeCount' | 'commentCount' | 'shareCount' | 'saveCount'> & {
  viewCount: number | null
  likeCount: number | null
  commentCount: number | null
  shareCount: number | null
  saveCount: number | null
}

/**
 * 视频查询参数
 */
export interface VideoQueryParams {
  accountId?: number
  platformVideoId?: string
  title?: string
  tags?: string[]
  publishedAfter?: string
  publishedBefore?: string
  minViewCount?: number
  maxViewCount?: number
  minLikeCount?: number
  maxLikeCount?: number
  sortBy?: 'publishedAt' | 'viewCount' | 'likeCount' | 'commentCount' | 'shareCount' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

/**
 * 视频列表响应
 */
export interface VideosListResponse {
  videos: SerializedVideo[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * 视频统计信息
 */
export interface VideoStats {
  totalVideos: number
  totalViews: number
  totalLikes: number
  totalComments: number
  totalShares: number
  avgViews: number
  avgLikes: number
  avgComments: number
  avgShares: number
  mostViewedVideo?: Video
  mostLikedVideo?: Video
  mostCommentedVideo?: Video
  latestVideo?: Video
}

/**
 * 视频趋势数据
 */
export interface VideoTrends {
  daily: Array<{
    date: string
    videoCount: number
    totalViews: number
    totalLikes: number
  }>
  weekly: Array<{
    week: string
    videoCount: number
    totalViews: number
    totalLikes: number
  }>
  monthly: Array<{
    month: string
    videoCount: number
    totalViews: number
    totalLikes: number
  }>
}

/**
 * 视频性能指标
 */
export interface VideoMetrics {
  viewEngagement: number // 观看参与度 (likes+comments)/views
  likeRate: number // 点赞率 likes/views
  commentRate: number // 评论率 comments/views
  shareRate: number // 分享率 shares/views
  performance: 'excellent' | 'good' | 'average' | 'poor'
}

/**
 * 扩展的视频信息（包含性能指标）
 */
export interface VideoWithMetrics extends Video {
  metrics: VideoMetrics
}