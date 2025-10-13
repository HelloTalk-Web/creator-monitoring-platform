import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { logger } from '../utils/logger'
import { AuthenticatedRequest } from '../middleware/auth'
import DatabaseService from '../services/databaseService'

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, username, password } = req.body

      // 基本验证
      if (!email || !username || !password) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email, username, and password are required'
          }
        })
        return
      }

      // 检查用户是否已存在
      const existingUser = await DatabaseService.findUserByEmail(email)
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'User with this email already exists'
          }
        })
        return
      }

      // 加密密码
      const saltRounds = 12
      const passwordHash = await bcrypt.hash(password, saltRounds)

      // 创建用户
      const user = await DatabaseService.createUser({
        email,
        username,
        passwordHash,
        planType: 'free',
        apiQuota: 1000
      })

      // 生成JWT令牌
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'default_secret_key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      )

      logger.info('User registered successfully', {
        userId: user.id,
        username: user.username,
        email: user.email
      })

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            planType: user.planType,
            createdAt: user.createdAt
          },
          token
        }
      })
    } catch (error) {
      logger.error('Registration failed', {
        error: (error as Error).message,
        stack: (error as Error).stack
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: 'Failed to register user'
        }
      })
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body

      // 基本验证
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and password are required'
          }
        })
        return
      }

      // 查找用户
      const user = await DatabaseService.findUserByEmail(email)
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        })
        return
      }

      // 检查用户状态
      if (user.status !== 'active') {
        res.status(401).json({
          success: false,
          error: {
            code: 'ACCOUNT_INACTIVE',
            message: 'Account is not active'
          }
        })
        return
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        })
        return
      }

      // 生成JWT令牌
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'default_secret_key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      )

      logger.info('User logged in successfully', {
        userId: user.id,
        username: user.username,
        email: user.email
      })

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            planType: user.planType
          },
          token
        }
      })
    } catch (error) {
      logger.error('Login failed', {
        error: (error as Error).message,
        stack: (error as Error).stack
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: 'Failed to login'
        }
      })
    }
  }

  async refreshToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
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

      // 生成新的JWT令牌
      const token = jwt.sign(
        { userId: req.user.id },
        process.env.JWT_SECRET || 'default_secret_key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      )

      logger.info('Token refreshed successfully', {
        userId: req.user.id,
        username: req.user.username
      })

      res.json({
        success: true,
        data: {
          token
        }
      })
    } catch (error) {
      logger.error('Token refresh failed', {
        error: (error as Error).message,
        stack: (error as Error).stack
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'TOKEN_REFRESH_FAILED',
          message: 'Failed to refresh token'
        }
      })
    }
  }

  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      logger.info('User logged out successfully', {
        userId: req.user?.id,
        username: req.user?.username
      })

      res.json({
        success: true,
        data: {
          message: 'Logged out successfully'
        }
      })
    } catch (error) {
      logger.error('Logout failed', {
        error: (error as Error).message,
        stack: (error as Error).stack
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'LOGOUT_FAILED',
          message: 'Failed to logout'
        }
      })
    }
  }

  async verifyToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid authentication token'
          }
        })
        return
      }

      res.json({
        success: true,
        data: {
          user: {
            id: req.user.id,
            email: req.user.email,
            username: req.user.username,
            planType: req.user.planType
          }
        }
      })
    } catch (error) {
      logger.error('Token verification failed', {
        error: (error as Error).message,
        stack: (error as Error).stack
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'VERIFICATION_FAILED',
          message: 'Failed to verify token'
        }
      })
    }
  }
}

export const authController = new AuthController()
