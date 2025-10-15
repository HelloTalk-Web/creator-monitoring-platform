import { Router } from 'express'
import { videoMetricsHistoryController } from './controller/video-metrics-history.controller'

/**
 * 视频指标历史路由
 * 提供视频指标历史数据的查询接口
 */
const router = Router()

/**
 * GET /api/v1/video-metrics-history/:videoId
 * 获取视频的历史指标记录
 *
 * Query参数:
 * - startDate: 开始日期 (可选, ISO 8601格式)
 * - endDate: 结束日期 (可选, ISO 8601格式)
 * - limit: 返回记录数限制 (可选, 默认100)
 */
router.get(
  '/:videoId',
  (req, res) => videoMetricsHistoryController.getVideoHistory(req, res)
)

/**
 * GET /api/v1/video-metrics-history/:videoId/trends
 * 获取视频指标趋势数据（按时间段聚合）
 *
 * Query参数:
 * - period: 时间段 (可选, 支持: 24h, 7d, 14d, 30d, 默认7d)
 * - interval: 数据点间隔 (可选, 支持: hour, day, 默认day)
 */
router.get(
  '/:videoId/trends',
  (req, res) => videoMetricsHistoryController.getVideoTrends(req, res)
)

/**
 * POST /api/v1/video-metrics-history/latest
 * 批量获取视频的最新指标
 *
 * Body:
 * {
 *   "videoIds": [1, 2, 3, ...]
 * }
 */
router.post(
  '/latest',
  (req, res) => videoMetricsHistoryController.getLatestMetrics(req, res)
)

export default router
