import { Router } from 'express'
import { scraperRateLimiter } from '../shared/middleware/rateLimiter'
import scrapersRoutes from '../modules/scrapers/routes'

const router = Router()

// 使用爬虫模块的路由
router.use('/', scraperRateLimiter, scrapersRoutes)

export default router