import { Router } from 'express'
import { authenticateToken, requirePlan } from '../middleware/auth'
import { scrapeRateLimiter } from '../middleware/rateLimiter'
import { scrapeController } from '../controllers/scrapeController'

const router = Router()

// 所有抓取路由都需要认证
router.use(authenticateToken)

// 解析URL并识别平台
router.post('/parse-url', requirePlan('free'), scrapeRateLimiter, scrapeController.parseUrl)

// 获取创作者资料
router.post('/profile', requirePlan('basic'), scrapeRateLimiter, scrapeController.getProfile)

// 获取创作者视频列表
router.post('/videos', requirePlan('basic'), scrapeRateLimiter, scrapeController.getVideos)

// 获取视频详情
router.post('/video-details', requirePlan('basic'), scrapeRateLimiter, scrapeController.getVideoDetails)

// 批量抓取多个账号
router.post('/batch', requirePlan('pro'), scrapeRateLimiter, scrapeController.batchScrape)

// 获取抓取任务状态
router.get('/tasks/:taskId', scrapeController.getTaskStatus)

// 取消抓取任务
router.delete('/tasks/:taskId', requirePlan('basic'), scrapeController.cancelTask)

// 获取用户的抓取历史
router.get('/tasks', scrapeController.getTaskHistory)

export default router