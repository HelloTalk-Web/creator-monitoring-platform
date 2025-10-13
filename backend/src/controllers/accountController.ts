import { Request, Response } from 'express'
import { db } from '../database/connection'
import { logger } from '../utils/logger'
import { AuthenticatedRequest } from '../middleware/auth'
import { PlatformServiceFactory } from '../services/platformServiceFactory'
import { UrlParser } from '../utils/urlParser'

export class AccountController {
  async getAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { page = 1, limit = 20, platform, status } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let query = `
        SELECT
          ca.*,
          p.name as platform_name,
          p.display_name as platform_display_name,
          p.color_code as platform_color,
          COUNT(v.id) as video_count
        FROM creator_accounts ca
        JOIN platforms p ON ca.platform_id = p.id
        LEFT JOIN videos v ON ca.id = v.account_id
        WHERE ca.user_id = $1
      `
      const params: any[] = [req.user.id]
      let paramIndex = 2

      if (platform) {
        query += ` AND p.name = $${paramIndex++}`
        params.push(platform)
      }

      if (status) {
        query += ` AND ca.status = $${paramIndex++}`
        params.push(status)
      }

      query += `
        GROUP BY ca.id, p.name, p.display_name, p.color_code
        ORDER BY ca.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `
      params.push(Number(limit), offset)

      const result = await db.query(query, params)

      // 获取总数
      let countQuery = 'SELECT COUNT(*) as total FROM creator_accounts WHERE user_id = $1'
      const countParams: any[] = [req.user.id]
      let countParamIndex = 2

      if (platform) {
        countQuery += ` AND platform_id = (SELECT id FROM platforms WHERE name = $${countParamIndex++})`
        countParams.push(platform)
      }

      if (status) {
        countQuery += ` AND status = $${countParamIndex++}`
        countParams.push(status)
      }

      const countResult = await db.query(countQuery, countParams)
      const total = parseInt(countResult.rows[0].total)

