import { Router } from 'express'
import { authenticateToken, optionalAuth, requirePlan } from '../middleware/auth'
import { apiKeyRateLimiter } from '../middleware/rateLimiter'
import { videoController } from '../controllers/videoController'

const router = Router()

// 大部分视频路由需要认证，但有一些可以公开访问
router.use(optionalAuth)

// 获取视频列表（支持过滤和分页）
router.get('/', apiKeyRateLimiter, videoController.getVideos)

// 获取单个视频详情
router.get('/:id', apiKeyRateLimiter, videoController.getVideo)

// 获取视频的历史指标数据
router.get('/:id/metrics', apiKeyRateLimiter, videoController.getVideoMetrics)

// 需要认证的路由
router.use(authenticateToken)

// 更新视频信息
router.put('/:id', requirePlan('basic'), apiKeyRateLimiter, videoController.updateVideo)

// 删除视频
router.delete('/:id', requirePlan('basic'), apiKeyRateLimiter, videoController.deleteVideo)

// 批量更新视频
router.put('/batch', requirePlan('pro'), apiKeyRateLimiter, videoController.batchUpdateVideos)

// 搜索视频
router.get('/search', apiKeyRateLimiter, videoController.searchVideos)

export default router