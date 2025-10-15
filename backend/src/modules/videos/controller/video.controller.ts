import { Request, Response } from 'express'
import { logger } from '../../../shared/utils/logger'
import { videoService } from '../service/video.service'
import * as XLSX from 'xlsx'
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
      // 处理tags参数：支持单个tag或多个tags（逗号分隔）
      let tagsParam: string[] | undefined = undefined
      if (req.query.tag) {
        // 单个tag参数（从前端tag搜索框）
        tagsParam = [req.query.tag as string]
      } else if (req.query.tags) {
        // 多个tags参数（逗号分隔）
        tagsParam = (req.query.tags as string).split(',')
      }

      const queryParams: VideoQueryParams = {
        accountId: req.query.accountId ? Number(req.query.accountId) : undefined,
        platformVideoId: req.query.platformVideoId as string,
        title: req.query.title as string,
        tags: tagsParam,
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

  /**
   * 导出筛选后的视频列表为Excel
   */
  async exportFilteredVideos(req: Request, res: Response) {
    try {
      // 解析查询参数（与getVideos相同）
      let tagsParam: string[] | undefined = undefined
      if (req.query.tag) {
        tagsParam = [req.query.tag as string]
      } else if (req.query.tags) {
        tagsParam = (req.query.tags as string).split(',')
      }

      const queryParams: VideoQueryParams = {
        accountId: req.query.accountId ? Number(req.query.accountId) : undefined,
        platformVideoId: req.query.platformVideoId as string,
        title: req.query.title as string,
        tags: tagsParam,
        publishedAfter: req.query.publishedAfter as string,
        publishedBefore: req.query.publishedBefore as string,
        minViewCount: req.query.minViewCount ? Number(req.query.minViewCount) : undefined,
        maxViewCount: req.query.maxViewCount ? Number(req.query.maxViewCount) : undefined,
        minLikeCount: req.query.minLikeCount ? Number(req.query.minLikeCount) : undefined,
        maxLikeCount: req.query.maxLikeCount ? Number(req.query.maxLikeCount) : undefined,
        sortBy: (req.query.sortBy as any) || 'publishedAt',
        sortOrder: (req.query.sortOrder as any) || 'desc',
        page: 1,
        limit: 10000 // 导出时获取所有匹配的数据
      }

      // 获取视频数据
      const result = await videoService.getVideos(queryParams)

      // 生成Excel
      const excelBuffer = this.generateExcelFromVideos(result.videos)

      // 生成文件名：[创作者名称]_视频数据_2025-10-15.xlsx
      const accountName = (result.videos[0] as any)?.creatorDisplayName || '视频'
      const dateStr = new Date().toISOString().split('T')[0]
      const filename = `${accountName}_视频数据_${dateStr}.xlsx`

      logger.info('Filtered videos exported successfully', {
        accountId: queryParams.accountId,
        count: result.videos.length
      })

      // 设置响应头
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
      res.send(excelBuffer)

    } catch (error) {
      logger.error('Failed to export filtered videos', {
        query: req.query,
        error: (error as Error).message
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '导出视频列表失败'
        }
      })
    }
  }

  /**
   * 导出全部视频为Excel
   */
  async exportAllVideos(req: Request, res: Response) {
    try {
      const accountId = req.query.accountId ? Number(req.query.accountId) : undefined

      // 获取全部视频数据（不带任何筛选条件）
      const queryParams: VideoQueryParams = {
        accountId,
        page: 1,
        limit: 10000, // 导出所有数据
        sortBy: 'publishedAt',
        sortOrder: 'desc'
      }

      const result = await videoService.getVideos(queryParams)

      // 生成Excel
      const excelBuffer = this.generateExcelFromVideos(result.videos)

      // 生成文件名
      const accountName = (result.videos[0] as any)?.creatorDisplayName || '全部视频'
      const dateStr = new Date().toISOString().split('T')[0]
      const filename = `${accountName}_全部视频数据_${dateStr}.xlsx`

      logger.info('All videos exported successfully', {
        accountId,
        count: result.videos.length
      })

      // 设置响应头
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
      res.send(excelBuffer)

    } catch (error) {
      logger.error('Failed to export all videos', {
        query: req.query,
        error: (error as Error).message
      })

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '导出全部视频失败'
        }
      })
    }
  }

  /**
   * 生成Excel文件
   */
  private generateExcelFromVideos(videos: any[]): Buffer {
    // 准备Excel数据
    const excelData = videos.map(video => ({
      '视频标题': video.title || '',
      '视频描述': video.description || '',
      '创作者': video.creatorDisplayName || '',
      '平台': video.platformDisplayName || '',
      '发布时间': video.publishedAt ? new Date(video.publishedAt).toLocaleString('zh-CN') : '',
      '播放量': Number(video.viewCount) || 0,
      '点赞数': Number(video.likeCount) || 0,
      '评论数': Number(video.commentCount) || 0,
      '分享数': Number(video.shareCount) || 0,
      '收藏数': Number(video.saveCount) || 0,
      '标签': Array.isArray(video.tags) ? video.tags.join(', ') : '',
      '是否热门': (Number(video.viewCount) || 0) > 10000 ? '是' : '否',
      '视频链接': video.pageUrl || video.videoUrl || ''
    }))

    // 创建工作簿和工作表
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '视频数据')

    // 设置列宽
    const colWidths = [
      { wch: 40 },  // 视频标题
      { wch: 50 },  // 视频描述
      { wch: 20 },  // 创作者
      { wch: 12 },  // 平台
      { wch: 20 },  // 发布时间
      { wch: 12 },  // 播放量
      { wch: 12 },  // 点赞数
      { wch: 12 },  // 评论数
      { wch: 12 },  // 分享数
      { wch: 12 },  // 收藏数
      { wch: 30 },  // 标签
      { wch: 10 },  // 是否热门
      { wch: 50 }   // 视频链接
    ]
    worksheet['!cols'] = colWidths

    // 生成Excel缓冲区
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return excelBuffer
  }
}

// 导出单例
export const videoController = new VideoController()