import postgres from 'postgres'

console.log('🔍 开始数据库连接测试...')

// 测试连接字符串
const connectionString = "postgresql://postgres:postgres@localhost:5433/creator_monitoring"
console.log(`📡 连接字符串: ${connectionString.replace(/:([^:@]+)@/, ':***@')}`)

async function testConnection() {
  let client

  try {
    console.log('📝 创建数据库客户端...')

    // 使用更简单的配置创建客户端
    client = postgres(connectionString, {
      max: 1,
      connect_timeout: 10,
      idle_timeout: 5,
      max_lifetime: 30
    })

    console.log('⏳ 尝试连接数据库...')

    // 简单的连接测试
    const result = await client`SELECT version()`
    console.log('✅ 数据库连接成功!')
    console.log('📊 PostgreSQL版本:', result[0].version)

    // 检查数据库是否存在
    const dbList = await client`SELECT datname FROM pg_database WHERE datname = 'creator_monitoring'`
    if (dbList.length > 0) {
      console.log('✅ 数据库 creator_monitoring 存在')
    } else {
      console.log('❌ 数据库 creator_monitoring 不存在')
      console.log('💡 尝试创建数据库...')

      // 连接到默认数据库创建目标数据库
      const defaultClient = postgres("postgresql://postgres:postgres@localhost:5433/postgres", {
        connect_timeout: 10
      })

      await defaultClient`CREATE DATABASE "creator_monitoring"`
      await defaultClient.end()
      console.log('✅ 数据库创建成功')
    }

    // 测试表是否存在
    try {
      const tables = await client`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_catalog = 'creator_monitoring'
      `
      console.log('📋 现有数据表:', tables.map(t => t.table_name))
    } catch (err) {
      console.log('⚠️  无法查询表结构:', err.message)
    }

  } catch (error) {
    console.error('❌ 数据库连接失败:')
    console.error('   错误类型:', error.constructor.name)
    console.error('   错误信息:', error.message)
    console.error('   错误代码:', error.code)

    if (error.message.includes('does not exist')) {
      console.log('💡 提示: 数据库不存在，需要先创建数据库')
    } else if (error.message.includes('Connection refused')) {
      console.log('💡 提示: PostgreSQL服务未启动或端口错误')
    } else if (error.message.includes('authentication')) {
      console.log('💡 提示: 用户名或密码错误')
    }

  } finally {
    if (client) {
      await client.end()
      console.log('🔌 数据库连接已关闭')
    }
  }
}

// 执行测试
testConnection().then(() => {
  console.log('🏁 测试完成')
  process.exit(0)
}).catch(error => {
  console.error('💥 测试失败:', error)
  process.exit(1)
})