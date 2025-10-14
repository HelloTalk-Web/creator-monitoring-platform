import { Router } from 'express'
import { apiKeyRateLimiter } from '../../shared/middleware/rateLimiter'
import { videoController } from './controller/video.controller'

const router = Router()

// 获取视频列表（支持多种筛选条件）
router.get('/', apiKeyRateLimiter, videoController.getVideos.bind(videoController))

// 获取单个视频详情
router.get('/:id', apiKeyRateLimiter, videoController.getVideo.bind(videoController))

// 获取视频统计信息
router.get('/stats/summary', apiKeyRateLimiter, videoController.getVideoStats.bind(videoController))

// 获取视频趋势数据
router.get('/stats/trends', apiKeyRateLimiter, videoController.getVideoTrends.bind(videoController))

// 获取热门视频
router.get('/stats/popular', apiKeyRateLimiter, videoController.getPopularVideos.bind(videoController))

// 搜索视频
router.get('/search', apiKeyRateLimiter, videoController.searchVideos.bind(videoController))

// 获取视频性能指标
router.get('/:id/metrics', apiKeyRateLimiter, videoController.getVideoMetrics.bind(videoController))

export default router