import { prisma } from '../database/prisma'
import { logger } from '../utils/logger'

/**
 * 数据库服务层
 * 封装常用的数据库操作，提供业务逻辑抽象
 */
export class DatabaseService {
  /**
   * 用户相关操作
   */
  static async createUser(data: {
    email: string
    username: string
    passwordHash: string
    planType?: string
    apiQuota?: number
  }) {
    return await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash: data.passwordHash,
        planType: data.planType || 'free',
        apiQuota: data.apiQuota || 1000,
      }
    })
  }

  static async findUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        creatorAccounts: {
          include: {
            platform: true
          }
        }
      }
    })
  }

  static async findUserById(id: number) {
    return await prisma.user.findUnique({
      where: { id }
    })
  }

  static async updateUserApiUsage(userId: number, increment: number) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        apiUsed: {
          increment
        }
      }
    })
  }

  /**
   * 平台相关操作
   */
  static async getAllPlatforms() {
    return await prisma.platform.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
  }

  static async getPlatformByName(name: string) {
    return await prisma.platform.findUnique({
      where: { name }
    })
  }

  /**
   * 创作者账号相关操作
   */
  static async createCreatorAccount(data: {
    userId: number
    platformId: number
    platformUserId: string
    username: string
    displayName?: string
    profileUrl: string
    avatarUrl?: string
    bio?: string
    followerCount?: number
    followingCount?: number
    totalVideos?: number
    isVerified?: boolean
    metadata?: any
  }) {
    return await prisma.creatorAccount.create({
      data: {
        userId: data.userId,
        platformId: data.platformId,
        platformUserId: data.platformUserId,
        username: data.username,
        displayName: data.displayName,
        profileUrl: data.profileUrl,
        avatarUrl: data.avatarUrl,
        bio: data.bio,
        followerCount: BigInt(data.followerCount || 0),
        followingCount: BigInt(data.followingCount || 0),
        totalVideos: data.totalVideos || 0,
        isVerified: data.isVerified || false,
        metadata: data.metadata || {}
      },
      include: {
        platform: true
      }
    })
  }

  static async getUserAccounts(userId: number, options: {
    page?: number
    limit?: number
    platform?: string
    status?: string
  } = {}) {
    const { page = 1, limit = 20, platform, status } = options
    const skip = (page - 1) * limit

    const where: any = { userId }

    if (platform) {
      where.platform = { name: platform }
    }

    if (status) {
      where.status = status
    }

    const [accounts, total] = await Promise.all([
      prisma.creatorAccount.findMany({
        where,
        include: {
          platform: true,
          _count: {
            select: { videos: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.creatorAccount.count({ where })
    ])

    return {
      accounts: accounts.map(account => ({
        ...account,
        followerCount: Number(account.followerCount),
        followingCount: Number(account.followingCount),
        videoCount: account._count.videos
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  static async getAccountById(accountId: number, userId: number) {
    return await prisma.creatorAccount.findFirst({
      where: {
        id: accountId,
        userId
      },
      include: {
        platform: true,
        _count: {
          select: { videos: true }
        }
      }
    })
  }

  static async updateAccountScrapeTime(accountId: number) {
    return await prisma.creatorAccount.update({
      where: { id: accountId },
      data: {
        lastScrapedAt: new Date()
      }
    })
  }

  static async deleteAccount(accountId: number, userId: number) {
    return await prisma.creatorAccount.deleteMany({
      where: {
        id: accountId,
        userId
      }
    })
  }

  /**
   * 视频相关操作
   */
  static async createVideo(data: {
    accountId: number
    platformVideoId: string
    title: string
    description?: string
    videoUrl: string
    thumbnailUrl: string
    duration?: number
    publishedAt: Date
    tags?: string[]
    viewCount?: number
    likeCount?: number
    commentCount?: number
    shareCount?: number
    saveCount?: number
    metadata?: any
  }) {
    return await prisma.video.create({
      data: {
        accountId: data.accountId,
        platformVideoId: data.platformVideoId,
        title: data.title,
        description: data.description,
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl,
        duration: data.duration,
        publishedAt: data.publishedAt,
        tags: data.tags || [],
        viewCount: BigInt(data.viewCount || 0),
        likeCount: BigInt(data.likeCount || 0),
        commentCount: BigInt(data.commentCount || 0),
        shareCount: BigInt(data.shareCount || 0),
        saveCount: BigInt(data.saveCount || 0),
        metadata: data.metadata || {}
      }
    })
  }

  static async getAccountVideos(accountId: number, options: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}) {
    const { page = 1, limit = 20, sortBy = 'publishedAt', sortOrder = 'desc' } = options
    const skip = (page - 1) * limit

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where: { accountId },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      prisma.video.count({ where: { accountId } })
    ])

    return {
      videos: videos.map(video => ({
        ...video,
        viewCount: Number(video.viewCount),
        likeCount: Number(video.likeCount),
        commentCount: Number(video.commentCount),
        shareCount: Number(video.shareCount),
        saveCount: Number(video.saveCount)
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  static async updateVideoMetrics(videoId: number, metrics: {
    viewCount?: number
    likeCount?: number
    commentCount?: number
    shareCount?: number
    saveCount?: number
  }) {
    return await prisma.video.update({
      where: { id: videoId },
      data: {
        viewCount: metrics.viewCount !== undefined ? BigInt(metrics.viewCount) : undefined,
        likeCount: metrics.likeCount !== undefined ? BigInt(metrics.likeCount) : undefined,
        commentCount: metrics.commentCount !== undefined ? BigInt(metrics.commentCount) : undefined,
        shareCount: metrics.shareCount !== undefined ? BigInt(metrics.shareCount) : undefined,
        saveCount: metrics.saveCount !== undefined ? BigInt(metrics.saveCount) : undefined,
        lastUpdatedAt: new Date()
      }
    })
  }

  /**
   * 抓取任务相关操作
   */
  static async createScrapeTask(data: {
    userId: number
    accountId?: number
    taskType: string
    priority?: number
    config?: any
  }) {
    return await prisma.scrapeTask.create({
      data: {
        userId: data.userId,
        accountId: data.accountId,
        taskType: data.taskType,
        priority: data.priority || 5,
        config: data.config || {}
      }
    })
  }

  static async updateScrapeTask(taskId: number, data: {
    status?: string
    startedAt?: Date
    completedAt?: Date
    errorMessage?: string
    totalVideosFound?: number
    newVideosAdded?: number
    videosUpdated?: number
  }) {
    return await prisma.scrapeTask.update({
      where: { id: taskId },
      data
    })
  }

  static async getUserTasks(userId: number, options: {
    page?: number
    limit?: number
    status?: string
  } = {}) {
    const { page = 1, limit = 20, status } = options
    const skip = (page - 1) * limit

    const where: any = { userId }
    if (status) {
      where.status = status
    }

    const [tasks, total] = await Promise.all([
      prisma.scrapeTask.findMany({
        where,
        include: {
          account: {
            include: {
              platform: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.scrapeTask.count({ where })
    ])

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * 系统配置相关操作
   */
  static async getSystemConfig(key: string) {
    const config = await prisma.systemConfig.findUnique({
      where: { key }
    })
    return config?.value
  }

  static async setSystemConfig(key: string, value: any, description?: string) {
    return await prisma.systemConfig.upsert({
      where: { key },
      update: {
        value,
        description
      },
      create: {
        key,
        value,
        description
      }
    })
  }

  /**
   * 审计日志相关操作
   */
  static async createAuditLog(data: {
    userId?: number
    action: string
    resourceType: string
    resourceId?: number
    oldValues?: any
    newValues?: any
    ipAddress?: string
    userAgent?: string
  }) {
    return await prisma.auditLog.create({
      data
    })
  }
}

export default DatabaseService