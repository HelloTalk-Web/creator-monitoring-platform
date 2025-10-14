import { Router } from 'express'
import { apiKeyRateLimiter } from '../../shared/middleware/rateLimiter'
import { platformController } from './controller/platform.controller'

const router = Router()

// 获取所有平台
router.get('/', apiKeyRateLimiter, platformController.getPlatforms.bind(platformController))


// 获取单个平台
router.get('/:id', apiKeyRateLimiter, platformController.getPlatform.bind(platformController))

// 创建平台
router.post('/', apiKeyRateLimiter, platformController.createPlatform.bind(platformController))

// 更新平台
router.put('/:id', apiKeyRateLimiter, platformController.updatePlatform.bind(platformController))

// 删除平台
router.delete('/:id', apiKeyRateLimiter, platformController.deletePlatform.bind(platformController))

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