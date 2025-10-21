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

// 导入事件监听器和调度器
import { videoHistoryListener } from './modules/video-metrics-history/listeners/video-history.listener'
import { videoRefreshScheduler } from './shared/scheduler/video-refresh.scheduler'

// 导入路由
import { userRoutes } from './modules/users'
import { platformRoutes } from './modules/platforms'
// import accountRoutes from './routes/accounts'  // 暂时注释掉，文件不存在
import videoRoutes from './routes/videos'
import scrapeRoutes from './routes/scrape'
import dashboardRoutes from './routes/dashboard'
// import analyticsRoutes from './routes/analytics'  // 暂时注释掉，文件不存在
import videoMetricsHistoryRoutes from './modules/video-metrics-history/routes'
import imageProxyRoutes from './routes/image-proxy'

// 创建Express应用
const app = express()

// 基础中间件
app.use(helmet())
app.use(cors({
  origin: '*',
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
app.use('/api/dashboard', dashboardRoutes)  // 仪表板统计数据
app.use('/api/image-proxy', imageProxyRoutes)  // 图片代理服务

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
    // 注册事件监听器
    videoHistoryListener.register()
    logger.info('Event listeners registered successfully')

    // 启动定时任务调度器(默认关闭,需要通过环境变量启用)
    // 设置 ENABLE_AUTO_REFRESH=true 启用自动刷新
    // 通过 VIDEO_REFRESH_SCHEDULE 配置刷新时间 (默认每天凌晨2点)
    if (process.env.ENABLE_AUTO_REFRESH === 'true') {
      const schedule = process.env.VIDEO_REFRESH_SCHEDULE || '0 2 * * *'
      videoRefreshScheduler.start(schedule)
      logger.info('Video refresh scheduler started', { schedule })
    } else {
      logger.info('Video refresh scheduler is disabled (set ENABLE_AUTO_REFRESH=true to enable)')
    }

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
  videoRefreshScheduler.stop()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  videoRefreshScheduler.stop()
  process.exit(0)
})

// 启动应用
startServer()

export default app