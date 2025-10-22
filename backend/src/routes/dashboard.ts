import { Router, Request, Response } from 'express'
import { db } from '../shared/database/db'
import { creatorAccounts, videos, platforms } from '../shared/database/schema'
import { sql, count, sum, desc, eq } from 'drizzle-orm'
import { logger } from '../shared/utils/logger'

const router = Router()

/**
 * 获取仪表板统计数据
 * GET /api/dashboard/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // 获取账号总数
    const accountCountResult = await db
      .select({ count: count() })
      .from(creatorAccounts)

    const totalAccounts = Number(accountCountResult[0]?.count || 0)

    // 获取视频总数
    const videoCountResult = await db
      .select({ count: count() })
      .from(videos)

    const totalVideos = Number(videoCountResult[0]?.count || 0)

    // 获取总播放量和总点赞数
    const statsResult = await db
      .select({
        totalViews: sum(videos.viewCount),
        totalLikes: sum(videos.likeCount)
      })
      .from(videos)

    const totalViews = Number(statsResult[0]?.totalViews || 0)
    const totalLikes = Number(statsResult[0]?.totalLikes || 0)

    // 获取平台分布
    const platformDistribution = await db
      .select({
        platformName: sql<string>`COALESCE(${platforms.displayName}, ${platforms.name})`,
        platformColor: platforms.colorCode,
        count: count()
      })
      .from(creatorAccounts)
      .leftJoin(platforms, eq(platforms.id, creatorAccounts.platformId))
      .groupBy(platforms.displayName, platforms.name, platforms.colorCode)

    const platformsData = platformDistribution.map(p => ({
      platformName: String(p.platformName || 'Unknown'),
      count: Number(p.count),
      color: p.platformColor || '#1890ff'
    }))

    res.json({
      success: true,
      data: {
        stats: {
          totalAccounts,
          totalVideos,
          totalViews,
          totalLikes
        },
        platforms: platformsData
      }
    })
  } catch (error) {
    logger.error('Failed to fetch dashboard stats', {
      error: (error as Error).message,
      stack: (error as Error).stack
    })

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch dashboard statistics'
      }
    })
  }
})

/**
 * 获取热门视频
 * GET /api/dashboard/trending-videos
 */
router.get('/trending-videos', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50)

    const trendingVideos = await db
      .select({
        id: videos.id,
        title: videos.title,
        thumbnailUrl: videos.thumbnailUrl,
        pageUrl: videos.pageUrl,
        viewCount: videos.viewCount,
        likeCount: videos.likeCount,
        commentCount: videos.commentCount,
        publishedAt: videos.publishedAt,
        duration: videos.duration,
        creatorDisplayName: creatorAccounts.displayName,
        platformDisplayName: sql<string>`COALESCE(${platforms.displayName}, ${platforms.name})`
      })
      .from(videos)
      .leftJoin(creatorAccounts, eq(creatorAccounts.id, videos.accountId))
      .leftJoin(platforms, eq(platforms.id, creatorAccounts.platformId))
      .orderBy(desc(videos.viewCount))
      .limit(limit)

    res.json({
      success: true,
      data: {
        videos: trendingVideos.map(v => ({
          ...v,
          viewCount: Number(v.viewCount || 0),
          likeCount: Number(v.likeCount || 0),
          commentCount: Number(v.commentCount || 0),
          duration: Number(v.duration || 0)
        }))
      }
    })
  } catch (error) {
    logger.error('Failed to fetch trending videos', {
      error: (error as Error).message,
      stack: (error as Error).stack
    })

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch trending videos'
      }
    })
  }
})

/**
 * 获取最新视频
 * GET /api/dashboard/recent-videos
 */
router.get('/recent-videos', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50)

    const recentVideos = await db
      .select({
        id: videos.id,
        title: videos.title,
        thumbnailUrl: videos.thumbnailUrl,
        pageUrl: videos.pageUrl,
        publishedAt: videos.publishedAt,
        duration: videos.duration,
        creatorDisplayName: creatorAccounts.displayName,
        platformDisplayName: sql<string>`COALESCE(${platforms.displayName}, ${platforms.name})`
      })
      .from(videos)
      .leftJoin(creatorAccounts, eq(creatorAccounts.id, videos.accountId))
      .leftJoin(platforms, eq(platforms.id, creatorAccounts.platformId))
      .orderBy(desc(videos.publishedAt))
      .limit(limit)

    res.json({
      success: true,
      data: {
        videos: recentVideos.map(v => ({
          ...v,
          duration: Number(v.duration || 0),
          publishedAt: v.publishedAt ? new Date(v.publishedAt).toISOString() : null
        }))
      }
    })
  } catch (error) {
    logger.error('Failed to fetch recent videos', {
      error: (error as Error).message,
      stack: (error as Error).stack
    })

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch recent videos'
      }
    })
  }
})

export default router
