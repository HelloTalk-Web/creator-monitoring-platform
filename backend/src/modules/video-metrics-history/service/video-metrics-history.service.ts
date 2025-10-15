import { logger } from '../../../shared/utils/logger'
import { db } from '../../../shared/database/db'
import { videoMetricsHistory, videos } from '../../../shared/database/schema'
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm'
import type { VideoMetricsHistoryItem, VideoMetricsHistoryQuery, VideoMetricsTrendQuery } from '../types'

/**
 * 视频指标历史服务
 * 职责：查询和分析视频指标的历史数据
 */
export class VideoMetricsHistoryService {
  /**
   * 获取视频的历史指标记录
   */
  async getVideoHistory(query: VideoMetricsHistoryQuery): Promise<{
    videoId: number
    history: VideoMetricsHistoryItem[]
    stats: {
      totalRecords: number
      dateRange: {
        start: string | null
        end: string | null
      }
      growth: {
        viewCount: number
        likeCount: number
        commentCount: number
        shareCount: number
        saveCount: number
      }
    }
  }> {
    const { videoId, startDate, endDate, limit = 100 } = query

    try {
      // 构建查询条件
      const conditions = [eq(videoMetricsHistory.videoId, videoId)]

      if (startDate) {
        conditions.push(gte(videoMetricsHistory.recordedAt, new Date(startDate)))
      }

      if (endDate) {
        conditions.push(lte(videoMetricsHistory.recordedAt, new Date(endDate)))
      }

      const whereClause = and(...conditions)

      // 查询历史记录
      const historyRecords = await db
        .select()
        .from(videoMetricsHistory)
        .where(whereClause)
        .orderBy(desc(videoMetricsHistory.recordedAt))
        .limit(limit)

      // 转换BigInt为Number
      const history: VideoMetricsHistoryItem[] = historyRecords.map(record => ({
        id: record.id,
        videoId: record.videoId,
        viewCount: Number(record.viewCount || 0),
        likeCount: Number(record.likeCount || 0),
        commentCount: Number(record.commentCount || 0),
        shareCount: Number(record.shareCount || 0),
        saveCount: Number(record.saveCount || 0),
        recordedAt: record.recordedAt?.toISOString() || new Date().toISOString()
      }))

      // 计算统计信息
      const stats = this.calculateStats(history)

      logger.info('Video history retrieved successfully', {
        videoId,
        recordCount: history.length
      })

      return {
        videoId,
        history,
        stats
      }
    } catch (error) {
      logger.error('Failed to get video history', {
        videoId,
        error: (error as Error).message
      })
      throw new Error('获取视频历史数据失败')
    }
  }

  /**
   * 获取视频指标趋势（按时间段聚合）
   */
  async getVideoTrends(query: VideoMetricsTrendQuery): Promise<{
    videoId: number
    period: string
    interval: string
    trends: Array<{
      timestamp: string
      viewCount: number
      likeCount: number
      commentCount: number
      shareCount: number
      saveCount: number
    }>
  }> {
    const { videoId, period, interval = 'day' } = query

    try {
      // 计算时间范围
      const endDate = new Date()
      const startDate = this.calculateStartDate(period)

      // 根据interval决定分组方式
      const dateFormat = interval === 'hour' ? 'YYYY-MM-DD HH24:00:00' : 'YYYY-MM-DD'

      // 查询并分组聚合数据
      const trendsData = await db
        .select({
          timestamp: sql<string>`TO_CHAR(${videoMetricsHistory.recordedAt}, ${dateFormat})`,
          viewCount: sql<string>`AVG(${videoMetricsHistory.viewCount})::bigint`,
          likeCount: sql<string>`AVG(${videoMetricsHistory.likeCount})::bigint`,
          commentCount: sql<string>`AVG(${videoMetricsHistory.commentCount})::bigint`,
          shareCount: sql<string>`AVG(${videoMetricsHistory.shareCount})::bigint`,
          saveCount: sql<string>`AVG(${videoMetricsHistory.saveCount})::bigint`
        })
        .from(videoMetricsHistory)
        .where(
          and(
            eq(videoMetricsHistory.videoId, videoId),
            gte(videoMetricsHistory.recordedAt, startDate),
            lte(videoMetricsHistory.recordedAt, endDate)
          )
        )
        .groupBy(sql`TO_CHAR(${videoMetricsHistory.recordedAt}, ${dateFormat})`)
        .orderBy(sql`TO_CHAR(${videoMetricsHistory.recordedAt}, ${dateFormat})`)

      // 转换数据类型
      const trends = trendsData.map(record => ({
        timestamp: record.timestamp,
        viewCount: Number(record.viewCount || 0),
        likeCount: Number(record.likeCount || 0),
        commentCount: Number(record.commentCount || 0),
        shareCount: Number(record.shareCount || 0),
        saveCount: Number(record.saveCount || 0)
      }))

      logger.info('Video trends retrieved successfully', {
        videoId,
        period,
        dataPoints: trends.length
      })

      return {
        videoId,
        period,
        interval,
        trends
      }
    } catch (error) {
      logger.error('Failed to get video trends', {
        videoId,
        period,
        error: (error as Error).message
      })
      throw new Error('获取视频趋势数据失败')
    }
  }

