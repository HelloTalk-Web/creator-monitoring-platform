import { db } from './src/shared/database/db'
import { creatorAccounts, videos, platforms } from './src/shared/database/schema'
import { count } from 'drizzle-orm'

console.log('🔍 开始测试 Drizzle ORM 查询...')

async function testDrizzleQuery() {
  try {
    console.log('📊 测试统计查询...')

    // 测试简单的count查询
    const accountCountResult = await db
      .select({ count: count() })
      .from(creatorAccounts)

    console.log('✅ 统计查询成功:', accountCountResult)

    // 测试videos表查询
    console.log('📹 测试视频查询...')
    const videoResults = await db
      .select({
        id: videos.id,
        title: videos.title,
        displayName: creatorAccounts.displayName,
      })
      .from(videos)
      .leftJoin(creatorAccounts, eq(videos.accountId, creatorAccounts.id))
      .limit(5)

    console.log('✅ 视频查询成功:', videoResults.length, '条记录')

    console.log('🎉 所有测试通过!')

  } catch (error) {
    console.error('❌ 查询失败:')
    console.error('   错误类型:', error.constructor.name)
    console.error('   错误信息:', error.message)
    console.error('   错误堆栈:', error.stack)
  } finally {
    console.log('🔌 关闭连接...')
    process.exit(0)
  }
}

// 导入需要的函数
import { eq } from 'drizzle-orm'

// 执行测试
testDrizzleQuery()