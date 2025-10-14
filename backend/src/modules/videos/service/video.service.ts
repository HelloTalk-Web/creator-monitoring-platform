import { logger } from '../../../shared/utils/logger'
import { db } from '../../../shared/database/db'
import { videos, creatorAccounts, platforms } from '../../../shared/database/schema'
import { eq, and, gte, lte, like, desc, asc, count, sum, avg } from 'drizzle-orm'
import type {
  VideoQueryParams,
  VideosListResponse,
  VideoStats,
  VideoTrends,
  VideoMetrics,
  VideoWithMetrics
} from '../types'

/**
 * 视频服务
 * 职责：处理视频数据的查询、统计和分析业务逻辑
 */
export class VideoService {
  /**
   * 获取视频列表
   */
  async getVideos(params: VideoQueryParams): Promise<VideosListResponse> {
    const {
      accountId,
      platformVideoId,
      title,
      tags,
      publishedAfter,
      publishedBefore,
      minViewCount,
      maxViewCount,
      minLikeCount,
      maxLikeCount,
      sortBy = 'publishedAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = params

    const offset = (page - 1) * limit

    // 构建查询条件
    const conditions = []

    if (accountId) {
      conditions.push(eq(videos.accountId, accountId))
    }

    if (platformVideoId) {
      conditions.push(eq(videos.platformVideoId, platformVideoId))
    }

    if (title) {
      conditions.push(like(videos.title, `%${title}%`))
    }

    if (publishedAfter) {
      conditions.push(gte(videos.publishedAt, new Date(publishedAfter)))
    }

    if (publishedBefore) {
      conditions.push(lte(videos.publishedAt, new Date(publishedBefore)))
    }

    if (minViewCount !== undefined) {
      conditions.push(gte(videos.viewCount, BigInt(minViewCount)))
    }

    if (maxViewCount !== undefined) {
      conditions.push(lte(videos.viewCount, BigInt(maxViewCount)))
    }

    if (minLikeCount !== undefined) {
      conditions.push(gte(videos.likeCount, BigInt(minLikeCount)))
    }

    if (maxLikeCount !== undefined) {
      conditions.push(lte(videos.likeCount, BigInt(maxLikeCount)))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // 排序映射
    const sortMapping = {
      publishedAt: videos.publishedAt,
      viewCount: videos.viewCount,
      likeCount: videos.likeCount,
      commentCount: videos.commentCount,
      shareCount: videos.shareCount,
      createdAt: videos.firstScrapedAt
    }

    const sortColumn = sortMapping[sortBy] || videos.publishedAt
    const sortDirection = sortOrder === 'asc' ? asc : desc

    try {
      // 获取总数
      const totalCountResult = await db
        .select({ count: count() })
        .from(videos)
        .where(whereClause)

      const total = Number(totalCountResult[0].count)

      // 获取视频列表
      const videoList = await db
        .select()
        .from(videos)
        .where(whereClause)
        .orderBy(sortDirection(sortColumn))
        .limit(limit)
        .offset(offset)

      const totalPages = Math.ceil(total / limit)

      // 转换 BigInt 为 Number，并提取JPEG格式的缩略图URL
      const serializedVideos = videoList.map(video => {
        // 尝试从metadata中获取JPEG格式的封面URL (url_list[2])
        let thumbnailUrl = video.thumbnailUrl
        if (video.metadata && typeof video.metadata === 'object') {
          try {
            const metadata = video.metadata as any
            const urlList = metadata?.video?.cover?.url_list
            if (Array.isArray(urlList) && urlList.length >= 3) {
              // 第3个URL通常是JPEG格式
              thumbnailUrl = urlList[2]
            }
          } catch (error) {
            // 如果提取失败，使用原始thumbnailUrl
            logger.warn('Failed to extract JPEG thumbnail URL', { videoId: video.id, error })
          }
        }

        return {
          ...video,
          thumbnailUrl,
          viewCount: video.viewCount ? Number(video.viewCount) : null,
          likeCount: video.likeCount ? Number(video.likeCount) : null,
          commentCount: video.commentCount ? Number(video.commentCount) : null,
          shareCount: video.shareCount ? Number(video.shareCount) : null,
          saveCount: video.saveCount ? Number(video.saveCount) : null,
          duration: video.duration ? Number(video.duration) : null
        }
      })

      return {
        videos: serializedVideos,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    } catch (error) {
      logger.error('Failed to query videos', {
        params: JSON.parse(JSON.stringify(params, (_, v) => typeof v === 'bigint' ? v.toString() : v)),
        error: (error as Error).message
      })
      throw new Error('查询视频列表失败')
    }
  }

  /**
   * 根据ID获取视频详情
   */
  async getVideoById(id: number) {
    try {
      const video = await db
        .select()
        .from(videos)
        .where(eq(videos.id, id))
        .limit(1)

      return video[0] || null
    } catch (error) {
      logger.error('Failed to get video by id', { id, error })
      throw new Error('获取视频详情失败')
    }
  }

  /**
   * 获取视频统计信息
   */
  async getVideoStats(accountId?: number): Promise<VideoStats> {
    try {
      const whereClause = accountId ? eq(videos.accountId, accountId) : undefined

      // 基础统计
      const basicStats = await db
        .select({
          totalVideos: count(),
          totalViews: sum(videos.viewCount),
          totalLikes: sum(videos.likeCount),
          totalComments: sum(videos.commentCount),
          totalShares: sum(videos.shareCount),
          avgViews: avg(videos.viewCount),
          avgLikes: avg(videos.likeCount),
          avgComments: avg(videos.commentCount),
          avgShares: avg(videos.shareCount)
        })
        .from(videos)
        .where(whereClause)

      const stats = basicStats[0]

      // 获取特殊视频
      const mostViewedVideo = await this.getTopVideo('viewCount', accountId)
      const mostLikedVideo = await this.getTopVideo('likeCount', accountId)
      const mostCommentedVideo = await this.getTopVideo('commentCount', accountId)
      const latestVideo = await this.getLatestVideo(accountId)

      return {
        totalVideos: Number(stats.totalVideos) || 0,
        totalViews: Number(stats.totalViews) || 0,
        totalLikes: Number(stats.totalLikes) || 0,
        totalComments: Number(stats.totalComments) || 0,
        totalShares: Number(stats.totalShares) || 0,
        avgViews: Number(stats.avgViews) || 0,
        avgLikes: Number(stats.avgLikes) || 0,
        avgComments: Number(stats.avgComments) || 0,
        avgShares: Number(stats.avgShares) || 0,
        mostViewedVideo: mostViewedVideo || undefined,
        mostLikedVideo: mostLikedVideo || undefined,
        mostCommentedVideo: mostCommentedVideo || undefined,
        latestVideo: latestVideo || undefined
      }
    } catch (error) {
      logger.error('Failed to get video stats', { accountId, error })
      throw new Error('获取视频统计失败')
    }
  }

  /**
   * 获取视频趋势数据
   */
  async getVideoTrends(accountId?: number): Promise<VideoTrends> {
    try {
      // 这里需要实现按日期分组的统计查询
      // 由于Drizzle ORM的日期函数比较复杂，这里先返回空数据
      // 实际实现时可以使用原生SQL或更复杂的Drizzle查询

      return {
        daily: [],
        weekly: [],
        monthly: []
      }
    } catch (error) {
      logger.error('Failed to get video trends', { accountId, error })
      throw new Error('获取视频趋势失败')
    }
  }

  /**
   * 获取热门视频
   */
  async getPopularVideos(
    accountId?: number,
    metric: 'viewCount' | 'likeCount' | 'commentCount' | 'shareCount' = 'viewCount',
    limit = 10
  ): Promise<VideoWithMetrics[]> {
    try {
      const whereClause = accountId ? eq(videos.accountId, accountId) : undefined

      // 排序映射
      const sortMapping = {
        viewCount: videos.viewCount,
        likeCount: videos.likeCount,
        commentCount: videos.commentCount,
        shareCount: videos.shareCount
      }

      const sortColumn = sortMapping[metric]

      const videoList = await db
        .select()
        .from(videos)
        .where(whereClause)
        .orderBy(desc(sortColumn))
        .limit(limit)

      // 计算每个视频的性能指标
      const videosWithMetrics: VideoWithMetrics[] = videoList.map(video => ({
        ...video,
        metrics: this.calculateMetrics(video)
      }))

      return videosWithMetrics
    } catch (error) {
      logger.error('Failed to get popular videos', { accountId, metric, limit, error })
      throw new Error('获取热门视频失败')
    }
  }

  /**
   * 搜索视频
   */
  async searchVideos(
    query: string,
    accountId?: number,
    page = 1,
    limit = 20
  ): Promise<VideosListResponse> {
    try {
      const offset = (page - 1) * limit

      const conditions = [
        like(videos.title, `%${query}%`)
      ]

      if (accountId) {
        conditions.push(eq(videos.accountId, accountId))
      }

      const whereClause = and(...conditions)

      // 获取总数
      const totalCountResult = await db
        .select({ count: count() })
        .from(videos)
        .where(whereClause)

      const total = Number(totalCountResult[0].count)

      // 获取搜索结果
      const videoList = await db
        .select()
        .from(videos)
        .where(whereClause)
        .orderBy(desc(videos.publishedAt))
        .limit(limit)
        .offset(offset)

      const totalPages = Math.ceil(total / limit)

      return {
        videos: videoList,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    } catch (error) {
      logger.error('Failed to search videos', { query, accountId, error })
      throw new Error('搜索视频失败')
    }
  }

  /**
   * 计算视频性能指标
   */
  calculateMetrics(video: any): VideoMetrics {
    const views = Number(video.viewCount) || 0
    const likes = Number(video.likeCount) || 0
    const comments = Number(video.commentCount) || 0
    const shares = Number(video.shareCount) || 0

    const viewEngagement = views > 0 ? ((likes + comments) / views) * 100 : 0
    const likeRate = views > 0 ? (likes / views) * 100 : 0
    const commentRate = views > 0 ? (comments / views) * 100 : 0
    const shareRate = views > 0 ? (shares / views) * 100 : 0

    // 性能评级
    let performance: VideoMetrics['performance'] = 'poor'
    if (viewEngagement > 10 || likeRate > 5) {
      performance = 'excellent'
    } else if (viewEngagement > 5 || likeRate > 2) {
      performance = 'good'
    } else if (viewEngagement > 2 || likeRate > 1) {
      performance = 'average'
    }

    return {
      viewEngagement: Math.round(viewEngagement * 100) / 100,
      likeRate: Math.round(likeRate * 100) / 100,
      commentRate: Math.round(commentRate * 100) / 100,
      shareRate: Math.round(shareRate * 100) / 100,
      performance
    }
  }

  /**
   * 获取指定指标的顶级视频
   */
  private async getTopVideo(
    metric: 'viewCount' | 'likeCount' | 'commentCount' | 'shareCount',
    accountId?: number
  ) {
    try {
      const whereClause = accountId ? eq(videos.accountId, accountId) : undefined
      const sortColumn = {
        viewCount: videos.viewCount,
        likeCount: videos.likeCount,
        commentCount: videos.commentCount,
        shareCount: videos.shareCount
      }[metric]

      const result = await db
        .select()
        .from(videos)
        .where(whereClause)
        .orderBy(desc(sortColumn))
        .limit(1)

      return result[0] || null
    } catch (error) {
      logger.error('Failed to get top video', { metric, accountId, error })
      return null
    }
  }

  /**
   * 获取最新视频
   */
  private async getLatestVideo(accountId?: number) {
    try {
      const whereClause = accountId ? eq(videos.accountId, accountId) : undefined

      const result = await db
        .select()
        .from(videos)
        .where(whereClause)
        .orderBy(desc(videos.publishedAt))
        .limit(1)

      return result[0] || null
    } catch (error) {
      logger.error('Failed to get latest video', { accountId, error })
      return null
    }
  }
}

// 导出单例
export const videoService = new VideoService()