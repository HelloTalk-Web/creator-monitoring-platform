/**
 * 数据库映射器 (简化版)
 *
 * 职责: 只负责添加ORM相关的元数据(外键、时间戳)
 * Transformer已经输出了数据库兼容的类型(包括BigInt)
 */

import type {
  StandardizedProfile,
  StandardizedVideo
} from '../../../types/standardized'
import type { NewCreatorAccount, NewVideo } from '../../../shared/database/schema'

/**
 * 数据库映射器实现
 */
export class DataMapper {
  /**
   * 将标准化用户资料映射到数据库格式
   *
   * Transformer已经输出了正确的类型(bigint),
   * 这里只需要添加外键和时间戳
   *
   * @param profile 标准化的用户资料(已包含bigint类型)
   * @param additionalData 外键数据 (userId, platformId)
   * @returns 可直接插入数据库的数据对象
   */
  mapProfileToDatabase(
    profile: StandardizedProfile,
    additionalData: { userId: number; platformId: number }
  ): NewCreatorAccount {
    return {
      // 外键字段
      userId: additionalData.userId,
      platformId: additionalData.platformId,

      // StandardizedProfile的所有字段可以直接使用
      // 因为已经是数据库兼容的类型了
      platformUserId: profile.platformUserId,
      username: profile.username,
      displayName: profile.displayName,
      profileUrl: profile.profileUrl,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      followerCount: profile.followerCount,     // 已经是bigint
      followingCount: profile.followingCount,   // 已经是bigint
      totalVideos: profile.totalVideos,
      isVerified: profile.isVerified,
      metadata: profile.rawData as any,

      // 时间戳字段
      lastScrapedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  /**
   * 将标准化视频数据映射到数据库格式
   *
   * Transformer已经输出了正确的类型(bigint),
   * 这里只需要添加外键和时间戳
   *
   * @param video 标准化的视频数据(已包含bigint类型)
   * @param accountId 创作者账号ID
   * @returns 可直接插入数据库的数据对象
   */
  mapVideoToDatabase(
    video: StandardizedVideo,
    accountId: number
  ): NewVideo {
    return {
      // 外键字段
      accountId: accountId,

      // StandardizedVideo的所有字段可以直接使用
      platformVideoId: video.platformVideoId,
      title: video.title,
      description: video.description,
      videoUrl: video.videoUrl,
      pageUrl: video.pageUrl,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      publishedAt: video.publishedAt,
      tags: video.tags as any,
      viewCount: video.viewCount,         // 已经是bigint
      likeCount: video.likeCount,         // 已经是bigint
      commentCount: video.commentCount,   // 已经是bigint
      shareCount: video.shareCount,       // 已经是bigint
      saveCount: video.saveCount,         // 已经是bigint
      metadata: video.rawData as any,

      // 时间戳字段
      firstScrapedAt: new Date(),
      lastUpdatedAt: new Date(),
      dataSource: 'api'
    }
  }

  /**
   * 将标准化用户资料映射为更新数据格式
   *
   * 用于更新现有账号时,不包含createdAt等字段
   */
  mapProfileToUpdateData(profile: StandardizedProfile): Partial<NewCreatorAccount> {
    return {
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      followerCount: BigInt(profile.followerCount),
      followingCount: BigInt(profile.followingCount),
      totalVideos: profile.totalVideos,
      isVerified: profile.isVerified,
      metadata: profile.rawData as any,
      lastScrapedAt: new Date(),
      updatedAt: new Date()
    }
  }

  /**
   * 将标准化视频数据映射为更新数据格式
   *
   * 用于更新现有视频时,不包含firstScrapedAt等字段
   */
  mapVideoToUpdateData(video: StandardizedVideo): Partial<NewVideo> {
    return {
      title: video.title,
      description: video.description,
      videoUrl: video.videoUrl,
      pageUrl: video.pageUrl,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      tags: video.tags as any,
      viewCount: BigInt(video.viewCount),
      likeCount: BigInt(video.likeCount),
      commentCount: BigInt(video.commentCount),
      shareCount: BigInt(video.shareCount),
      saveCount: BigInt(video.saveCount),
      metadata: video.rawData as any,
      lastUpdatedAt: new Date()
    }
  }

  /**
   * 从数据库BigInt转换为标准Number
   *
   * 用于API响应时的数据转换
   */
  bigIntToNumber(value: bigint | null | undefined): number {
    if (value === null || value === undefined) {
      return 0
    }
    return Number(value)
  }

  /**
   * 批量转换视频的BigInt字段为Number
   *
   * 用于API响应时的批量数据转换
   */
  convertVideoBigInts(video: any): any {
    return {
      ...video,
      viewCount: this.bigIntToNumber(video.viewCount),
      likeCount: this.bigIntToNumber(video.likeCount),
      commentCount: this.bigIntToNumber(video.commentCount),
      shareCount: this.bigIntToNumber(video.shareCount),
      saveCount: this.bigIntToNumber(video.saveCount)
    }
  }

  /**
   * 批量转换账号的BigInt字段为Number
   *
   * 用于API响应时的批量数据转换
   */
  convertAccountBigInts(account: any): any {
    return {
      ...account,
      followerCount: this.bigIntToNumber(account.followerCount),
      followingCount: this.bigIntToNumber(account.followingCount)
    }
  }
}

/**
 * 导出单例
 */
export const dataMapper = new DataMapper()
