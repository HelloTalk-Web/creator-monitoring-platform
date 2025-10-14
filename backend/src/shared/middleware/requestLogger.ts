import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now()
  const userAgent = req.headers['user-agent'] || ''
  const contentLength = req.headers['content-length'] || '0'

  // 记录请求开始
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    userAgent,
    contentLength,
    ip: req.ip,
    userId: (req as any).user?.id
  })

  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - startTime
    const contentLength = res.get('content-length') || '0'

    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength,
      ip: req.ip,
      userId: (req as any).user?.id
    })
  })

  // 监听响应关闭（客户端断开连接）
  res.on('close', () => {
    if (!res.finished) {
      const duration = Date.now() - startTime

      logger.warn('Request closed by client', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        ip: req.ip,
        userId: (req as any).user?.id
      })
    }
  })

  next()
}