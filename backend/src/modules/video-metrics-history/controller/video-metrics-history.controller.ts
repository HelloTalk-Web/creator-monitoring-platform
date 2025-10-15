import { Request, Response } from 'express'
import { logger } from '../../../shared/utils/logger'
import { videoMetricsHistoryService } from '../service/video-metrics-history.service'

/**
 * 视频指标历史控制器
 * 职责：处理视频历史指标相关的HTTP请求
 */
export class VideoMetricsHistoryController {
  /**
   * 获取视频历史数据
   * GET /api/v1/video-metrics-history/:videoId
   */
  async getVideoHistory(req: Request, res: Response) {
    try {
      const videoId = parseInt(req.params.videoId)
      const { startDate, endDate, limit } = req.query

      if (isNaN(videoId)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_VIDEO_ID',
            message: '无效的视频ID'
          }
        })
      }

      const result = await videoMetricsHistoryService.getVideoHistory({
        videoId,
        startDate: startDate as string,
        endDate: endDate as string,
        limit: limit ? parseInt(limit as string) : undefined
      })

      logger.info('Video history retrieved', {
        videoId,
        recordCount: result.history.length
      })

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      logger.error('Failed to get video history', {
        params: req.params,
        query: req.query,
        error: (error as Error).message
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取视频历史数据失败'
        }
      })
    }
  }

  /**
   * 获取视频趋势数据
   * GET /api/v1/video-metrics-history/:videoId/trends
   */
  async getVideoTrends(req: Request, res: Response) {
    try {
      const videoId = parseInt(req.params.videoId)
      const { period = '7d', interval = 'day' } = req.query

      if (isNaN(videoId)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_VIDEO_ID',
            message: '无效的视频ID'
          }
        })
      }

      // 验证period参数
      const validPeriods = ['24h', '7d', '14d', '30d']
      if (!validPeriods.includes(period as string)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PERIOD',
            message: '无效的时间段参数，支持: 24h, 7d, 14d, 30d'
          }
        })
      }

      // 验证interval参数
      const validIntervals = ['hour', 'day']
      if (!validIntervals.includes(interval as string)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INTERVAL',
            message: '无效的间隔参数，支持: hour, day'
          }
        })
      }

      const result = await videoMetricsHistoryService.getVideoTrends({
        videoId,
        period: period as '24h' | '7d' | '14d' | '30d',
        interval: interval as 'hour' | 'day'
      })

      logger.info('Video trends retrieved', {
        videoId,
        period,
        dataPoints: result.trends.length
      })

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      logger.error('Failed to get video trends', {
        params: req.params,
        query: req.query,
        error: (error as Error).message
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取视频趋势数据失败'
        }
      })
    }
  }

  /**
   * 批量获取视频的最新指标
   * POST /api/v1/video-metrics-history/latest
   */
  async getLatestMetrics(req: Request, res: Response) {
    try {
      const { videoIds } = req.body

      if (!Array.isArray(videoIds) || videoIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_VIDEO_IDS',
            message: '请提供视频ID数组'
          }
        })
      }

      // 验证所有ID都是数字
      const validVideoIds = videoIds.filter(id => typeof id === 'number' && !isNaN(id))
      if (validVideoIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_VIDEO_IDS',
            message: '视频ID必须是数字'
          }
        })
      }

      const metricsMap = await videoMetricsHistoryService.getLatestMetrics(validVideoIds)

      // 转换Map为对象
      const metricsObject: Record<number, any> = {}
      metricsMap.forEach((value, key) => {
        metricsObject[key] = value
      })

      logger.info('Latest metrics retrieved', {
        videoCount: validVideoIds.length,
        foundCount: metricsMap.size
      })

      res.json({
        success: true,
        data: {
          metrics: metricsObject,
          requestedCount: validVideoIds.length,
          foundCount: metricsMap.size
        }
      })
    } catch (error) {
      logger.error('Failed to get latest metrics', {
        body: req.body,
        error: (error as Error).message
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取最新指标失败'
        }
      })
    }
  }
}

// 导出单例
export const videoMetricsHistoryController = new VideoMetricsHistoryController()
