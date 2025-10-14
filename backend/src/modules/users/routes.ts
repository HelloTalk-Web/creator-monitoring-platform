import { Router } from 'express'
import { apiKeyRateLimiter } from '../../shared/middleware/rateLimiter'
import { userService } from './service'

const router = Router()

// 获取所有用户
router.get('/', apiKeyRateLimiter, userService.getUsers.bind(userService))

// 获取单个用户
router.get('/:id', apiKeyRateLimiter, userService.getUser.bind(userService))

// 创建用户
router.post('/', apiKeyRateLimiter, userService.createUser.bind(userService))

// 更新用户
router.put('/:id', apiKeyRateLimiter, userService.updateUser.bind(userService))

// 删除用户
router.delete('/:id', apiKeyRateLimiter, userService.deleteUser.bind(userService))

export default router