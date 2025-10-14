import { Router } from 'express'
import { rateLimiter } from '../shared/middleware/rateLimiter'
import videosRoutes from '../modules/videos/routes'

const router = Router()

// 使用视频模块的路由
router.use('/', rateLimiter, videosRoutes)

export default router