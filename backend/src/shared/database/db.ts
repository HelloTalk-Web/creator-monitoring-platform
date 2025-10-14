import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// 创建PostgreSQL连接
const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString, { max: 10 })

// 创建Drizzle实例
export const db = drizzle(client, { schema })

export default db