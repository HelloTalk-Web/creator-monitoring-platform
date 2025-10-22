import { createClient } from '@libsql/client/web'

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // 设置 CORS 头
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // 健康检查
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'database-test-worker',
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      })
    }

    // 数据库连接测试
    if (url.pathname === '/test-db') {
      return await testDatabaseConnection(corsHeaders)
    }

    // 基本查询测试
    if (url.pathname === '/test-query') {
      return await testDatabaseQuery(corsHeaders)
    }

    // 测试 creator_accounts 表结构
    if (url.pathname === '/test-schema') {
      return await testDatabaseSchema(corsHeaders)
    }

    // 获取账号列表
    if (url.pathname === '/accounts') {
      return await getAccounts(corsHeaders, url)
    }

    return new Response(JSON.stringify({
      service: 'Database Test Worker',
      endpoints: [
        '/health - 健康检查',
        '/test-db - 数据库连接测试',
        '/test-query - 基本查询测试',
        '/test-schema - 表结构测试',
        '/accounts - 获取账号列表'
      ],
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  }
}

async function testDatabaseConnection(corsHeaders) {
  try {
    console.log('开始测试数据库连接...')

    const client = createClient({
      url: env.DATABASE_URL || 'libsql://117.72.221.238:5433/creator_monitoring?tls=0',
      authToken: env.DATABASE_AUTH_TOKEN || 'postgres:postgres'
    })

    // 简单连接测试
    const result = await client.execute('SELECT 1 as test, NOW() as current_time')

    console.log('数据库连接成功:', result)

    return new Response(JSON.stringify({
      success: true,
      message: '数据库连接成功',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })

  } catch (error) {
    console.error('数据库连接失败:', error)

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  }
}

async function testDatabaseQuery(corsHeaders) {
  try {
    console.log('开始测试数据库查询...')

    const client = createClient({
      url: env.DATABASE_URL || 'libsql://117.72.221.238:5433/creator_monitoring?tls=0',
      authToken: env.DATABASE_AUTH_TOKEN || 'postgres:postgres'
    })

    // 测试查询 creator_accounts 表
    const result = await client.execute('SELECT COUNT(*) as count FROM creator_accounts')

    console.log('查询结果:', result)

    return new Response(JSON.stringify({
      success: true,
      message: '查询成功',
      data: {
        accountCount: result.rows[0].count,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })

  } catch (error) {
    console.error('数据库查询失败:', error)

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: {
        name: error.name,
        message: error.message
      },
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  }
}

async function testDatabaseSchema(corsHeaders) {
  try {
    console.log('开始测试数据库表结构...')

    const client = createClient({
      url: env.DATABASE_URL || 'libsql://117.72.221.238:5433/creator_monitoring?tls=0',
      authToken: env.DATABASE_AUTH_TOKEN || 'postgres:postgres'
    })

    // 查询表结构
    const tables = await client.execute(`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    // 查询 creator_accounts 表结构
    let columns = []
    try {
      columns = await client.execute(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'creator_accounts'
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `)
    } catch (e) {
      console.log('查询 creator_accounts 表结构失败:', e)
    }

    return new Response(JSON.stringify({
      success: true,
      message: '表结构查询成功',
      data: {
        tables: tables.rows,
        creatorAccountsColumns: columns.rows || [],
        timestamp: new Date().toISOString()
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })

  } catch (error) {
    console.error('表结构查询失败:', error)

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  }
}

async function getAccounts(corsHeaders, url) {
  try {
    console.log('开始获取账号列表...')

    const client = createClient({
      url: env.DATABASE_URL || 'libsql://117.72.221.238:5433/creator_monitoring?tls=0',
      authToken: env.DATABASE_AUTH_TOKEN || 'postgres:postgres'
    })

    const limit = parseInt(url.searchParams.get('limit') || '10')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // 查询账号列表
    const result = await client.execute(`
      SELECT
        ca.id,
        ca.username,
        ca.display_name,
        ca.follower_count,
        ca.created_at,
        p.name as platform_name,
        p.display_name as platform_display_name
      FROM creator_accounts ca
      LEFT JOIN platforms p ON ca.platform_id = p.id
      ORDER BY ca.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    console.log('账号查询结果:', result.rows.length, '条记录')

    return new Response(JSON.stringify({
      success: true,
      message: '账号列表获取成功',
      data: result.rows,
      pagination: {
        limit,
        offset,
        count: result.rows.length
      },
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })

  } catch (error) {
    console.error('获取账号列表失败:', error)

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  }
}