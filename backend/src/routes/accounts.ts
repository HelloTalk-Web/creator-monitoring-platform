import { Router } from 'express'
import { authenticateToken, requirePlan } from '../middleware/auth'
import { apiKeyRateLimiter, scrapeRateLimiter } from '../middleware/rateLimiter'
import { accountController } from '../controllers/accountController'

const router = Router()

// 所有账号路由都需要认证
router.use(authenticateToken)

// 获取用户的所有创作者账号
router.get('/', apiKeyRateLimiter, accountController.getAccounts)

// 添加新的创作者账号
router.post('/', requirePlan('basic'), apiKeyRateLimiter, accountController.addAccount)

// 通过URL添加创作者账号
router.post('/from-url', requirePlan('basic'), apiKeyRateLimiter, accountController.addAccountFromUrl)

// 获取单个账号详情
router.get('/:id', apiKeyRateLimiter, accountController.getAccount)

// 更新账号信息
router.put('/:id', requirePlan('basic'), apiKeyRateLimiter, accountController.updateAccount)

// 删除账号
router.delete('/:id', requirePlan('basic'), apiKeyRateLimiter, accountController.deleteAccount)

// 同步账号数据
router.post('/:id/sync', requirePlan('basic'), scrapeRateLimiter, accountController.syncAccount)

// 获取账号的视频列表
router.get('/:id/videos', apiKeyRateLimiter, accountController.getAccountVideos)

// 批量同步多个账号
router.post('/batch-sync', requirePlan('pro'), scrapeRateLimiter, accountController.batchSyncAccounts)

export default router