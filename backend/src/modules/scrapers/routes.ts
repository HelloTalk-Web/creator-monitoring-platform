import { Router } from 'express'
import { scraperController } from './controller/scraper.controller'
// import { refreshController } from './controller/refresh.controller'

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

// 批量重新爬取账号
router.post('/refresh/accounts', scraperController.refreshAccounts.bind(scraperController))

// 更新单个视频
router.post('/update-video', scraperController.updateVideo.bind(scraperController))

// 获取API密钥积分余额
router.get('/credit-balance', scraperController.getCreditBalance.bind(scraperController))

// ========== 手动刷新相关路由 ==========
// TODO: 实现 refresh.controller 后再启用这些路由

// 刷新单个账号的视频数据
// router.post('/refresh/account/:accountId', refreshController.refreshAccount.bind(refreshController))

// 刷新所有账号的视频数据
// router.post('/refresh/all', refreshController.refreshAllAccounts.bind(refreshController))

// 获取刷新调度器状态
// router.get('/refresh/status', refreshController.getSchedulerStatus.bind(refreshController))

export default router
