import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { prisma, connectDatabase, disconnectDatabase } from './database/prisma'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'
import { rateLimiter } from './middleware/rateLimiter'
import { requestLogger } from './middleware/requestLogger'

// 导入路由
import authRoutes from './routes/auth'
import accountRoutes from './routes/accounts'
import videoRoutes from './routes/videos'
import scrapeRoutes from './routes/scrape'
import analyticsRoutes from './routes/analytics'

// 加载环境变量
dotenv.config()

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
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/accounts', accountRoutes)
app.use('/api/v1/videos', videoRoutes)
app.use('/api/v1/scrape', scrapeRoutes)
app.use('/api/v1/analytics', analyticsRoutes)

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
    // 初始化数据库连接
    await connectDatabase()
    logger.info('Database connection initialized')

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
  await disconnectDatabase()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  await disconnectDatabase()
  process.exit(0)
})

// 启动应用
startServer()

export default app