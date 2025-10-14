import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { logger } from '../utils/logger'

async function runMigrations() {
  try {
    logger.info('开始运行数据库迁移...')

    // 创建数据库连接
    const connectionString = process.env.DATABASE_URL!
    const client = postgres(connectionString, { max: 1 })
    const db = drizzle(client)

    // 运行迁移
    await migrate(db, { migrationsFolder: './drizzle/migrations' })

    logger.info('数据库迁移完成!')

    // 关闭连接
    await client.end()
    process.exit(0)
  } catch (error) {
    logger.error('数据库迁移失败:', {
      error: (error as Error).message,
      stack: (error as Error).stack
    })
    process.exit(1)
  }
}

runMigrations()