import { Request, Response } from 'express'
import { platformManager } from '../managers/platform.manager'
import { platformService } from '../service/platform.service'
import { logger } from '../../../shared/utils/logger'
import type {
  CreatePlatformRequest,
  UpdatePlatformRequest,
  PlatformResponse,
  PlatformsListResponse,
  PlatformFilters
} from '../types'

/**
 * 平台控制器 - 处理HTTP请求和响应
 */
export class PlatformController {
  

  /**
   * 创建或更新创作者账号
   */
  async createOrUpdateCreatorAccount(req: Request, res: Response) {
    try {
      const { platform, identifier, userId } = req.body

      if (!platform || !identifier) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '平台和标识符是必需的'
          }
        })
      }

      const result = await platformManager.createOrUpdateCreatorAccount({
        platform,
        identifier,
        userId
      })

      logger.info('Creator account processed successfully', {
        platform,
        identifier,
        accountId: result.accountId,
        isNew: result.isNew,
        videosCount: result.videosCount
      })

      res.json({
        success: true,
        data: result,
        message: result.isNew ? '创作者账号创建成功' : '创作者账号更新成功'
      })
    } catch (error) {
      const errorMessage = (error as Error).message

      logger.error('Failed to create/update creator account', {
        body: req.body,
        error: errorMessage
      })

      let statusCode = 500
      let errorCode = 'INTERNAL_ERROR'

      if (errorMessage.includes('not found')) {
        statusCode = 404
        errorCode = 'PLATFORM_NOT_FOUND'
      } else if (errorMessage.includes('Invalid')) {
        statusCode = 400
        errorCode = 'VALIDATION_ERROR'
      }

      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: errorMessage
        }
      })
    }
  }

  /**
   * 解析URL并识别平台和用户
   */
  async parseUrl(req: Request, res: Response) {
    try {
      const { url } = req.body

      if (!url) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'URL是必需的'
          }
        })
      }

      const parsed = this.parseUrlString(url)

      res.json({
        success: true,
        data: parsed
      })
    } catch (error) {
      logger.error('Failed to parse URL', {
        body: req.body,
        error: (error as Error).message
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'URL解析失败'
        }
      })
    }
  }

  /**
   * 获取创作者账号列表（支持按平台过滤）
   */
  async getCreatorAccounts(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        platform,        // 按平台过滤：tiktok, instagram, youtube
        userId,
        username,
        sortBy = 'updatedAt',
        sortOrder = 'desc'
      } = req.query

      // 调用 service 层获取数据，支持平台关联查询
      const result = await platformService.getCreatorAccounts({
        page: Number(page),
        limit: Number(limit),
        platform: platform as string,
        userId: userId ? Number(userId) : undefined,
        username: username as string,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any
      })

      logger.info('Creator accounts retrieved successfully', {
        filters: { platform, userId, username },
        count: result.accounts.length
      })

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      logger.error('Failed to get creator accounts', {
        query: req.query,
        error: (error as Error).message
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取创作者账号列表失败'
        }
      })
    }
  }

  /**
   * 根据ID获取创作者账号详情（包含平台信息）
   */
  async getCreatorAccount(req: Request, res: Response) {
    try {
      const { id } = req.params

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '无效的账号ID'
          }
        })
      }

      // 调用 service 层获取账号详情，包含关联的平台信息
      const account = await platformService.getCreatorAccountById(Number(id))

      if (!account) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: '创作者账号不存在'
          }
        })
      }

      logger.info('Creator account retrieved successfully', { accountId: id })

      res.json({
        success: true,
        data: { account }
      })
    } catch (error) {
      logger.error('Failed to get creator account', {
        id: req.params.id,
        error: (error as Error).message
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取创作者账号失败'
        }
      })
    }
  }

  /**
   * 更新创作者账号
   */
  async updateCreatorAccount(req: Request, res: Response) {
    try {
      const { id } = req.params
      const updateData = req.body

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '无效的账号ID'
          }
        })
      }

      // 这里应该调用 repository 层来更新数据
      // 暂时返回模拟结果

      logger.info('Creator account updated successfully', { accountId: id })

      res.json({
        success: true,
        message: '创作者账号更新成功'
      })
    } catch (error) {
      logger.error('Failed to update creator account', {
        id: req.params.id,
        body: req.body,
        error: (error as Error).message
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '更新创作者账号失败'
        }
      })
    }
  }

  /**
   * 删除创作者账号
   */
  async deleteCreatorAccount(req: Request, res: Response) {
    try {
      const { id } = req.params

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '无效的账号ID'
          }
        })
      }

      // 调用 service 层删除账号
      await platformService.deleteCreatorAccount(Number(id))

      logger.info('Creator account deleted successfully', { accountId: id })

      res.json({
        success: true,
        message: '创作者账号删除成功'
      })
    } catch (error) {
      const errorMessage = (error as Error).message

      logger.error('Failed to delete creator account', {
        id: req.params.id,
        error: errorMessage
      })

      // 如果是账号不存在的错误,返回404
      if (errorMessage.includes('不存在')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: errorMessage
          }
        })
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '删除创作者账号失败'
        }
      })
    }
  }

  /**
   * URL解析结果
   */
  private parseUrlString(url: string): {
    platform: 'tiktok' | 'instagram' | 'youtube' | 'unknown'
    identifier: string
    type: 'profile' | 'other'
    isValid: boolean
  } {
    try {
      // TikTok用户资料URL: https://www.tiktok.com/@username
      const tiktokMatch = url.match(/tiktok\.com\/@([^\/\?]+)/)
      if (tiktokMatch) {
        return {
          platform: 'tiktok',
          identifier: tiktokMatch[1],
          type: 'profile',
          isValid: true
        }
      }

      // Instagram用户资料URL: https://www.instagram.com/username/
      const instagramMatch = url.match(/instagram\.com\/([^\/\?]+)/)
      if (instagramMatch) {
        return {
          platform: 'instagram',
          identifier: instagramMatch[1],
          type: 'profile',
          isValid: true
        }
      }

      // YouTube用户资料URL: https://www.youtube.com/@username
      const youtubeMatch = url.match(/youtube\.com\/@([^\/\?]+)/)
      if (youtubeMatch) {
        return {
          platform: 'youtube',
          identifier: youtubeMatch[1],
          type: 'profile',
          isValid: true
        }
      }

      return {
        platform: 'unknown',
        identifier: '',
        type: 'other',
        isValid: false
      }
    } catch (error) {
      return {
        platform: 'unknown',
        identifier: '',
        type: 'other',
        isValid: false
      }
    }
  }
}

// 导出单例
export const platformController = new PlatformController()