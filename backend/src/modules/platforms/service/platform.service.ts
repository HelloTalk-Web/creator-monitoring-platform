import { logger } from '../../../shared/utils/logger'
import { db } from '../../../shared/database/db'
import { creatorAccounts, platforms } from '../../../shared/database/schema'
import { eq, and, like, desc, asc, count } from 'drizzle-orm'

/**
 * 平台服务
 * 职责：处理平台和创作者账号的数据查询业务逻辑
 */
export class PlatformService {
  /**
   * 获取创作者账号列表
   */
  async getCreatorAccounts(filters: {
    page?: number
    limit?: number
    platform?: string
    userId?: number
    username?: string
    sortBy?: 'createdAt' | 'updatedAt' | 'followerCount' | 'username'
    sortOrder?: 'asc' | 'desc'
  } = {}) {
    const {
      page = 1,
      limit = 10,
      platform,
      userId,
      username,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = filters

    const offset = (page - 1) * limit

    // 构建查询条件
    const conditions = []

    if (platform) {
      conditions.push(eq(platforms.name, platform))
    }

    if (userId) {
      conditions.push(eq(creatorAccounts.userId, userId))
    }

    if (username) {
      conditions.push(like(creatorAccounts.username, `%${username}%`))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // 排序映射
    const sortMapping = {
      createdAt: creatorAccounts.createdAt,
      updatedAt: creatorAccounts.updatedAt,
      followerCount: creatorAccounts.followerCount,
      username: creatorAccounts.username
    }

    const sortColumn = sortMapping[sortBy] || creatorAccounts.updatedAt
    const sortDirection = sortOrder === 'asc' ? asc : desc

    try {
      // 获取总数
      const totalCountResult = await db
        .select({ count: count() })
        .from(creatorAccounts)
        .leftJoin(platforms, eq(creatorAccounts.platformId, platforms.id))
        .where(whereClause)

      const total = Number(totalCountResult[0].count)

      // 获取账号列表
      const accountList = await db
        .select({
          id: creatorAccounts.id,
          userId: creatorAccounts.userId,
          platformId: creatorAccounts.platformId,
          platformUserId: creatorAccounts.platformUserId,
          username: creatorAccounts.username,
          displayName: creatorAccounts.displayName,
          profileUrl: creatorAccounts.profileUrl,
          avatarUrl: creatorAccounts.avatarUrl,
          bio: creatorAccounts.bio,
          followerCount: creatorAccounts.followerCount,
          followingCount: creatorAccounts.followingCount,
          totalVideos: creatorAccounts.totalVideos,
          isVerified: creatorAccounts.isVerified,
          status: creatorAccounts.status,
          lastScrapedAt: creatorAccounts.lastScrapedAt,
          lastVideoCrawlAt: creatorAccounts.lastVideoCrawlAt,
          scrapeFrequency: creatorAccounts.scrapeFrequency,
          createdAt: creatorAccounts.createdAt,
          updatedAt: creatorAccounts.updatedAt,
          platformName: platforms.name,
          platformDisplayName: platforms.displayName
        })
        .from(creatorAccounts)
        .leftJoin(platforms, eq(creatorAccounts.platformId, platforms.id))
        .where(whereClause)
        .orderBy(sortDirection(sortColumn))
        .limit(limit)
        .offset(offset)

      const totalPages = Math.ceil(total / limit)

      // 处理 BigInt 类型转换
      const processedAccountList = accountList.map(account => ({
        ...account,
        followerCount: Number(account.followerCount) || 0,
        followingCount: Number(account.followingCount) || 0
      }))

      return {
        accounts: processedAccountList,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    } catch (error) {
      logger.error('Failed to query creator accounts', { filters, error })
      throw new Error('查询创作者账号列表失败')
    }
  }

  /**
   * 根据ID获取创作者账号详情
   */
  async getCreatorAccountById(id: number) {
    try {
      const account = await db
        .select({
          id: creatorAccounts.id,
          userId: creatorAccounts.userId,
          platformId: creatorAccounts.platformId,
          platformUserId: creatorAccounts.platformUserId,
          username: creatorAccounts.username,
          displayName: creatorAccounts.displayName,
          profileUrl: creatorAccounts.profileUrl,
          avatarUrl: creatorAccounts.avatarUrl,
          bio: creatorAccounts.bio,
          followerCount: creatorAccounts.followerCount,
          followingCount: creatorAccounts.followingCount,
          totalVideos: creatorAccounts.totalVideos,
          isVerified: creatorAccounts.isVerified,
          status: creatorAccounts.status,
          lastScrapedAt: creatorAccounts.lastScrapedAt,
          lastVideoCrawlAt: creatorAccounts.lastVideoCrawlAt,
          scrapeFrequency: creatorAccounts.scrapeFrequency,
          metadata: creatorAccounts.metadata,
          createdAt: creatorAccounts.createdAt,
          updatedAt: creatorAccounts.updatedAt,
          platformName: platforms.name,
          platformDisplayName: platforms.displayName,
          platformColor: platforms.colorCode
        })
        .from(creatorAccounts)
        .leftJoin(platforms, eq(creatorAccounts.platformId, platforms.id))
        .where(eq(creatorAccounts.id, id))
        .limit(1)

      if (account[0]) {
        // 处理 BigInt 类型转换
        return {
          ...account[0],
          followerCount: Number(account[0].followerCount) || 0,
          followingCount: Number(account[0].followingCount) || 0
        }
      }
      return null
    } catch (error) {
      logger.error('Failed to get creator account by id', { id, error })
      throw new Error('获取创作者账号详情失败')
    }
  }

  /**
   * 根据平台获取创作者账号
   */
  async getCreatorAccountsByPlatform(platformName: string, filters: {
    page?: number
    limit?: number
    userId?: number
  } = {}) {
    return this.getCreatorAccounts({
      ...filters,
      platform: platformName
    })
  }

  /**
   * 获取平台统计信息
   */
  async getPlatformStats(platformName?: string) {
    try {
      const whereClause = platformName
        ? eq(platforms.name, platformName)
        : undefined

      const stats = await db
        .select({
          platformName: platforms.name,
          platformDisplayName: platforms.displayName,
          accountCount: count(creatorAccounts.id),
          totalFollowers: creatorAccounts.followerCount,
          totalVideos: creatorAccounts.totalVideos
        })
        .from(platforms)
        .leftJoin(creatorAccounts, eq(platforms.id, creatorAccounts.platformId))
        .where(whereClause)
        .groupBy(platforms.id, platforms.name, platforms.displayName)

      return stats.map(stat => ({
        ...stat,
        totalFollowers: Number(stat.totalFollowers) || 0,
        totalVideos: Number(stat.totalVideos) || 0
      }))
    } catch (error) {
      logger.error('Failed to get platform stats', { platformName, error })
      throw new Error('获取平台统计失败')
    }
  }

  /**
   * 搜索创作者账号
   */
  async searchCreatorAccounts(query: string, filters: {
    page?: number
    limit?: number
    platform?: string
    userId?: number
  } = {}) {
    return this.getCreatorAccounts({
      ...filters,
      username: query
    })
  }

  /**
   * 删除创作者账号
   */
  async deleteCreatorAccount(id: number) {
    try {
      // 先检查账号是否存在
      const account = await this.getCreatorAccountById(id)

      if (!account) {
        throw new Error('创作者账号不存在')
      }

      // 删除账号（关联的视频和任务会因为外键级联删除自动删除）
      await db
        .delete(creatorAccounts)
        .where(eq(creatorAccounts.id, id))

      logger.info('Creator account deleted successfully', {
        accountId: id,
        username: account.username
      })

      return true
    } catch (error) {
      logger.error('Failed to delete creator account', { id, error })
      throw error
    }
  }
}

// 导出单例
export const platformService = new PlatformService()