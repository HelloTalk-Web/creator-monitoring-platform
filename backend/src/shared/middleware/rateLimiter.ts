import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'
import { db } from '../database/db'
import NodeCache from 'node-cache'

// 创建缓存实例
const cache = new NodeCache({ stdTTL: 3600 }) // 1小时过期

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (req: Request) => string
}

export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => getIP(req)
  } = config

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyGenerator(req)
      const now = Date.now()
      const windowStart = now - windowMs

      // 从缓存获取请求记录
      let requests = cache.get<number[]>(key) || []

      // 过滤掉过期的请求记录
      requests = requests.filter(timestamp => timestamp > windowStart)

      // 检查是否超过限制
      if (requests.length >= maxRequests) {
        logger.warn('Rate limit exceeded', {
          key,
          requestCount: requests.length,
          maxRequests,
          windowMs,
          url: req.url,
          method: req.method
        })

        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Too many requests. Maximum ${maxRequests} requests per ${windowMs}ms allowed.`,
            retryAfter: Math.ceil((requests[0] + windowMs - now) / 1000)
          }
        })
        return
      }

      // 添加当前请求记录
      requests.push(now)
      cache.set(key, requests)

      // 设置响应头
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - requests.length).toString(),
        'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
      })

      next()
    } catch (error) {
      logger.error('Rate limiter error', { error: (error as Error).message })
      next() // 出错时放行请求
    }
  }
}

// 全局速率限制器
export const rateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  maxRequests: 1000 // 每个IP每15分钟最多1000个请求
})

// API速率限制器
export const apiKeyRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  maxRequests: 100, // 每个IP每分钟最多100个请求
})

// 抓取任务速率限制器
export const scrapeRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  maxRequests: 10, // 每个IP每分钟最多10个抓取请求
})


function getIP(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (req.headers['x-real-ip'] as string) ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  )
}