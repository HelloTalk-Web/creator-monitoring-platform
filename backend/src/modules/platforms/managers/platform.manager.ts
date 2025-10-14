import {
  creatorAccounts,
  videos,
  type NewCreatorAccount,
  type NewVideo
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
import { getPlatformCrawler } from '../crawlers'


/**
 * 平台管理器
 * 职责：处理平台相关的业务逻辑 + 爬虫数据保存
 * 简单的CRUD操作委托给仓储层处理
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
   * 根据参数调用不同平台的适配器，获取用户信息和视频数据并存储
   */
  async createOrUpdateCreatorAccount(params: {
    platform: 'tiktok' | 'instagram' | 'youtube'
    identifier: string
    userId?: number
  }): Promise<{
    accountId: number
    isNew: boolean
    platformId: number
    profile: any
    videosCount: number
  }> {
    const { platform, identifier, userId } = params

    // 获取平台信息
    const platformRecord = await this.getPlatformByName(platform)
    if (!platformRecord) {
      throw new Error(`Platform ${platform} not found`)
    }

    // 获取对应平台的爬虫
    const crawler = await getPlatformCrawler(platform)

    // 生成个人资料URL
    const profileUrl = this.generateProfileUrl(platform, identifier)

    // 1. 通过爬虫获取用户基础信息（原始数据）
    const profileRawData = await crawler.getUserInfo(profileUrl)

    // 2. 通过爬虫获取用户视频数据（原始数据数组）
    const videosRawData = await crawler.getUserVideos(profileUrl)

    // 提取结构化数据
    const { user, stats } = profileRawData
    const profileData = {
      username: user?.uniqueId || '',
      displayName: user?.nickname || '',
      avatarUrl: user?.avatarLarger || user?.avatarMedium || user?.avatarThumb || '',
      bio: user?.signature || '',
      followerCount: stats?.followerCount || 0,
      followingCount: stats?.followingCount || 0,
      totalVideos: stats?.videoCount || 0,
      isVerified: user?.verified || false,
      externalId: user?.id || user?.uniqueId || '',
      profileUrl: this.generateProfileUrl(platform, user?.uniqueId || '')
    }

    // 检查创作者账号是否已存在
    const existingAccount = await db
      .select()
      .from(creatorAccounts)
      .where(eq(creatorAccounts.platformUserId, profileData.externalId || profileData.username))
      .limit(1)

    let accountId: number
    let isNew = false

    if (existingAccount.length > 0) {
      // 更新现有账号
      accountId = existingAccount[0].id

      await db
        .update(creatorAccounts)
        .set({
          username: profileData.username,
          displayName: profileData.displayName,
          avatarUrl: profileData.avatarUrl,
          bio: profileData.bio,
          followerCount: BigInt(profileData.followerCount),
          followingCount: BigInt(profileData.followingCount),
          totalVideos: profileData.totalVideos,
          isVerified: profileData.isVerified,
          lastScrapedAt: new Date(),
          updatedAt: new Date(),
          metadata: profileRawData // 存储原始用户数据
        })
        .where(eq(creatorAccounts.id, accountId))

      logger.info('Creator account updated with real data', {
        platform,
        identifier,
        accountId,
        followerCount: profileData.followerCount
      })
    } else {
      // 创建新账号
      const newAccount: NewCreatorAccount = {
        userId: userId || 1,
        platformId: platformRecord.id,
        platformUserId: profileData.externalId || profileData.username,
        username: profileData.username,
        displayName: profileData.displayName,
        profileUrl: profileData.profileUrl,
        avatarUrl: profileData.avatarUrl,
        bio: profileData.bio,
        followerCount: BigInt(profileData.followerCount),
        followingCount: BigInt(profileData.followingCount),
        totalVideos: profileData.totalVideos,
        isVerified: profileData.isVerified,
        lastScrapedAt: new Date(),
        metadata: profileRawData // 存储原始用户数据
      }

      const [createdAccount] = await db
        .insert(creatorAccounts)
        .values(newAccount)
        .returning()

      accountId = createdAccount.id
      isNew = true

      logger.info('Creator account created with real data', {
        platform,
        identifier,
        accountId,
        followerCount: profileData.followerCount
      })
    }

    // 3. 保存视频数据到数据库
    let videosCount = 0
    if (videosRawData && videosRawData.length > 0) {
      const videoResult = await this.saveVideos(videosRawData, accountId)
      videosCount = videoResult.newCount + videoResult.updatedCount

      logger.info('Videos saved successfully', {
        accountId,
        newCount: videoResult.newCount,
        updatedCount: videoResult.updatedCount
      })
    }

    // 更新账号的视频抓取时间
    await db
      .update(creatorAccounts)
      .set({
        lastVideoCrawlAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(creatorAccounts.id, accountId))

    return {
      accountId,
      isNew,
      platformId: platformRecord.id,
      profile: profileData,
      videosCount
    }
  }

  /**
   * 保存视频列表到数据库（处理原始API数据）
   */
  private async saveVideos(
    videosRawData: any[],
    accountId: number
  ): Promise<{ newCount: number; updatedCount: number }> {
    let newCount = 0
    let updatedCount = 0

    for (const videoRawData of videosRawData) {
      // 提取结构化视频数据
      const videoData = this.extractVideoData(videoRawData)

      // 检查视频是否已存在
      const existingVideo = await db
        .select()
        .from(videos)
        .where(eq(videos.platformVideoId, videoData.videoId))
        .limit(1)

      if (existingVideo.length > 0) {
        // 更新现有视频
        await db
          .update(videos)
          .set({
            title: videoData.title,
            description: videoData.description,
            videoUrl: videoData.videoUrl,
            thumbnailUrl: videoData.thumbnailUrl,
            duration: videoData.duration,
            tags: videoData.tags,
            viewCount: BigInt(videoData.viewCount),
            likeCount: BigInt(videoData.likeCount),
            commentCount: BigInt(videoData.commentCount),
            shareCount: BigInt(videoData.shareCount),
            saveCount: BigInt(videoData.saveCount),
            lastUpdatedAt: new Date(),
            metadata: videoRawData // 存储原始视频数据
          })
          .where(eq(videos.id, existingVideo[0].id))

        updatedCount++
      } else {
        // 创建新视频
        const newVideo: NewVideo = {
          accountId,
          platformVideoId: videoData.videoId,
          title: videoData.title,
          description: videoData.description,
          videoUrl: videoData.videoUrl,
          thumbnailUrl: videoData.thumbnailUrl,
          duration: videoData.duration,
          publishedAt: new Date(videoData.publishedAt),
          tags: videoData.tags,
          viewCount: BigInt(videoData.viewCount),
          likeCount: BigInt(videoData.likeCount),
          commentCount: BigInt(videoData.commentCount),
          shareCount: BigInt(videoData.shareCount),
          saveCount: BigInt(videoData.saveCount),
          firstScrapedAt: new Date(),
          lastUpdatedAt: new Date(),
          metadata: videoRawData // 存储原始视频数据
        }

        await db.insert(videos).values(newVideo)
        newCount++
      }
    }

    return { newCount, updatedCount }
  }

  /**
   * 从原始API数据提取结构化视频数据
   */
  private extractVideoData(videoRawData: any) {
    const video = videoRawData.video || {}
    const stats = videoRawData.statistics || {}

    return {
      videoId: videoRawData.aweme_id || '',
      title: videoRawData.desc || '',
      description: videoRawData.desc || '',
      videoUrl: video.play_addr?.url_list?.[0] || '',
      thumbnailUrl: video.cover?.url_list?.[0] || video.download_addr?.url_list?.[0] || '',
      duration: video.duration ? Math.round(video.duration / 1000) : undefined,
      publishedAt: new Date((videoRawData.create_time || 0) * 1000).toISOString(),
      tags: [], // V3 API中标签信息在不同字段中
      viewCount: stats.play_count || 0,
      likeCount: stats.digg_count || 0,
      commentCount: stats.comment_count || 0,
      shareCount: stats.share_count || 0,
      saveCount: stats.collect_count || 0
    }
  }

  /**
   * 根据平台名称获取平台信息 - 委托给仓储层
   */
  async getPlatformByName(name: string): Promise<PlatformResponse | null> {
    return platformRepository.findByName(name)
  }

  /**
   * 生成个人资料URL
   */
  private generateProfileUrl(platform: string, identifier: string): string {
    switch (platform) {
      case 'tiktok':
        return `https://www.tiktok.com/@${identifier}`
      case 'instagram':
        return `https://www.instagram.com/${identifier}/`
      case 'youtube':
        return `https://www.youtube.com/@${identifier}`
      default:
        return ''
    }
  }
}

// 导出单例
export const platformManager = new PlatformManager()