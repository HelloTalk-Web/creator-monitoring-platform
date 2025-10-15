import { Router } from 'express'
import { apiKeyRateLimiter } from '../../shared/middleware/rateLimiter'
import { scraperController } from './controller/scraper.controller'

const router = Router()

// 解析URL并识别平台
router.post('/parse-url', apiKeyRateLimiter, scraperController.parseUrl.bind(scraperController))

// 抓取用户资料
router.post('/profile', apiKeyRateLimiter, scraperController.scrapeProfile.bind(scraperController))

// 抓取视频列表
router.post('/videos', apiKeyRateLimiter, scraperController.scrapeVideos.bind(scraperController))

// 抓取完整信息（用户资料 + 视频列表）
router.post('/complete', apiKeyRateLimiter, scraperController.scrapeComplete.bind(scraperController))

// 批量抓取
router.post('/batch', apiKeyRateLimiter, scraperController.batchScrape.bind(scraperController))

// 更新单个视频
router.post('/update-video', apiKeyRateLimiter, scraperController.updateVideo.bind(scraperController))

export default router