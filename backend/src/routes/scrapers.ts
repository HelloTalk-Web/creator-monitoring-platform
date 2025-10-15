import { Router } from 'express'
import scrapersRoutes from '../modules/scrapers/routes'

const router = Router()

// 使用爬虫模块的路由
router.use('/', scrapersRoutes)

export default router