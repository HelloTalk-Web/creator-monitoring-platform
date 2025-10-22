import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import * as schema from './schema'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envCandidates = [
  process.env.ENV_FILE ? path.resolve(process.env.ENV_FILE) : null,
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env')
].filter((p): p is string => Boolean(p))

const envPath = envCandidates.find(candidate => fs.existsSync(candidate))

if (envPath) {
  dotenv.config({ path: envPath })
} else {
  dotenv.config()
}

// 创建PostgreSQL连接
const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5433/creator_monitoring'

if (!connectionString) {
  throw new Error('DATABASE_URL 未配置，无法连接数据库')
}

const client = postgres(connectionString, { max: 10 })

// 创建Drizzle实例
export const db = drizzle(client, { schema })

export default db
