import { logger } from '../../../shared/utils/logger'
import { getPlatformCrawler } from '../crawlers'
import { creatorAccounts, videos, platforms, type NewCreatorAccount, type NewVideo } from '../../../shared/database/schema'
import { eq } from 'drizzle-orm'
import { db } from '../../../shared/database/db'

/**
 * 爬虫管理器
 * 职责：处理数据抓取业务逻辑，协调爬虫和数据库存储
 */
export class ScraperManager {
  /**
   * 根据URL抓取创作者信息并存储到数据库
   */
  async scrapeAndStoreCreatorAccount(params: {
    url: string
    userId?: number
  }): Promise<{
    accountId: number
    isNew: boolean
    platformId: number
    profile: any
    videosCount: number
  }> {
    const { url, userId } = params

    // 1. 从URL解析平台和标识符
    const parsed = this.parseUrl(url)
    if (!parsed.isValid || parsed.platform === 'unknown') {
      throw new Error('无效的URL格式或不支持的平台')
    }

    // 2. 获取平台信息
    const platformRecord = await this.getPlatformByName(parsed.platform)
    if (!platformRecord) {
      throw new Error(`Platform ${parsed.platform} not found`)
    }

    // 3. 获取对应平台的爬虫
    const crawler = await getPlatformCrawler(parsed.platform)

    // 4. 通过爬虫获取用户基础信息（原始数据）
    const profileRawData = await crawler.getUserInfo(url)

    // 5. 通过爬虫获取用户视频数据（原始数据数组）
    const videosRawData = await crawler.getUserVideos(url)

    // 6. 提取结构化数据
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
      profileUrl: this.generateProfileUrl(parsed.platform, user?.uniqueId || '')
    }

