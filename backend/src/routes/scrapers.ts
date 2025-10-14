import { Router } from 'express'
import { scrapeRateLimiter } from '../shared/middleware/rateLimiter'
import scrapersRoutes from '../modules/scrapers/routes'

const router = Router()

// 使用爬虫模块的路由
router.use('/', scrapeRateLimiter, scrapersRoutes)

export default router