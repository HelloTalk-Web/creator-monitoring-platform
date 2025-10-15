import { Router } from 'express'
import scrapersRoutes from '../modules/scrapers/routes'

const router = Router()

// 使用新的爬虫模块路由，保持API兼容性
router.use('/', scrapersRoutes)

// 保持原有的任务管理接口占位符
router.get('/tasks/:taskId', (req, res) => {
  res.json({
    success: true,
    data: { task: null }
  })
})

router.delete('/tasks/:taskId', (req, res) => {
  res.json({
    success: true,
    data: { message: 'Task cancelled successfully' }
  })
})

router.get('/tasks', (req, res) => {
  res.json({
    success: true,
    data: {
      tasks: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    }
  })
})

export default router