    // 7. 检查创作者账号是否已存在
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
        platform: parsed.platform,
        identifier: parsed.identifier,
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
        platform: parsed.platform,
        identifier: parsed.identifier,
        accountId,
        followerCount: profileData.followerCount
      })
    }

    // 8. 保存视频数据到数据库
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

    // 9. 更新账号的视频抓取时间
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

    // 限制字段长度以符合数据库约束
    const title = (videoRawData.desc || '').substring(0, 500)
    const description = (videoRawData.desc || '').substring(0, 1000)
    const videoUrl = video.play_addr?.url_list?.[0] || ''

    // 提取JPEG格式的封面URL（优先使用第3个URL，通常是JPEG格式）
    let thumbnailUrl = ''
    const coverUrlList = video.cover?.url_list || video.download_addr?.url_list || []
    if (coverUrlList.length >= 3) {
      // 第3个URL通常是JPEG格式，浏览器兼容性最好
      thumbnailUrl = coverUrlList[2]
    } else if (coverUrlList.length > 0) {
      // 如果没有第3个URL，使用第一个并尝试转换为JPEG
      thumbnailUrl = coverUrlList[0].replace(/\.heic\?/i, '.jpeg?')
    }

    // 从标题中提取hashtag标签
    const tags = this.extractHashtags(title)

    return {
      videoId: videoRawData.aweme_id || '',
      title,
      description,
      videoUrl: videoUrl.substring(0, 500),
      thumbnailUrl: thumbnailUrl.substring(0, 500),
      duration: video.duration ? Math.round(video.duration / 1000) : undefined,
      publishedAt: new Date((videoRawData.create_time || 0) * 1000).toISOString(),
      tags,
      viewCount: stats.play_count || 0,
      likeCount: stats.digg_count || 0,
      commentCount: stats.comment_count || 0,
      shareCount: stats.share_count || 0,
      saveCount: stats.collect_count || 0
    }
  }

  /**
   * 从文本中提取hashtag标签
   */
  private extractHashtags(text: string): string[] {
    if (!text) return []

    // 匹配 #标签 格式（支持字母、数字、下划线和中文）
    const hashtagRegex = /#([a-zA-Z0-9_\u4e00-\u9fff]+)/g
    const matches = text.matchAll(hashtagRegex)

    const tags: string[] = []
    for (const match of matches) {
      if (match[1]) {
        tags.push(match[1])
      }
    }

    // 去重并返回
    return Array.from(new Set(tags))
  }

  /**
   * 根据平台名称获取平台信息
   */
  private async getPlatformByName(name: string) {
    try {
      // 直接查询数据库获取平台信息
      const result = await db
        .select()
        .from(platforms)
        .where(eq(platforms.name, name))
        .limit(1)

      if (result.length === 0) {
        // 如果平台不存在，创建一个基础平台记录
        const [newPlatform] = await db
          .insert(platforms)
          .values({
            name: name,
            displayName: name.charAt(0).toUpperCase() + name.slice(1),
            baseUrl: `https://www.${name}.com`,
            urlPattern: `https://www.${name}.com/@{identifier}`,
            colorCode: '#1890ff',
            isActive: true
          })
          .returning()

        return newPlatform
      }

      return result[0]
    } catch (error) {
      logger.error('Failed to get platform by name', { name, error })
      throw new Error(`Failed to get platform: ${name}`)
    }
  }

  /**
   * 从URL解析平台和用户信息
   */
  private parseUrl(url: string): {
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

  /**
   * 根据视频URL更新单个视频的数据
   */
  async updateVideoByUrl(videoUrl: string): Promise<{
    videoId: number
    updated: boolean
    message: string
  }> {
    try {
      // 1. 从视频URL提取平台和视频ID
      const parsed = this.parseVideoUrl(videoUrl)
      if (!parsed.isValid || parsed.platform === 'unknown') {
        throw new Error('无效的视频URL格式或不支持的平台')
      }

      logger.info('Updating video from URL', {
        url: videoUrl,
        platform: parsed.platform,
        videoId: parsed.videoId
      })

      // 2. 从数据库查找视频
      const existingVideo = await db
        .select()
        .from(videos)
        .where(eq(videos.platformVideoId, parsed.videoId))
        .limit(1)

      if (existingVideo.length === 0) {
        throw new Error('视频不存在于数据库中')
      }

      const video = existingVideo[0]

      // 3. 获取对应平台的爬虫
      const crawler = await getPlatformCrawler(parsed.platform)

      // 4. 调用爬虫获取最新视频数据
      const videoRawData = await crawler.getVideoInfo(videoUrl)

      // 5. 提取结构化视频数据
      const videoData = this.extractVideoData(videoRawData)

      // 6. 更新数据库
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
        .where(eq(videos.id, video.id))

      logger.info('Video updated successfully', {
        videoId: video.id,
        platformVideoId: parsed.videoId,
        viewCount: videoData.viewCount,
        likeCount: videoData.likeCount
      })

      return {
        videoId: video.id,
        updated: true,
        message: '视频数据更新成功'
      }
    } catch (error) {
      logger.error('Failed to update video', {
        url: videoUrl,
        error: (error as Error).message
      })
      throw error
    }
  }

  /**
   * 从视频URL解析平台和视频ID
   */
  private parseVideoUrl(url: string): {
    platform: 'tiktok' | 'instagram' | 'youtube' | 'unknown'
    videoId: string
    isValid: boolean
  } {
    try {
      // TikTok视频URL: https://www.tiktok.com/@username/video/7463250363559218474
      const tiktokMatch = url.match(/tiktok\.com\/@[^\/]+\/video\/(\d+)/)
      if (tiktokMatch) {
        return {
          platform: 'tiktok',
          videoId: tiktokMatch[1],
          isValid: true
        }
      }

      // Instagram视频URL: https://www.instagram.com/p/VIDEO_ID/
      const instagramMatch = url.match(/instagram\.com\/(?:p|reel)\/([^\/\?]+)/)
      if (instagramMatch) {
        return {
          platform: 'instagram',
          videoId: instagramMatch[1],
          isValid: true
        }
      }

      // YouTube视频URL: https://www.youtube.com/watch?v=VIDEO_ID
      const youtubeMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/)
      if (youtubeMatch) {
        return {
          platform: 'youtube',
          videoId: youtubeMatch[1],
          isValid: true
        }
      }

      return {
        platform: 'unknown',
        videoId: '',
        isValid: false
      }
    } catch (error) {
      return {
        platform: 'unknown',
        videoId: '',
        isValid: false
      }
    }
  }
}

// 导出单例
export const scraperManager = new ScraperManager()