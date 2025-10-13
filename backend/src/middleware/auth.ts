import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { logger } from '../utils/logger'
import DatabaseService from '../services/databaseService'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number
    email: string
    username: string
    planType: string
  }
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authentication token is required'
        }
      })
      return
    }

    // 验证JWT令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key') as any

    // 从数据库获取用户信息（确保用户仍然存在且处于活跃状态）
    const user = await DatabaseService.findUserById(decoded.userId)

    if (!user || user.status !== 'active') {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found or inactive'
        }
      })
      return
    }

    // 将用户信息添加到请求对象
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      planType: user.planType
    }

    logger.debug('User authenticated', {
      userId: user.id,
      username: user.username,
      planType: user.planType
    })

    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token'
        }
      })
      return
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired'
        }
      })
      return
    }

    logger.error('Authentication error', {
      error: (error as Error).message,
      stack: (error as Error).stack
    })

    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed'
      }
    })
  }
}

export function requirePlan(minimumPlan: string) {
  const planHierarchy = {
    'free': 0,
    'basic': 1,
    'pro': 2,
    'enterprise': 3
  }

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        }
      })
      return
    }

    const userPlanLevel = planHierarchy[req.user.planType as keyof typeof planHierarchy] || 0
    const requiredPlanLevel = planHierarchy[minimumPlan as keyof typeof planHierarchy] || 0

    if (userPlanLevel < requiredPlanLevel) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PLAN',
          message: `This feature requires a ${minimumPlan} plan or higher`,
          currentPlan: req.user.planType,
          requiredPlan: minimumPlan
        }
      })
      return
    }

    next()
  }
}

export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    next()
    return
  }

  // 尝试验证令牌，但不强制要求
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key') as any

    DatabaseService.findUserById(decoded.userId)
      .then(user => {
        if (user && user.status === 'active') {
          req.user = {
            id: user.id,
            email: user.email,
            username: user.username,
            planType: user.planType
          }
        }
        next()
      })
      .catch(() => {
        // 数据库错误时仍然继续，但不设置用户信息
        next()
      })
  } catch {
    // 令牌无效时仍然继续，但不设置用户信息
    next()
  }
}
