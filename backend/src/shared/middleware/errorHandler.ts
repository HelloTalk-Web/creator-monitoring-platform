import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'
import { AppError } from '../../types'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
  details?: any
  type?: string
}

export function errorHandler(
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 记录错误日志
  logger.error('API Error occurred', {
    method: req.method,
    url: req.url,
    statusCode: error.statusCode || 500,
    message: error.message,
    stack: error.stack,
    userId: (req as any).user?.id,
    ip: req.ip
  })

  // 处理应用错误
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: 'APP_ERROR',
        message: error.message
      }
    })
    return
  }

  // 处理验证错误
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.details || error.message
      }
    })
    return
  }

  // 处理JWT错误
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token'
      }
    })
    return
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired'
      }
    })
    return
  }

  // 处理数据库错误
  if (error.code === '23505') { // PostgreSQL unique violation
    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'Resource already exists'
      }
    })
    return
  }

  if (error.code === '23503') { // PostgreSQL foreign key violation
    res.status(400).json({
      success: false,
      error: {
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'Referenced resource does not exist'
      }
    })
    return
  }

  // 默认服务器错误
  const statusCode = error.statusCode || 500
  const isDevelopment = process.env.NODE_ENV === 'development'

  res.status(statusCode).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
      ...(isDevelopment && { stack: error.stack, details: error.details })
    }
  })
}

function getStatusCodeFromAdapterError(errorType: string): number {
  switch (errorType) {
    case 'NETWORK_ERROR':
    case 'API_ERROR':
      return 503
    case 'RATE_LIMIT_ERROR':
      return 429
    case 'AUTH_ERROR':
      return 401
    case 'PERMISSION_ERROR':
      return 403
    case 'VALIDATION_ERROR':
    case 'TRANSFORM_ERROR':
      return 400
    case 'NOT_FOUND':
      return 404
    case 'UNSUPPORTED_PLATFORM':
      return 400
    default:
      return 500
  }
}