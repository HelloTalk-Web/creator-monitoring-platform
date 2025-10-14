import { Request, Response } from 'express'
import { logger } from '../../../shared/utils/logger'
import { videoService } from '../service/video.service'
import type {
  VideoQueryParams,
  VideosListResponse,
  VideoStats,
  VideoTrends,
  VideoWithMetrics
} from '../types'

/**
 * 视频控制器 - 处理视频数据查询和分析相关的HTTP请求
 */
export class VideoController {
  /**
   * 获取视频列表
   */
  async getVideos(req: Request, res: Response) {
    try {
      const queryParams: VideoQueryParams = {
        accountId: req.query.accountId ? Number(req.query.accountId) : undefined,
        platformVideoId: req.query.platformVideoId as string,
        title: req.query.title as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        publishedAfter: req.query.publishedAfter as string,
        publishedBefore: req.query.publishedBefore as string,
        minViewCount: req.query.minViewCount ? Number(req.query.minViewCount) : undefined,
        maxViewCount: req.query.maxViewCount ? Number(req.query.maxViewCount) : undefined,
        minLikeCount: req.query.minLikeCount ? Number(req.query.minLikeCount) : undefined,
        maxLikeCount: req.query.maxLikeCount ? Number(req.query.maxLikeCount) : undefined,
        sortBy: (req.query.sortBy as any) || 'publishedAt',
        sortOrder: (req.query.sortOrder as any) || 'desc',
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20
      }

      // 从原始抓取数据中提取所需信息
      const result = await videoService.getVideos(queryParams)

      // 转换 BigInt 为 Number
      const serializedVideos = result.videos.map(video => ({
        ...video,
        viewCount: video.viewCount ? Number(video.viewCount) : null,
        likeCount: video.likeCount ? Number(video.likeCount) : null,
        commentCount: video.commentCount ? Number(video.commentCount) : null,
        shareCount: video.shareCount ? Number(video.shareCount) : null,
        duration: video.duration ? Number(video.duration) : null
      }))

      logger.info('Videos retrieved successfully', {
        accountId: queryParams.accountId,
        count: serializedVideos.length,
        page: result.pagination.page
      })

      res.json({
        success: true,
        data: {
          videos: serializedVideos,
          total: result.pagination.total,
          page: result.pagination.page,
          pageSize: result.pagination.limit,
          totalPages: result.pagination.totalPages
        }
      })
    } catch (error) {
      logger.error('Failed to get videos', {
        query: req.query,
        error: (error as Error).message
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取视频列表失败'
        }
      })
    }
  }

  /**
   * 根据ID获取视频详情
   */
  async getVideo(req: Request, res: Response) {
    try {
      const { id } = req.params

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '无效的视频ID'
          }
        })
      }

      // 从数据库获取视频详情（包含原始数据）
      const video = await videoService.getVideoById(Number(id))

      if (!video) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'VIDEO_NOT_FOUND',
            message: '视频不存在'
          }
        })
      }

      logger.info('Video retrieved successfully', { videoId: id })

      res.json({
        success: true,
        data: { video }
      })
    } catch (error) {
      logger.error('Failed to get video', {
        id: req.params.id,
        error: (error as Error).message
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取视频详情失败'
        }
      })
    }
  }

  /**
   * 获取视频统计信息
   */
  async getVideoStats(req: Request, res: Response) {
    try {
      const { accountId } = req.query

      const accountIdNum = accountId ? Number(accountId) : undefined

      // TODO: 调用 video service 获取统计信息
      const stats: VideoStats = {
        totalVideos: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        avgViews: 0,
        avgLikes: 0,
        avgComments: 0,
        avgShares: 0
      }

      logger.info('Video stats retrieved successfully', {
        accountId: accountIdNum
      })

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      logger.error('Failed to get video stats', {
        query: req.query,
        error: (error as Error).message
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取视频统计失败'
        }
      })
    }
  }

  /**
   * 获取视频趋势数据
   */
  async getVideoTrends(req: Request, res: Response) {
    try {
      const { accountId, period = 'daily' } = req.query

      const accountIdNum = accountId ? Number(accountId) : undefined

      // TODO: 调用 video service 获取趋势数据
      const trends: VideoTrends = {
        daily: [],
        weekly: [],
        monthly: []
      }

      logger.info('Video trends retrieved successfully', {
        accountId: accountIdNum,
        period
      })

      res.json({
        success: true,
        data: trends
      })
    } catch (error) {
      logger.error('Failed to get video trends', {
        query: req.query,
        error: (error as Error).message
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取视频趋势失败'
        }
      })
    }
  }

  /**
   * 获取热门视频
   */
  async getPopularVideos(req: Request, res: Response) {
    try {
      const {
        accountId,
        metric = 'viewCount',
        limit = 10,
        period = 'all' // all, week, month
      } = req.query

      const accountIdNum = accountId ? Number(accountId) : undefined
      const limitNum = Number(limit)

      // TODO: 调用 video service 获取热门视频
      const videos: VideoWithMetrics[] = []

      logger.info('Popular videos retrieved successfully', {
        accountId: accountIdNum,
        metric,
        limit: limitNum,
        period
      })

      res.json({
        success: true,
        data: {
          videos,
          metric,
          period
        }
      })
    } catch (error) {
      logger.error('Failed to get popular videos', {
        query: req.query,
        error: (error as Error).message
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取热门视频失败'
        }
      })
    }
  }

  /**
   * 搜索视频
   */
  async searchVideos(req: Request, res: Response) {
    try {
      const {
        q, // 搜索关键词
        accountId,
        page = 1,
        limit = 20
      } = req.query

      if (!q) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '搜索关键词是必需的'
          }
        })
      }

      const accountIdNum = accountId ? Number(accountId) : undefined
      const pageNum = Number(page)
      const limitNum = Number(limit)

      // TODO: 调用 video service 搜索视频
      const result: VideosListResponse = {
        videos: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          totalPages: 0
        }
      }

      logger.info('Video search completed successfully', {
        query: q,
        accountId: accountIdNum,
        page: pageNum,
        count: result.videos.length
      })

      res.json({
        success: true,
        data: {
          ...result,
          query: q
        }
      })
    } catch (error) {
      logger.error('Failed to search videos', {
        query: req.query,
        error: (error as Error).message
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '搜索视频失败'
        }
      })
    }
  }

  /**
   * 获取视频性能指标
   */
  async getVideoMetrics(req: Request, res: Response) {
    try {
      const { id } = req.params

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '无效的视频ID'
          }
        })
      }

      // TODO: 调用 video service 计算性能指标
      const metrics = null

      if (!metrics) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'VIDEO_NOT_FOUND',
            message: '视频不存在'
          }
        })
      }

      logger.info('Video metrics retrieved successfully', { videoId: id })

      res.json({
        success: true,
        data: metrics
      })
    } catch (error) {
      logger.error('Failed to get video metrics', {
        id: req.params.id,
        error: (error as Error).message
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取视频性能指标失败'
        }
      })
    }
  }
}

// 导出单例
export const videoController = new VideoController()