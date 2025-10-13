import { Router } from 'express'
import { authenticateToken, requirePlan } from '../middleware/auth'
import { apiKeyRateLimiter } from '../middleware/rateLimiter'
import { analyticsController } from '../controllers/analyticsController'

const router = Router()

// 所有分析路由都需要认证
router.use(authenticateToken)

// 获取用户概览数据
router.get('/overview', requirePlan('basic'), apiKeyRateLimiter, analyticsController.getOverview)

// 获取账号统计
router.get('/accounts/:id/stats', requirePlan('basic'), apiKeyRateLimiter, analyticsController.getAccountStats)

// 获取视频表现趋势
router.get('/videos/trends', requirePlan('basic'), apiKeyRateLimiter, analyticsController.getVideoTrends)

// 获取平台对比数据
router.get('/platforms/compare', requirePlan('pro'), apiKeyRateLimiter, analyticsController.getPlatformComparison)

// 获取热门内容分析
router.get('/content/top', requirePlan('pro'), apiKeyRateLimiter, analyticsController.getTopContent)

// 获取增长数据
router.get('/growth', requirePlan('basic'), apiKeyRateLimiter, analyticsController.getGrowthData)

// 获取导出数据
router.get('/export', requirePlan('pro'), apiKeyRateLimiter, analyticsController.exportData)

// 获取实时数据
router.get('/realtime', requirePlan('enterprise'), apiKeyRateLimiter, analyticsController.getRealtimeData)

export default router