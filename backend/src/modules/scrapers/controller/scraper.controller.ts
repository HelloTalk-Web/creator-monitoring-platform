import { Request, Response } from 'express'
import { inArray } from 'drizzle-orm'
import { logger } from '../../../shared/utils/logger'
import { scraperManager } from '../manager/scraper.manager'
import { apiKeyService } from '../../../shared/infrastructure/api-key.service'
import { db } from '../../../shared/database/db'
import { creatorAccounts } from '../../../shared/database/schema'

function serializeBigInt(value: unknown): any {
  if (typeof value === 'bigint') {
    return Number(value)
  }

  if (Array.isArray(value)) {
    return value.map(item => serializeBigInt(item))
  }

  if (value && typeof value === 'object') {
    const serialized: Record<string, any> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      serialized[key] = serializeBigInt(val)
    }
    return serialized
  }

  return value
}

function parseVideoLimit(input: unknown): number | undefined {
  if (input === undefined || input === null || input === '') {
    return undefined
  }

  const parsed = Number(input)
  if (Number.isNaN(parsed)) {
    return undefined
  }

  return parsed
}

/**
 * 爬虫控制器 - 处理数据抓取相关的HTTP请求
 */
export class ScraperController {
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

      logger.info('URL parsed successfully', {
        url,
        platform: parsed.platform,
        identifier: parsed.identifier,
        isValid: parsed.isValid
      })

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
   * 抓取用户资料
   */
  async scrapeProfile(req: Request, res: Response) {
    try {
      const { url, userId, videoLimit } = req.body

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
      if (!parsed.isValid || parsed.platform === 'unknown') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_URL',
            message: '无效的URL格式或不支持的平台'
          }
        })
      }

      // 调用爬虫manager进行数据抓取
      const result = await scraperManager.scrapeAndStoreCreatorAccount({
        url,
        userId,
        videoLimit: parseVideoLimit(videoLimit)
      })

      logger.info('Profile scraped successfully', {
        url,
        platform: parsed.platform,
        identifier: parsed.identifier,
        accountId: result.accountId,
        isNew: result.isNew,
        videosCount: result.videosCount
      })

      res.json({
        success: true,
        message: result.isNew ? '账号创建并抓取成功' : '账号更新并抓取成功',
        data: serializeBigInt(result)
      })
    } catch (error) {
      logger.error('Failed to scrape profile', {
        body: req.body,
        error: (error as Error).message
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '抓取用户资料失败'
        }
      })
    }
  }

  /**
   * 抓取视频列表
   */
  async scrapeVideos(req: Request, res: Response) {
    try {
      const { url, userId, limit, videoLimit } = req.body
      const effectiveVideoLimit = parseVideoLimit(videoLimit ?? limit)

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
      if (!parsed.isValid || parsed.platform === 'unknown') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_URL',
            message: '无效的URL格式或不支持的平台'
          }
        })
      }

      // 调用爬虫manager进行数据抓取（包含视频）
      const result = await scraperManager.scrapeAndStoreCreatorAccount({
        url,
        userId,
        videoLimit: effectiveVideoLimit
      })

      logger.info('Videos scraped successfully', {
        url,
        platform: parsed.platform,
        identifier: parsed.identifier,
        accountId: result.accountId,
        videosCount: result.videosCount
      })

      res.json({
        success: true,
        message: `成功抓取 ${result.videosCount} 个视频`,
        data: serializeBigInt(result)
      })
    } catch (error) {
      logger.error('Failed to scrape videos', {
        body: req.body,
        error: (error as Error).message
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '抓取视频列表失败'
        }
      })
    }
  }

  /**
   * 抓取完整信息（用户资料 + 视频列表）
   */
  async scrapeComplete(req: Request, res: Response) {
    try {
      const { url, userId, videoLimit } = req.body

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
      if (!parsed.isValid || parsed.platform === 'unknown') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_URL',
            message: '无效的URL格式或不支持的平台'
          }
        })
      }

      // 调用爬虫manager进行完整数据抓取
      const result = await scraperManager.scrapeAndStoreCreatorAccount({
        url,
        userId,
        videoLimit: parseVideoLimit(videoLimit)
      })

      logger.info('Complete scraping finished', {
        url,
        platform: parsed.platform,
        identifier: parsed.identifier,
        accountId: result.accountId,
        isNew: result.isNew,
        videosCount: result.videosCount
      })

      res.json({
        success: true,
        message: result.isNew ? '账号创建并完整抓取成功' : '账号更新并完整抓取成功',
        data: serializeBigInt(result)
      })
    } catch (error) {
      logger.error('Failed to scrape complete data', {
        body: req.body,
        error: (error as Error).message
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '抓取完整信息失败'
        }
      })
    }
  }

  /**
   * 批量抓取
   */
  async batchScrape(req: Request, res: Response) {
    try {
      const { urls, userId } = req.body

      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'URLs数组是必需的且不能为空'
          }
        })
      }

      // TODO: 调用爬虫manager进行批量抓取

      logger.info('Batch scraping initiated', {
        urlsCount: urls.length,
        userId
      })

      res.json({
        success: true,
        message: '批量抓取任务已启动',
        data: {
          urlsCount: urls.length
        }
      })
    } catch (error) {
      logger.error('Failed to batch scrape', {
        body: req.body,
        error: (error as Error).message
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '批量抓取失败'
        }
      })
    }
  }

  /**
   * 批量重新爬取指定账号
   */
  async refreshAccounts(req: Request, res: Response) {
    try {
      const { accountIds, videoLimit } = req.body as { accountIds?: unknown; videoLimit?: unknown }

      if (!Array.isArray(accountIds) || accountIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'accountIds 必须是非空数组'
          }
        })
      }

      const normalizedIds = accountIds
        .map(id => Number(id))
        .filter(id => Number.isInteger(id) && id > 0)

      if (normalizedIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'accountIds 必须是数字ID'
          }
        })
      }

      const accounts = await db
        .select({
          id: creatorAccounts.id,
          profileUrl: creatorAccounts.profileUrl,
          userId: creatorAccounts.userId
        })
        .from(creatorAccounts)
        .where(inArray(creatorAccounts.id, normalizedIds))

      if (accounts.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '未找到任何匹配的账号'
          }
        })
      }

      const limit = parseVideoLimit(videoLimit)
      const results: Array<{ accountId: number; success: boolean; message?: string }> = []

      for (const account of accounts) {
        try {
          await scraperManager.scrapeAndStoreCreatorAccount({
            url: account.profileUrl,
            userId: account.userId,
            videoLimit: limit
          })

          results.push({
            accountId: account.id,
            success: true
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : '未知错误'
          logger.error('Failed to refresh account', {
            accountId: account.id,
            error: message
          })

          results.push({
            accountId: account.id,
            success: false,
            message
          })
        }
      }

      const successCount = results.filter(item => item.success).length
      const failCount = results.length - successCount
      const missingIds = normalizedIds.filter(id => !accounts.some(account => account.id === id))

      res.json({
        success: true,
        data: {
          successCount,
          failCount,
          total: normalizedIds.length,
          results,
          missingIds
        }
      })
    } catch (error) {
      logger.error('Failed to refresh accounts', {
        body: req.body,
        error: (error as Error).message
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '批量重新爬取失败'
        }
      })
    }
  }

  /**
   * 更新单个视频的数据
   */
  async updateVideo(req: Request, res: Response) {
    try {
      const { url } = req.body

      if (!url) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '视频URL是必需的'
          }
        })
      }

      // 调用爬虫manager更新视频数据
      const result = await scraperManager.updateVideoByUrl(url)

      logger.info('Video updated successfully', {
        url,
        videoId: result.videoId
      })

      res.json({
        success: true,
        message: result.message,
        data: result
      })
    } catch (error) {
      const errorMessage = (error as Error).message

      logger.error('Failed to update video', {
        body: req.body,
        error: errorMessage
      })

      // 根据错误类型返回不同的状态码
      if (errorMessage.includes('不存在于数据库中')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'VIDEO_NOT_FOUND',
            message: errorMessage
          }
        })
      }

      if (errorMessage.includes('无效的视频URL')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_URL',
            message: errorMessage
          }
        })
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '更新视频数据失败'
        }
      })
    }
  }

  /**
   * 获取API密钥的积分余额
   */
  async getCreditBalance(req: Request, res: Response) {
    try {
      const results = await apiKeyService.getCreditBalance()
      const totalCredits = results.reduce((sum, r) => sum + r.creditCount, 0)

      logger.info('Credit balance fetched successfully', {
        keysCount: results.length,
        totalCredits
      })

      res.json({
        success: true,
        data: {
          totalCredits,
          keysCount: results.length
        }
      })
    } catch (error) {
      logger.error('Failed to fetch credit balance', {
        error: (error as Error).message
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取积分余额失败'
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

      // YouTube URL格式支持
      // @username: https://www.youtube.com/@username
      const youtubeMatch = url.match(/youtube\.com\/@([^\/\?]+)/)
      if (youtubeMatch) {
        return {
          platform: 'youtube',
          identifier: youtubeMatch[1],
          type: 'profile',
          isValid: true
        }
      }

      // Channel ID: https://www.youtube.com/channel/UCxxxxxxxxxxxx
      const youtubeChannelMatch = url.match(/youtube\.com\/channel\/([\w-]+)/)
      if (youtubeChannelMatch) {
        return {
          platform: 'youtube',
          identifier: youtubeChannelMatch[1],
          type: 'profile',
          isValid: true
        }
      }

      // Custom URL: https://www.youtube.com/c/customname
      const youtubeCustomMatch = url.match(/youtube\.com\/c\/([\w.-]+)/)
      if (youtubeCustomMatch) {
        return {
          platform: 'youtube',
          identifier: youtubeCustomMatch[1],
          type: 'profile',
          isValid: true
        }
      }

      // Video URLs (will be handled by adapter): shorts, watch, youtu.be
      const youtubeVideoMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/)
      if (youtubeVideoMatch) {
        return {
          platform: 'youtube',
          identifier: youtubeVideoMatch[1],
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
export const scraperController = new ScraperController()