  /**
   * 获取多个视频的最新指标快照
   */
  async getLatestMetrics(videoIds: number[]): Promise<Map<number, VideoMetricsHistoryItem>> {
    try {
      const latestMetrics = new Map<number, VideoMetricsHistoryItem>()

      for (const videoId of videoIds) {
        const latest = await db
          .select()
          .from(videoMetricsHistory)
          .where(eq(videoMetricsHistory.videoId, videoId))
          .orderBy(desc(videoMetricsHistory.recordedAt))
          .limit(1)

        if (latest.length > 0) {
          const record = latest[0]
          latestMetrics.set(videoId, {
            id: record.id,
            videoId: record.videoId,
            viewCount: Number(record.viewCount || 0),
            likeCount: Number(record.likeCount || 0),
            commentCount: Number(record.commentCount || 0),
            shareCount: Number(record.shareCount || 0),
            saveCount: Number(record.saveCount || 0),
            recordedAt: record.recordedAt?.toISOString() || new Date().toISOString()
          })
        }
      }

      return latestMetrics
    } catch (error) {
      logger.error('Failed to get latest metrics', {
        videoIds,
        error: (error as Error).message
      })
      throw new Error('获取最新指标失败')
    }
  }

  /**
   * 计算统计信息
   */
  private calculateStats(history: VideoMetricsHistoryItem[]) {
    if (history.length === 0) {
      return {
        totalRecords: 0,
        dateRange: {
          start: null,
          end: null
        },
        growth: {
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
          shareCount: 0,
          saveCount: 0
        }
      }
    }

    // 按时间排序（最早的在前）
    const sortedHistory = [...history].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    )

    const earliest = sortedHistory[0]
    const latest = sortedHistory[sortedHistory.length - 1]

    return {
      totalRecords: history.length,
      dateRange: {
        start: earliest.recordedAt,
        end: latest.recordedAt
      },
      growth: {
        viewCount: latest.viewCount - earliest.viewCount,
        likeCount: latest.likeCount - earliest.likeCount,
        commentCount: latest.commentCount - earliest.commentCount,
        shareCount: latest.shareCount - earliest.shareCount,
        saveCount: latest.saveCount - earliest.saveCount
      }
    }
  }

  /**
   * 根据period计算开始日期
   */
  private calculateStartDate(period: string): Date {
    const now = new Date()
    const startDate = new Date(now)

    switch (period) {
      case '24h':
        startDate.setHours(now.getHours() - 24)
        break
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '14d':
        startDate.setDate(now.getDate() - 14)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      default:
        startDate.setDate(now.getDate() - 7) // 默认7天
    }

    return startDate
  }
}

// 导出单例
export const videoMetricsHistoryService = new VideoMetricsHistoryService()
