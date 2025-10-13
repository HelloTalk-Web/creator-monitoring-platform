import { Router } from 'express'
import { authRateLimiter } from '../middleware/rateLimiter'
import { authController } from '../controllers/authController'

const router = Router()

// 用户注册
router.post('/register', authRateLimiter, authController.register)

// 用户登录
router.post('/login', authRateLimiter, authController.login)

// 刷新令牌
router.post('/refresh', authController.refreshToken)

// 登出
router.post('/logout', authController.logout)

// 验证令牌
router.get('/verify', authController.verifyToken)

export default router