      res.json({
        success: true,
        data: {
          accounts: result.rows,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      })
    } catch (error) {
      logger.error('Failed to get accounts', {
        error: (error as Error).message,
        userId: req.user?.id
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'GET_ACCOUNTS_FAILED',
          message: 'Failed to retrieve accounts'
        }
      })
    }
  }

  async addAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { platform, username } = req.body

      if (!platform || !username) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Platform and username are required'
          }
        })
        return
      }

      // 获取平台ID
      const platformResult = await db.query(
        'SELECT id FROM platforms WHERE name = $1 AND is_active = true',
        [platform]
      )

      if (platformResult.rows.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'UNSUPPORTED_PLATFORM',
            message: `Platform '${platform}' is not supported`
          }
        })
        return
      }

      const platformId = platformResult.rows[0].id

      // 检查账号是否已存在
      const existingAccount = await db.query(
        'SELECT id FROM creator_accounts WHERE user_id = $1 AND platform_id = $2 AND platform_user_id = $3',
        [req.user.id, platformId, username]
      )

      if (existingAccount.rows.length > 0) {
        res.status(409).json({
          success: false,
          error: {
            code: 'ACCOUNT_EXISTS',
            message: 'This account is already added'
          }
        })
        return
      }

      // 获取平台服务
      const platformService = PlatformServiceFactory.getService(platform)

      try {
        // 获取创作者资料
        const profile = await platformService.getProfile(username)
        const profileUrl = UrlParser.buildProfileUrl(platform, username)

        // 添加账号到数据库
        const result = await db.query(
          `INSERT INTO creator_accounts
           (user_id, platform_id, platform_user_id, username, display_name,
            profile_url, avatar_url, bio, follower_count, following_count,
            total_videos, is_verified, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           RETURNING *`,
          [
            req.user.id,
            platformId,
            username,
            profile.username,
            profile.displayName,
            profileUrl,
            profile.avatarUrl,
            profile.bio,
            profile.followerCount,
            profile.followingCount,
            profile.totalVideos,
            profile.isVerified,
            JSON.stringify(profile.metadata || {})
          ]
        )

        const account = result.rows[0]

        logger.info('Account added successfully', {
          accountId: account.id,
          userId: req.user.id,
          platform,
          username
        })

        res.status(201).json({
          success: true,
          data: { account }
        })
      } catch (profileError) {
        logger.error('Failed to fetch profile for new account', {
          platform,
          username,
          error: (profileError as Error).message
        })

        res.status(400).json({
          success: false,
          error: {
            code: 'PROFILE_FETCH_FAILED',
            message: `Failed to fetch profile for ${platform} user '${username}'`
          }
        })
      }
    } catch (error) {
      logger.error('Failed to add account', {
        error: (error as Error).message,
        userId: req.user?.id
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'ADD_ACCOUNT_FAILED',
          message: 'Failed to add account'
        }
      })
    }
  }

  async addAccountFromUrl(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { url } = req.body

      if (!url) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'URL is required'
          }
        })
        return
      }

      // 解析URL
      const parsedUrl = UrlParser.parse(url)
      if (!parsedUrl) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_URL',
            message: 'Invalid or unsupported URL format'
          }
        })
        return
      }

      // 调用addAccount方法
      req.body.platform = parsedUrl.platform
      req.body.username = parsedUrl.username

      await this.addAccount(req, res)
    } catch (error) {
      logger.error('Failed to add account from URL', {
        error: (error as Error).message,
        userId: req.user?.id
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'ADD_ACCOUNT_FROM_URL_FAILED',
          message: 'Failed to add account from URL'
        }
      })
    }
  }

  async getAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { id } = req.params

      const result = await db.query(
        `SELECT
          ca.*,
          p.name as platform_name,
          p.display_name as platform_display_name,
          p.color_code as platform_color,
          COUNT(v.id) as video_count
        FROM creator_accounts ca
        JOIN platforms p ON ca.platform_id = p.id
        LEFT JOIN videos v ON ca.id = v.account_id
        WHERE ca.id = $1 AND ca.user_id = $2
        GROUP BY ca.id, p.name, p.display_name, p.color_code`,
        [id, req.user.id]
      )

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found'
          }
        })
        return
      }

      res.json({
        success: true,
        data: { account: result.rows[0] }
      })
    } catch (error) {
      logger.error('Failed to get account', {
        error: (error as Error).message,
        userId: req.user?.id,
        accountId: req.params.id
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'GET_ACCOUNT_FAILED',
          message: 'Failed to retrieve account'
        }
      })
    }
  }

  async updateAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { id } = req.params
      const { scrapeFrequency } = req.body

      // 验证账号所有权
      const accountResult = await db.query(
        'SELECT id FROM creator_accounts WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      )

      if (accountResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found'
          }
        })
        return
      }

      // 更新账号
      const updateFields = []
      const updateValues = []
      let paramIndex = 1

      if (scrapeFrequency !== undefined) {
        updateFields.push(`scrape_frequency = $${paramIndex++}`)
        updateValues.push(scrapeFrequency)
      }

      if (updateFields.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No valid fields to update'
          }
        })
        return
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
      updateValues.push(id, req.user.id)

      const result = await db.query(
        `UPDATE creator_accounts
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
         RETURNING *`,
        updateValues
      )

      logger.info('Account updated successfully', {
        accountId: id,
        userId: req.user.id,
        updateFields
      })

      res.json({
        success: true,
        data: { account: result.rows[0] }
      })
    } catch (error) {
      logger.error('Failed to update account', {
        error: (error as Error).message,
        userId: req.user?.id,
        accountId: req.params.id
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_ACCOUNT_FAILED',
          message: 'Failed to update account'
        }
      })
    }
  }

  async deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { id } = req.params

      // 验证账号所有权并删除
      const result = await db.query(
        'DELETE FROM creator_accounts WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, req.user.id]
      )

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found'
          }
        })
        return
      }

      logger.info('Account deleted successfully', {
        accountId: id,
        userId: req.user.id
      })

      res.json({
        success: true,
        data: {
          message: 'Account deleted successfully'
        }
      })
    } catch (error) {
      logger.error('Failed to delete account', {
        error: (error as Error).message,
        userId: req.user?.id,
        accountId: req.params.id
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_ACCOUNT_FAILED',
          message: 'Failed to delete account'
        }
      })
    }
  }

  async syncAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { id } = req.params

      // 获取账号信息
      const accountResult = await db.query(
        `SELECT ca.*, p.name as platform_name
         FROM creator_accounts ca
         JOIN platforms p ON ca.platform_id = p.id
         WHERE ca.id = $1 AND ca.user_id = $2`,
        [id, req.user.id]
      )

      if (accountResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found'
          }
        })
        return
      }

      const account = accountResult.rows[0]

      // 创建同步任务
      const taskResult = await db.query(
        `INSERT INTO scrape_tasks
         (user_id, account_id, task_type, status, priority, config)
         VALUES ($1, $2, 'account_sync', 'pending', 5, '{}')
         RETURNING *`,
        [req.user.id, id]
      )

      const task = taskResult.rows[0]

      // 这里可以启动后台任务处理
      // 目前先返回任务信息

      logger.info('Account sync task created', {
        taskId: task.id,
        accountId: id,
        userId: req.user.id
      })

      res.json({
        success: true,
        data: { task }
      })
    } catch (error) {
      logger.error('Failed to sync account', {
        error: (error as Error).message,
        userId: req.user?.id,
        accountId: req.params.id
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'SYNC_ACCOUNT_FAILED',
          message: 'Failed to sync account'
        }
      })
    }
  }

  async getAccountVideos(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { id } = req.params
      const { page = 1, limit = 20, sortBy = 'published_at', sortOrder = 'DESC' } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      // 验证账号所有权
      const accountResult = await db.query(
        'SELECT id FROM creator_accounts WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      )

      if (accountResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found'
          }
        })
        return
      }

      // 获取视频列表
      const videosResult = await db.query(
        `SELECT *
         FROM videos
         WHERE account_id = $1
         ORDER BY ${sortBy} ${sortOrder}
         LIMIT $2 OFFSET $3`,
        [id, Number(limit), offset]
      )

      // 获取总数
      const countResult = await db.query(
        'SELECT COUNT(*) as total FROM videos WHERE account_id = $1',
        [id]
      )

      const total = parseInt(countResult.rows[0].total)

      res.json({
        success: true,
        data: {
          videos: videosResult.rows,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      })
    } catch (error) {
      logger.error('Failed to get account videos', {
        error: (error as Error).message,
        userId: req.user?.id,
        accountId: req.params.id
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'GET_ACCOUNT_VIDEOS_FAILED',
          message: 'Failed to retrieve account videos'
        }
      })
    }
  }

  async batchSyncAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { accountIds } = req.body

      if (!Array.isArray(accountIds) || accountIds.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Account IDs array is required'
          }
        })
        return
      }

      // 验证账号所有权
      const accountsResult = await db.query(
        `SELECT id FROM creator_accounts
         WHERE id = ANY($1) AND user_id = $2`,
        [accountIds, req.user.id]
      )

      if (accountsResult.rows.length !== accountIds.length) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ACCOUNTS_NOT_FOUND',
            message: 'One or more accounts not found'
          }
        })
        return
      }

      // 创建批量同步任务
      const tasks = []
      for (const accountId of accountIds) {
        const taskResult = await db.query(
          `INSERT INTO scrape_tasks
           (user_id, account_id, task_type, status, priority, config)
           VALUES ($1, $2, 'account_sync', 'pending', 3, '{}')
           RETURNING *`,
          [req.user.id, accountId]
        )
        tasks.push(taskResult.rows[0])
      }

      logger.info('Batch sync tasks created', {
        taskCount: tasks.length,
        userId: req.user.id,
        accountIds
      })

      res.json({
        success: true,
        data: { tasks }
      })
    } catch (error) {
      logger.error('Failed to batch sync accounts', {
        error: (error as Error).message,
        userId: req.user?.id
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'BATCH_SYNC_ACCOUNTS_FAILED',
          message: 'Failed to create batch sync tasks'
        }
      })
    }
  }
}

export const accountController = new AccountController()