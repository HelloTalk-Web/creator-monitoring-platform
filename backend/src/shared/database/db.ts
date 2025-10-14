import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import { logger } from '../utils/logger'

// 创建PostgreSQL连接
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/creator_monitoring'
const client = postgres(connectionString, { max: 10 })

// 创建Drizzle实例
export const db = drizzle(client, { schema })

// 测试数据库连接
async function testDatabaseConnection() {
  try {
    await client`SELECT 1`
    logger.info('Database connection established successfully')
  } catch (error) {
    logger.error('Database connection failed', {
      connectionString: connectionString.replace(/:([^:@]+)@/, ':***@'), // 隐藏密码
      error: (error as Error).message
    })
  }
}

// 立即测试连接
testDatabaseConnection()

export default db