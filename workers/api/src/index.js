// Cloudflare Workers API 入口文件
import { createClient } from '@libsql/client'

// 创建路由器
class Router {
  constructor() {
    this.routes = new Map()
  }

  get(path, handler) {
    this.routes.set(`GET:${path}`, handler)
  }

  post(path, handler) {
    this.routes.set(`POST:${path}`, handler)
  }

  delete(path, handler) {
    this.routes.set(`DELETE:${path}`, handler)
  }

  async handle(request, env, ctx) {
    const url = new URL(request.url)
    const method = request.method
    const key = `${method}:${url.pathname}`

    // CORS 预检处理
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        }
      })
    }

    // 设置CORS头
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    }

    const handler = this.routes.get(key)
    if (handler) {
      return await handler(request, env, ctx, corsHeaders)
    }

    // 404 处理
    return new Response(JSON.stringify({
      error: 'Not Found',
      message: 'The requested resource was not found'
    }), {
      status: 404,
      headers: corsHeaders
    })
  }
}

const router = new Router()

// 数据库连接函数
function createDBClient(env) {
  return createClient({
    url: env.DATABASE_URL || 'libsql://117.72.221.238:5433/creator_monitoring?tls=0',
    authToken: env.DATABASE_AUTH_TOKEN || 'postgres:postgres'
  })
}

// 健康检查
router.get('/health', () => {
  return new Response(JSON.stringify({
    status: 'ok',
    service: 'cloudflare-api',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

// 获取平台账号列表
router.get('/api/platforms/accounts', async (request, env, ctx, headers) => {
  try {
    const client = createDBClient(env)
    const limit = parseInt(new URL(request.url).searchParams.get('limit') || '10')
    const offset = parseInt(new URL(request.url).searchParams.get('offset') || '0')

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

    return new Response(JSON.stringify({
      success: true,
      data: result.rows,
      pagination: { limit, offset, count: result.rows.length }
    }), { headers })
  } catch (error) {
    console.error('获取账号列表失败:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers
    })
  }
})

// 删除账号
router.delete('/api/platforms/accounts/:id', async (request, env, ctx, headers) => {
  try {
    const client = createDBClient(env)
    const url = new URL(request.url)
    const id = url.pathname.split('/').pop()

    const result = await client.execute(
      'DELETE FROM creator_accounts WHERE id = $1',
      [id]
    )

    return new Response(JSON.stringify({
      success: true,
      message: '账号删除成功',
      affectedRows: result.changes
    }), { headers })
  } catch (error) {
    console.error('删除账号失败:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers
    })
  }
})

// 获取视频列表
router.get('/api/v1/videos', async (request, env, ctx, headers) => {
  try {
    const client = createDBClient(env)
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    const result = await client.execute(`
      SELECT
        v.id,
        v.title,
        v.thumbnail_url,
        v.view_count,
        v.like_count,
        v.comment_count,
        v.published_at,
        v.duration,
        ca.display_name as creator_display_name,
        p.display_name as platform_display_name,
        v.page_url
      FROM videos v
      LEFT JOIN creator_accounts ca ON v.account_id = ca.id
      LEFT JOIN platforms p ON ca.platform_id = p.id
      ORDER BY v.published_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    return new Response(JSON.stringify({
      success: true,
      data: result.rows
    }), { headers })
  } catch (error) {
    console.error('获取视频列表失败:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers
    })
  }
})

// 获取仪表板统计数据
router.get('/api/dashboard/stats', async (request, env, ctx, headers) => {
  try {
    const client = createDBClient(env)

    // 并行获取各项统计数据
    const [accountsResult, videosResult, totalViewsResult, totalLikesResult] = await Promise.all([
      client.execute('SELECT COUNT(*) as count FROM creator_accounts'),
      client.execute('SELECT COUNT(*) as count FROM videos'),
      client.execute('SELECT SUM(view_count) as total FROM videos WHERE view_count IS NOT NULL'),
      client.execute('SELECT SUM(like_count) as total FROM videos WHERE like_count IS NOT NULL')
    ])

    const stats = {
      totalAccounts: parseInt(accountsResult.rows[0].count) || 0,
      totalVideos: parseInt(videosResult.rows[0].count) || 0,
      totalViews: parseInt(totalViewsResult.rows[0].total) || 0,
      totalLikes: parseInt(totalLikesResult.rows[0].total) || 0
    }

    return new Response(JSON.stringify({
      success: true,
      data: { stats }
    }), { headers })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers
    })
  }
})

// 主要处理器
export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx)
  }
}