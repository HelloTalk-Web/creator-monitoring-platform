/**
 * 视频指标历史模块类型定义
 */

export interface VideoMetricsHistoryQuery {
  videoId: number
  startDate?: string  // ISO 8601 格式
  endDate?: string    // ISO 8601 格式
  limit?: number
}

export interface VideoMetricsHistoryItem {
  id: number
  videoId: number
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  saveCount: number
  recordedAt: string  // ISO 8601 格式
}

export interface VideoMetricsHistoryResponse {
  success: boolean
  data: {
    videoId: number
    history: VideoMetricsHistoryItem[]
    stats?: {
      totalRecords: number
      dateRange: {
        start: string
        end: string
      }
      growth?: {
        viewCount: number
        likeCount: number
        commentCount: number
        shareCount: number
        saveCount: number
      }
    }
  }
  error?: {
    code: string
    message: string
  }
}

export interface VideoMetricsTrendQuery {
  videoId: number
  period: '24h' | '7d' | '14d' | '30d'  // 时间段
  interval?: 'hour' | 'day'  // 数据点间隔
}

export interface VideoMetricsTrendPoint {
  timestamp: string
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  saveCount: number
}

export interface VideoMetricsTrendResponse {
  success: boolean
  data: {
    videoId: number
    period: string
    interval: string
    trends: VideoMetricsTrendPoint[]
  }
  error?: {
    code: string
    message: string
  }
}
