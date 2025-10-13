import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

// 创建全局Prisma客户端实例
declare global {
  var __prisma: PrismaClient | undefined
}

// 防止在开发环境中创建多个客户端实例
const prisma = globalThis.__prisma || new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
})

// 在开发环境中将客户端保存到全局变量
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}

// 设置日志事件监听器
prisma.$on('query', (e) => {
  logger.debug('Database query', {
    query: e.query,
    params: e.params,
    duration: e.duration,
    timestamp: e.timestamp
  })
})

prisma.$on('error', (e) => {
  logger.error('Database error', {
    message: e.message,
    target: e.target,
    timestamp: e.timestamp
  })
})

prisma.$on('info', (e) => {
  logger.info('Database info', {
    message: e.message,
    target: e.target,
    timestamp: e.timestamp
  })
})

prisma.$on('warn', (e) => {
  logger.warn('Database warning', {
    message: e.message,
    target: e.target,
    timestamp: e.timestamp
  })
})

// 数据库连接测试函数
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect()
    logger.info('Database connected successfully')
  } catch (error) {
    logger.error('Failed to connect to database', {
      error: (error as Error).message,
      stack: (error as Error).stack
    })
    throw error
  }
}

// 数据库断开连接函数
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect()
    logger.info('Database disconnected successfully')
  } catch (error) {
    logger.error('Failed to disconnect from database', {
      error: (error as Error).message
    })
    throw error
  }
}

// 数据库健康检查
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    logger.error('Database health check failed', {
      error: (error as Error).message
    })
    return false
  }
}

// 导出Prisma客户端实例
export { prisma }
export default prisma

// 类型导出
export * from '@prisma/client'