import { Router } from 'express'
import { scraperController } from './controller/scraper.controller'

const router = Router()

// 解析URL并识别平台
router.post('/parse-url', scraperController.parseUrl.bind(scraperController))

// 抓取用户资料
router.post('/profile', scraperController.scrapeProfile.bind(scraperController))

// 抓取视频列表
router.post('/videos', scraperController.scrapeVideos.bind(scraperController))

// 抓取完整信息（用户资料 + 视频列表）
router.post('/complete', scraperController.scrapeComplete.bind(scraperController))

// 批量抓取
router.post('/batch', scraperController.batchScrape.bind(scraperController))

// 更新单个视频
router.post('/update-video', scraperController.updateVideo.bind(scraperController))

// 获取API密钥积分余额
router.get('/credit-balance', scraperController.getCreditBalance.bind(scraperController))

export default router