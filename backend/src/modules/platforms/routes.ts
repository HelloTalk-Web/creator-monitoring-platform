import { Router } from 'express'
import { apiKeyRateLimiter } from '../../shared/middleware/rateLimiter'
import { platformController } from './controller/platform.controller'

const router = Router()

// 平台相关接口
// 获取所有平台列表
router.get('/', apiKeyRateLimiter, platformController.getPlatforms.bind(platformController))

// 创作者账号相关接口
// 获取创作者账号列表
router.get('/accounts', apiKeyRateLimiter, platformController.getCreatorAccounts.bind(platformController))

// 获取单个创作者账号
router.get('/accounts/:id', apiKeyRateLimiter, platformController.getCreatorAccount.bind(platformController))

// 更新创作者账号
router.put('/accounts/:id', apiKeyRateLimiter, platformController.updateCreatorAccount.bind(platformController))

// 删除创作者账号
router.delete('/accounts/:id', apiKeyRateLimiter, platformController.deleteCreatorAccount.bind(platformController))

export default router