import {
  creatorAccounts,
  type NewCreatorAccount
} from '../../../shared/database/schema'
import { eq } from 'drizzle-orm'
import { db } from '../../../shared/database/db'
import { logger } from '../../../shared/utils/logger'
import type {
  CreatePlatformRequest,
  UpdatePlatformRequest,
  PlatformResponse,
  PlatformsListResponse
} from '../types'
import { platformRepository } from '../repository/platform.repository'

/**
 * 平台管理器
 * 职责：处理平台相关的业务逻辑（纯CRUD操作）
 * 不包含爬虫逻辑 - 爬虫相关功能请使用 scraperManager
 */
export class PlatformManager {
  /**
   * 获取平台列表 - 委托给仓储层
   */
  async getPlatforms(filters: {
    page?: number
    limit?: number
    name?: string
    isActive?: boolean
  } = {}): Promise<PlatformsListResponse> {
    return platformRepository.findMany(filters)
  }

  /**
   * 根据ID获取平台 - 委托给仓储层
   */
  async getPlatform(id: number): Promise<PlatformResponse | null> {
    return platformRepository.findById(id)
  }

  /**
   * 创建平台 - 委托给仓储层
   */
  async createPlatform(platformData: CreatePlatformRequest): Promise<PlatformResponse> {
    // 基本验证（业务逻辑层职责）
    if (!platformData.name || !platformData.displayName || !platformData.baseUrl || !platformData.urlPattern) {
      throw new Error('Name, displayName, baseUrl, and urlPattern are required')
    }

    return platformRepository.create(platformData)
  }

  /**
   * 更新平台 - 委托给仓储层
   */
  async updatePlatform(id: number, platformData: UpdatePlatformRequest): Promise<PlatformResponse> {
    return platformRepository.update(id, platformData)
  }

  /**
   * 删除平台 - 委托给仓储层
   */
  async deletePlatform(id: number): Promise<void> {
    return platformRepository.delete(id)
  }

  /**
   * 创建或更新创作者账号（纯CRUD操作，不触发爬虫）
   * 如果需要抓取数据，请使用 scraperManager.scrapeAndStoreCreatorAccount()
   */
  async createOrUpdateCreatorAccount(params: {
    platformId: number
    platformUserId: string
    username: string
    displayName?: string
    profileUrl?: string
    avatarUrl?: string
    bio?: string
    followerCount?: number
    followingCount?: number
    totalVideos?: number
    isVerified?: boolean
    userId?: number
    metadata?: any
  }): Promise<{
    accountId: number
    isNew: boolean
  }> {
    const {
      platformId,
      platformUserId,
      username,
      displayName,
      profileUrl,
      avatarUrl,
      bio,
      followerCount,
      followingCount,
      totalVideos,
      isVerified,
      userId,
      metadata
    } = params

    // 检查创作者账号是否已存在
    const existingAccount = await db
      .select()
      .from(creatorAccounts)
      .where(eq(creatorAccounts.platformUserId, platformUserId))
      .limit(1)

    let accountId: number
    let isNew = false

    if (existingAccount.length > 0) {
      // 更新现有账号
      accountId = existingAccount[0].id

      await db
        .update(creatorAccounts)
        .set({
          username,
          displayName,
          profileUrl,
          avatarUrl,
          bio,
          followerCount: followerCount ? BigInt(followerCount) : undefined,
          followingCount: followingCount ? BigInt(followingCount) : undefined,
          totalVideos,
          isVerified,
          updatedAt: new Date(),
          metadata
        })
        .where(eq(creatorAccounts.id, accountId))

      logger.info('Creator account updated', {
        accountId,
        username
      })
    } else {
      // 创建新账号
      const newAccount: NewCreatorAccount = {
        userId: userId || 1,
        platformId,
        platformUserId,
        username,
        displayName: displayName || username,
        profileUrl: profileUrl || '',
        avatarUrl: avatarUrl || '',
        bio: bio || '',
        followerCount: followerCount ? BigInt(followerCount) : BigInt(0),
        followingCount: followingCount ? BigInt(followingCount) : BigInt(0),
        totalVideos: totalVideos || 0,
        isVerified: isVerified || false,
        metadata
      }

      const [createdAccount] = await db
        .insert(creatorAccounts)
        .values(newAccount)
        .returning()

      accountId = createdAccount.id
      isNew = true

      logger.info('Creator account created', {
        accountId,
        username
      })
    }

    return {
      accountId,
      isNew
    }
  }

  /**
   * 根据平台名称获取平台信息 - 委托给仓储层
   */
  async getPlatformByName(name: string): Promise<PlatformResponse | null> {
    return platformRepository.findByName(name)
  }
}

// 导出单例
export const platformManager = new PlatformManager()