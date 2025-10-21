import { logger } from '../../../shared/utils/logger'
import { getPlatformCrawler } from '../crawlers'
import { getTransformer } from '../transformers'
import { dataMapper } from '../transformers/data.mapper'
import { creatorAccounts, videos, platforms, type NewCreatorAccount, type NewVideo } from '../../../shared/database/schema'
import { eq } from 'drizzle-orm'
import { db } from '../../../shared/database/db'
import { TrackVideoChanges } from '../../../shared/decorators/track-video-changes.decorator'

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
    videoLimit?: number
  }): Promise<{
    accountId: number
    isNew: boolean
    platformId: number
    profile: any
    videosCount: number
  }> {
    const { url, userId, videoLimit } = params
    const { limit: maxVideos } = this.normalizeVideoLimit(videoLimit)

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
    let videosRawData: any[]

    // 如果用户要求的视频数量超过50，使用分页版本
    if (maxVideos > 50) {
      videosRawData = await crawler.getAllUserVideos(url, {
        maxLimit: maxVideos
      })
    } else {
      videosRawData = await crawler.getUserVideos(url, {
        limit: maxVideos
      })
    }

    // 6. 使用Transformer将原始数据转换为标准格式
    const transformer = getTransformer(parsed.platform)
    const standardizedProfile = transformer.transformProfile(profileRawData)
    const standardizedVideos = videosRawData
      .slice(0, maxVideos)
      .map(video => transformer.transformVideo(video))

    // 7. 使用DataMapper将标准格式映射为数据库格式
    const profileDbMapping = dataMapper.mapProfileToDatabase(standardizedProfile, {
      userId: typeof userId === 'string' ? 1 : (userId || 1), // 确保是数字类型
      platformId: platformRecord.id
    })

    // 8. 检查创作者账号是否已存在
    const existingAccount = await db
      .select()
      .from(creatorAccounts)
      .where(eq(creatorAccounts.platformUserId, profileDbMapping.platformUserId))
      .limit(1)

    let accountId: number
    let isNew = false

    if (existingAccount.length > 0) {
      // 更新现有账号
      accountId = existingAccount[0].id

      await db
        .update(creatorAccounts)
        .set({
          username: profileDbMapping.username,
          displayName: profileDbMapping.displayName,
          profileUrl: profileDbMapping.profileUrl,
          avatarUrl: profileDbMapping.avatarUrl,
          bio: profileDbMapping.bio,
          followerCount: profileDbMapping.followerCount,
          followingCount: profileDbMapping.followingCount,
          totalVideos: profileDbMapping.totalVideos,
          isVerified: profileDbMapping.isVerified,
          lastScrapedAt: new Date(),
          updatedAt: new Date(),
          metadata: profileDbMapping.metadata // 存储原始用户数据
        })
        .where(eq(creatorAccounts.id, accountId))

      logger.info('Creator account updated with real data', {
        platform: parsed.platform,
        identifier: parsed.identifier,
        accountId,
        followerCount: Number(profileDbMapping.followerCount)
      })
    } else {
      // 创建新账号
      const newAccount: NewCreatorAccount = {
        userId: profileDbMapping.userId,
        platformId: profileDbMapping.platformId,
        platformUserId: profileDbMapping.platformUserId,
        username: profileDbMapping.username,
        displayName: profileDbMapping.displayName,
        profileUrl: profileDbMapping.profileUrl,
        avatarUrl: profileDbMapping.avatarUrl,
        bio: profileDbMapping.bio,
        followerCount: profileDbMapping.followerCount,
        followingCount: profileDbMapping.followingCount,
        totalVideos: profileDbMapping.totalVideos,
        isVerified: profileDbMapping.isVerified,
        lastScrapedAt: new Date(),
        metadata: profileDbMapping.metadata // 存储原始用户数据
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
        followerCount: Number(profileDbMapping.followerCount)
      })
    }

    // 9. 保存视频数据到数据库
    let videosCount = 0
    if (standardizedVideos && standardizedVideos.length > 0) {
      const videoResult = await this.saveStandardizedVideos(standardizedVideos, accountId)
      videosCount = videoResult.newCount + videoResult.updatedCount

      logger.info('Videos saved successfully', {
        accountId,
        newCount: videoResult.newCount,
        updatedCount: videoResult.updatedCount
      })
    }

    // 10. 更新账号的视频抓取时间
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
      profile: standardizedProfile,
      videosCount
    }
  }

  /**
   * 保存视频列表到数据库（处理原始API数据）
   * 使用装饰器自动追踪视频变化,无需手动触发事件
   */
  @TrackVideoChanges()
  private async saveVideos(
    videosRawData: any[],
    accountId: number
  ): Promise<{
    newCount: number
    updatedCount: number
    videoUpdates: Array<{
      videoId: number
      oldData: {
        viewCount: number
        likeCount: number
        commentCount: number
        shareCount: number
      }
      newData: {
        viewCount: number
        likeCount: number
        commentCount: number
        shareCount: number
      }
    }>
  }> {
    let newCount = 0
    let updatedCount = 0
    const videoUpdates: Array<{
      videoId: number
      oldData: any
      newData: any
    }> = []

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
        // 保存旧数据用于decorator
        const oldVideo = existingVideo[0]

        // 更新现有视频
        await db
          .update(videos)
          .set({
            title: videoData.title,
            description: videoData.description,
            videoUrl: videoData.videoUrl,
            pageUrl: videoData.pageUrl,
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

        // 收集变更信息供decorator使用
        videoUpdates.push({
          videoId: oldVideo.id,
          oldData: {
            viewCount: Number(oldVideo.viewCount),
            likeCount: Number(oldVideo.likeCount),
            commentCount: Number(oldVideo.commentCount),
            shareCount: Number(oldVideo.shareCount)
          },
          newData: {
            viewCount: videoData.viewCount,
            likeCount: videoData.likeCount,
            commentCount: videoData.commentCount,
            shareCount: videoData.shareCount
          }
        })

        updatedCount++
      } else {
        // 创建新视频
        const newVideo: NewVideo = {
          accountId,
          platformVideoId: videoData.videoId,
          title: videoData.title,
          description: videoData.description,
          videoUrl: videoData.videoUrl,
          pageUrl: videoData.pageUrl,
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

    return { newCount, updatedCount, videoUpdates }
  }

  /**
   * 保存标准化视频数据到数据库（处理StandardizedVideo格式）
   * 使用装饰器自动追踪视频变化,无需手动触发事件
   */
  @TrackVideoChanges()
  private async saveStandardizedVideos(
    standardizedVideos: any[],
    accountId: number
  ): Promise<{
    newCount: number
    updatedCount: number
    videoUpdates: Array<{
      videoId: number
      oldData: {
        viewCount: number
        likeCount: number
        commentCount: number
        shareCount: number
      }
      newData: {
        viewCount: number
        likeCount: number
        commentCount: number
        shareCount: number
      }
    }>
  }> {
    let newCount = 0
    let updatedCount = 0
    const videoUpdates: Array<{
      videoId: number
      oldData: any
      newData: any
    }> = []

    for (const standardizedVideo of standardizedVideos) {
      // 使用DataMapper将标准化视频数据转换为数据库格式
      const videoDbMapping = dataMapper.mapVideoToDatabase(standardizedVideo, accountId)

      // 检查视频是否已存在
      const existingVideo = await db
        .select()
        .from(videos)
        .where(eq(videos.platformVideoId, videoDbMapping.platformVideoId))
        .limit(1)

      if (existingVideo.length > 0) {
        // 保存旧数据用于decorator
        const oldVideo = existingVideo[0]

        // 更新现有视频
        await db
          .update(videos)
          .set({
            title: videoDbMapping.title,
            description: videoDbMapping.description,
            videoUrl: videoDbMapping.videoUrl,
            pageUrl: videoDbMapping.pageUrl,
            thumbnailUrl: videoDbMapping.thumbnailUrl,
            duration: videoDbMapping.duration,
            tags: videoDbMapping.tags,
            viewCount: videoDbMapping.viewCount,
            likeCount: videoDbMapping.likeCount,
            commentCount: videoDbMapping.commentCount,
            shareCount: videoDbMapping.shareCount,
            saveCount: videoDbMapping.saveCount,
            lastUpdatedAt: new Date(),
            metadata: videoDbMapping.metadata // 存储原始视频数据
          })
          .where(eq(videos.id, existingVideo[0].id))

        // 收集变更信息供decorator使用
        videoUpdates.push({
          videoId: oldVideo.id,
          oldData: {
            viewCount: Number(oldVideo.viewCount),
            likeCount: Number(oldVideo.likeCount),
            commentCount: Number(oldVideo.commentCount),
            shareCount: Number(oldVideo.shareCount)
          },
          newData: {
            viewCount: Number(videoDbMapping.viewCount),
            likeCount: Number(videoDbMapping.likeCount),
            commentCount: Number(videoDbMapping.commentCount),
            shareCount: Number(videoDbMapping.shareCount)
          }
        })

        updatedCount++
      } else {
        // 创建新视频
        const newVideo: NewVideo = {
          accountId: videoDbMapping.accountId,
          platformVideoId: videoDbMapping.platformVideoId,
          title: videoDbMapping.title,
          description: videoDbMapping.description,
          videoUrl: videoDbMapping.videoUrl,
          pageUrl: videoDbMapping.pageUrl,
          thumbnailUrl: videoDbMapping.thumbnailUrl,
          duration: videoDbMapping.duration,
          publishedAt: videoDbMapping.publishedAt,
          tags: videoDbMapping.tags,
          viewCount: videoDbMapping.viewCount,
          likeCount: videoDbMapping.likeCount,
          commentCount: videoDbMapping.commentCount,
          shareCount: videoDbMapping.shareCount,
          saveCount: videoDbMapping.saveCount,
          firstScrapedAt: videoDbMapping.firstScrapedAt || new Date(),
          lastUpdatedAt: videoDbMapping.lastUpdatedAt || new Date(),
          metadata: videoDbMapping.metadata // 存储原始视频数据
        }

        await db.insert(videos).values(newVideo)
        newCount++
      }
    }

    return { newCount, updatedCount, videoUpdates }
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

    // videoUrl: CDN文件地址或播放地址
    const videoUrl = video.play_addr?.url_list?.[0] || ''
    // pageUrl: 视频页面URL（用于用户访问）
    const pageUrl = videoRawData.url || ''

    // 提取JPEG格式的封面URL
    let thumbnailUrl = ''
    const coverUrlList = video.cover?.url_list || video.dynamic_cover?.url_list || []

    if (coverUrlList.length > 0) {
      // 遍历所有URL，优先选择JPEG格式
      const jpegUrl = coverUrlList.find((url: string) =>
        url.toLowerCase().includes('.jpeg') || url.toLowerCase().includes('.jpg')
      )

      if (jpegUrl) {
        // 找到了JPEG格式的URL
        thumbnailUrl = jpegUrl
      } else if (coverUrlList.length >= 3) {
        // 没有明确的JPEG URL，使用第3个URL（通常是JPEG）
        thumbnailUrl = coverUrlList[2]
      } else {
        // 使用第一个URL，并尝试转换为JPEG格式
        thumbnailUrl = coverUrlList[0].replace(/\.heic(\?|$)/gi, '.jpeg$1')
      }
    }

    // 如果还是没有封面，尝试从其他字段获取
    if (!thumbnailUrl && video.origin_cover?.url_list?.length > 0) {
      const originCoverList = video.origin_cover.url_list
      thumbnailUrl = originCoverList[originCoverList.length - 1] || originCoverList[0]
      thumbnailUrl = thumbnailUrl.replace(/\.heic(\?|$)/gi, '.jpeg$1')
    }

    // 从标题中提取hashtag标签
    const tags = this.extractHashtags(title)

    return {
      videoId: videoRawData.aweme_id || '',
      title,
      description,
      videoUrl: videoUrl.substring(0, 500),
      pageUrl, // TikTok视频页面URL
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

      // YouTube URL格式支持
      // @username: https://www.youtube.com/@username
      const youtubeMatch = url.match(/youtube\.com\/@([^\/\?]+)/)
      if (youtubeMatch) {
        return {
          platform: 'youtube',
          identifier: youtubeMatch[1],
          type: 'profile',
          isValid: true
        }
      }

      // Channel ID: https://www.youtube.com/channel/UCxxxxxxxxxxxx
      const youtubeChannelMatch = url.match(/youtube\.com\/channel\/([\w-]+)/)
      if (youtubeChannelMatch) {
        return {
          platform: 'youtube',
          identifier: youtubeChannelMatch[1],
          type: 'profile',
          isValid: true
        }
      }

      // Custom URL: https://www.youtube.com/c/customname
      const youtubeCustomMatch = url.match(/youtube\.com\/c\/([\w.-]+)/)
      if (youtubeCustomMatch) {
        return {
          platform: 'youtube',
          identifier: youtubeCustomMatch[1],
          type: 'profile',
          isValid: true
        }
      }

      // Video URLs (will be handled by adapter): shorts, watch, youtu.be
      const youtubeVideoMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/)
      if (youtubeVideoMatch) {
        return {
          platform: 'youtube',
          identifier: youtubeVideoMatch[1],
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
   * 使用装饰器自动追踪视频变化,无需手动触发事件
   */
  @TrackVideoChanges()
  async updateVideoByUrl(videoUrl: string): Promise<{
    videoId: number
    updated: boolean
    message: string
    videoUpdates?: Array<{
      videoId: number
      oldData: {
        viewCount: number
        likeCount: number
        commentCount: number
        shareCount: number
      }
      newData: {
        viewCount: number
        likeCount: number
        commentCount: number
        shareCount: number
      }
    }>
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
          pageUrl: videoData.pageUrl,
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

      // 返回变更信息供decorator使用
      return {
        videoId: video.id,
        updated: true,
        message: '视频数据更新成功',
        videoUpdates: [{
          videoId: video.id,
          oldData: {
            viewCount: Number(video.viewCount),
            likeCount: Number(video.likeCount),
            commentCount: Number(video.commentCount),
            shareCount: Number(video.shareCount)
          },
          newData: {
            viewCount: videoData.viewCount,
            likeCount: videoData.likeCount,
            commentCount: videoData.commentCount,
            shareCount: videoData.shareCount
          }
        }]
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

  /**
   * 规范化抓取视频数量，避免异常值
   */
  private normalizeVideoLimit(limit?: number): { limit: number } {
    const DEFAULT_LIMIT = Number(process.env.DEFAULT_SCRAPE_VIDEO_LIMIT || 100)
    const MAX_LIMIT = Number(process.env.MAX_SCRAPE_VIDEO_LIMIT || 1000)

    if (limit === undefined || limit === null) {
      return { limit: DEFAULT_LIMIT }
    }

    if (typeof limit !== 'number' || Number.isNaN(limit)) {
      return { limit: DEFAULT_LIMIT }
    }

    const normalized = Math.floor(limit)
    if (normalized <= 0) {
      return { limit: DEFAULT_LIMIT }
    }

    return { limit: Math.min(normalized, MAX_LIMIT) }
  }

}

// 导出单例
export const scraperManager = new ScraperManager()
