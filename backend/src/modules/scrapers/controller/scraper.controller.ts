import { Request, Response } from 'express'
import { logger } from '../../../shared/utils/logger'

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
      const { url, userId } = req.body

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

      // TODO: 调用爬虫manager进行数据抓取
      // 这里需要导入和使用爬虫管理器

      logger.info('Profile scraping initiated', {
        url,
        platform: parsed.platform,
        identifier: parsed.identifier
      })

      res.json({
        success: true,
        message: '用户资料抓取任务已启动',
        data: {
          platform: parsed.platform,
          identifier: parsed.identifier
        }
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
      const { url, userId, limit } = req.body

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

      // TODO: 调用爬虫manager进行数据抓取

      logger.info('Videos scraping initiated', {
        url,
        platform: parsed.platform,
        identifier: parsed.identifier,
        limit
      })

      res.json({
        success: true,
        message: '视频列表抓取任务已启动',
        data: {
          platform: parsed.platform,
          identifier: parsed.identifier,
          limit
        }
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
      const { url, userId } = req.body

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

      // TODO: 调用爬虫manager进行完整数据抓取

      logger.info('Complete scraping initiated', {
        url,
        platform: parsed.platform,
        identifier: parsed.identifier
      })

      res.json({
        success: true,
        message: '完整信息抓取任务已启动',
        data: {
          platform: parsed.platform,
          identifier: parsed.identifier
        }
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
export const scraperController = new ScraperController()