import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

// 在环境变量加载后导入数据库和其他模块
import db from './shared/database/db'
import * as schema from './shared/database/schema'
import { logger } from './shared/utils/logger'
import { platforms } from './shared/database/schema'
import { errorHandler } from './shared/middleware/errorHandler'
import { rateLimiter } from './shared/middleware/rateLimiter'
import { requestLogger } from './shared/middleware/requestLogger'

// 导入路由
import { userRoutes } from './modules/users'
import { platformRoutes } from './modules/platforms'
// import accountRoutes from './routes/accounts'  // 暂时注释掉，文件不存在
import videoRoutes from './routes/videos'
import scrapeRoutes from './routes/scrape'
// import analyticsRoutes from './routes/analytics'  // 暂时注释掉，文件不存在
import videoMetricsHistoryRoutes from './modules/video-metrics-history/routes'

// 创建Express应用
const app = express()

// 基础中间件
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 请求限制中间件
app.use(rateLimiter)

// 请求日志中间件
app.use(requestLogger)

// API路由
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/platforms', platformRoutes)
// app.use('/api/v1/accounts', accountRoutes)  // 暂时注释掉
app.use('/api/v1/videos', videoRoutes)
app.use('/api/v1/scrape', scrapeRoutes)
app.use('/api/v1/video-metrics-history', videoMetricsHistoryRoutes)
// app.use('/api/v1/analytics', analyticsRoutes)  // 暂时注释掉

// 根据新的API文档，我们需要支持这些路径：
app.use('/api/scrape', scrapeRoutes)  // 支持前端调用的 /api/scrape/complete
app.use('/api/platforms', platformRoutes)  // 支持前端调用的 /api/platforms/accounts

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found'
    }
  })
})

// 错误处理中间件
app.use(errorHandler)

// 启动服务器
const PORT = process.env.PORT || 8000

async function startServer() {
  try {
    // 启动服务器
    app.listen(PORT, () => {
      logger.info(`Server started successfully`, {
        port: PORT,
        nodeEnv: process.env.NODE_ENV || 'development',
        pid: process.pid
      })
    })
  } catch (error) {
    logger.error('Failed to start server', {
      error: (error as Error).message,
      stack: (error as Error).stack
    })
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  process.exit(0)
})

// 启动应用
startServer()

export default app