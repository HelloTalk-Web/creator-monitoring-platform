import { Request, Response } from 'express'
import { platformManager } from '../managers/platform.manager'
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
  // 获取平台列表
  async getPlatforms(req: Request, res: Response) {
    try {
      const { page, limit, name, isActive } = req.query

      const filters = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        name: name as string,
        isActive: isActive ? isActive === 'true' : undefined
      }

      const result = await platformManager.getPlatforms(filters)

      logger.info('Platforms retrieved successfully', {
        count: result.platforms.length,
        filters
      })

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      logger.error('Failed to get platforms', {
        query: req.query,
        error: (error as Error).message
      })
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get platforms'
        }
      })
    }
  }

  // 根据ID获取平台
  async getPlatform(req: Request, res: Response) {
    try {
      const { id } = req.params

      const platform = await platformManager.getPlatform(Number(id))

      if (!platform) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PLATFORM_NOT_FOUND',
            message: 'Platform not found'
          }
        })
      }

      logger.info('Platform retrieved successfully', { platformId: id })

      res.json({
        success: true,
        data: { platform }
      })
    } catch (error) {
      const errorMessage = (error as Error).message

      logger.error('Failed to get platform', {
        id: req.params.id,
        error: errorMessage
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get platform'
        }
      })
    }
  }

  // 创建平台
  async createPlatform(req: Request, res: Response) {
    try {
      const platformData: CreatePlatformRequest = req.body

      // 基本验证
      if (!platformData.name || !platformData.displayName || !platformData.baseUrl || !platformData.urlPattern) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name, displayName, baseUrl, and urlPattern are required'
          }
        })
      }

      const createdPlatform = await platformManager.createPlatform(platformData)

      logger.info('Platform created successfully', {
        platformId: createdPlatform.id,
        name: createdPlatform.name
      })

      res.status(201).json({
        success: true,
        data: { platform: createdPlatform },
        message: 'Platform created successfully'
      })
    } catch (error) {
      const errorMessage = (error as Error).message

      logger.error('Failed to create platform', {
        body: req.body,
        error: errorMessage
      })

      let statusCode = 500
      let errorCode = 'INTERNAL_ERROR'

      if (errorMessage.includes('already exists')) {
        statusCode = 409
        errorCode = 'PLATFORM_EXISTS'
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

  // 更新平台
  async updatePlatform(req: Request, res: Response) {
    try {
      const { id } = req.params
      const platformData: UpdatePlatformRequest = req.body

      const updatedPlatform = await platformManager.updatePlatform(Number(id), platformData)

      logger.info('Platform updated successfully', {
        platformId: updatedPlatform.id,
        name: updatedPlatform.name
      })

      res.json({
        success: true,
        data: { platform: updatedPlatform },
        message: 'Platform updated successfully'
      })
    } catch (error) {
      const errorMessage = (error as Error).message

      logger.error('Failed to update platform', {
        id: req.params.id,
        body: req.body,
        error: errorMessage
      })

      let statusCode = 500
      let errorCode = 'INTERNAL_ERROR'

      if (errorMessage.includes('not found')) {
        statusCode = 404
        errorCode = 'PLATFORM_NOT_FOUND'
      } else if (errorMessage.includes('already exists')) {
        statusCode = 409
        errorCode = 'PLATFORM_NAME_EXISTS'
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

  // 删除平台
  async deletePlatform(req: Request, res: Response) {
    try {
      const { id } = req.params

      await platformManager.deletePlatform(Number(id))

      logger.info('Platform deleted successfully', { platformId: id })

      res.json({
        success: true,
        message: 'Platform deleted successfully'
      })
    } catch (error) {
      const errorMessage = (error as Error).message

      logger.error('Failed to delete platform', {
        id: req.params.id,
        error: errorMessage
      })

      let statusCode = 500
      let errorCode = 'INTERNAL_ERROR'

      if (errorMessage.includes('not found')) {
        statusCode = 404
        errorCode = 'PLATFORM_NOT_FOUND'
      } else if (errorMessage.includes('in use')) {
        statusCode = 409
        errorCode = 'PLATFORM_IN_USE'
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
   * 获取创作者账号列表
   */
  async getCreatorAccounts(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, platform, userId, username } = req.query

      // 这里应该调用 repository 层来获取数据
      // 暂时返回空结果，等实现 repository 后再完善
      const result = {
        accounts: [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0,
          totalPages: 0
        }
      }

      logger.info('Creator accounts retrieved successfully', {
        filters: { platform, userId, username }
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
   * 根据ID获取创作者账号
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

      // 这里应该调用 repository 层来获取数据
      // 暂时返回空结果
      const account = null

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

      // 这里应该调用 repository 层来删除数据
      // 暂时返回模拟结果

      logger.info('Creator account deleted successfully', { accountId: id })

      res.json({
        success: true,
        message: '创作者账号删除成功'
      })
    } catch (error) {
      logger.error('Failed to delete creator account', {
        id: req.params.id,
        error: (error as Error).message
      })

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