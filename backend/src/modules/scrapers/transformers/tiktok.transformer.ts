/**
 * TikTok 数据转换器
 *
 * 将 TikTok API 原始数据转换为标准化格式
 */

import { BaseTransformer } from './base.transformer'
import type { StandardizedProfile, StandardizedVideo } from '../../../types/standardized'
import type { ScrapeCreatorsProfileResponse } from '../../../types'

/**
 * TikTok Profile 原始数据类型
 * 基于 ScrapeCreators API v1 响应格式
 */
export interface TikTokRawProfile {
  user: {
    id: string
    shortId?: string
    uniqueId: string
    nickname: string
    avatarLarger?: string
    avatarMedium?: string
    avatarThumb?: string
    signature?: string
    verified: boolean
    [key: string]: any
  }
  stats: {
    followerCount: number
    followingCount: number
    videoCount: number
    [key: string]: any
  }
  [key: string]: any
}

/**
 * TikTok Video 原始数据类型
 * 基于 ScrapeCreators API 响应格式
 */
export interface TikTokRawVideo {
  aweme_id: string
  desc: string
  create_time: number
  url?: string
  video?: {
    duration?: number
    cover?: {
      url_list?: string[]
    }
    dynamic_cover?: {
      url_list?: string[]
    }
    origin_cover?: {
      url_list?: string[]
    }
    play_addr?: {
      url_list?: string[]
    }
  }
  statistics?: {
    play_count?: number
    digg_count?: number
    comment_count?: number
    share_count?: number
    collect_count?: number
  }
  [key: string]: any
}

/**
 * TikTok 转换器
 */
export class TikTokTransformer extends BaseTransformer<TikTokRawProfile, TikTokRawVideo> {
  readonly platformType = 'tiktok' as const

  /**
   * 转换 TikTok 用户资料数据
   */
  transformProfile(rawData: TikTokRawProfile): StandardizedProfile {
    const { user, stats } = rawData

    // 选择最佳头像URL (优先使用高清)
    const avatarUrl = this.selectFirstValidUrl([
      user.avatarLarger,
      user.avatarMedium,
      user.avatarThumb
    ])

    const profile: StandardizedProfile = {
      platform: this.platformType,
      platformUserId: this.safeString(user.id || user.uniqueId),
      username: this.safeString(user.uniqueId),
      displayName: this.safeString(user.nickname),
      profileUrl: this.generateProfileUrl(user.uniqueId),
      avatarUrl: avatarUrl || null,
      bio: this.safeString(user.signature) || null,
      followerCount: this.safeBigInt(stats.followerCount),
      followingCount: this.safeBigInt(stats.followingCount),
      totalVideos: this.safeNumber(stats.videoCount, 0),
      isVerified: this.safeBoolean(user.verified, false),
      rawData: rawData
    }

    // 验证数据完整性
    this.validateProfile(profile)

    return profile
  }

  /**
   * 转换 TikTok 视频数据
   */
  transformVideo(rawData: TikTokRawVideo): StandardizedVideo {
    const video = rawData.video || {}
    const stats = rawData.statistics || {}

    // 提取视频标题和描述
    const title = this.truncateString(this.safeString(rawData.desc), 500)
    const description = this.safeString(rawData.desc)

    // 提取缩略图URL
    const thumbnailUrl = this.selectThumbnailUrl(video)

    // 提取视频播放URL
    const videoUrl = this.selectFirstValidUrl(
      video.play_addr?.url_list || []
    )

    // 提取视频页面URL
    const pageUrl = this.safeString(rawData.url)

    // 提取标签
    const tags = this.extractHashtags(title)

    // 转换时长 (从毫秒转为秒)
    const duration = video.duration
      ? Math.round(this.safeNumber(video.duration) / 1000)
      : null

    const standardizedVideo: StandardizedVideo = {
      platform: this.platformType,
      platformVideoId: this.safeString(rawData.aweme_id),
      title: title,
      description: description || null,
      publishedAt: this.safeDate(rawData.create_time),
      videoUrl: this.safeString(videoUrl),
      pageUrl: pageUrl,
      thumbnailUrl: this.safeString(thumbnailUrl),
      viewCount: this.safeBigInt(stats.play_count),
      likeCount: this.safeBigInt(stats.digg_count),
      commentCount: this.safeBigInt(stats.comment_count),
      shareCount: this.safeBigInt(stats.share_count),
      saveCount: this.safeBigInt(stats.collect_count),
      duration: duration,
      tags: tags,
      rawData: rawData
    }

    // 验证数据完整性
    this.validateVideo(standardizedVideo)

    return standardizedVideo
  }

  /**
   * 生成TikTok个人资料URL
   */
  private generateProfileUrl(uniqueId: string): string {
    return `https://www.tiktok.com/@${uniqueId}`
  }

  /**
   * 选择最佳缩略图URL
   * TikTok提供多个封面选项,优先选择JPEG格式
   */
  private selectThumbnailUrl(video: TikTokRawVideo['video']): string {
    if (!video) return ''

    const coverUrlList = video.cover?.url_list ||
                        video.dynamic_cover?.url_list ||
                        []

    if (coverUrlList.length === 0) {
      // 尝试从origin_cover获取
      const originCoverList = video.origin_cover?.url_list || []
      if (originCoverList.length > 0) {
        const url = originCoverList[originCoverList.length - 1] || originCoverList[0]
        return this.convertToJpeg(url)
      }
      return ''
    }

    // 优先选择JPEG格式的URL
    const jpegUrl = coverUrlList.find((url: string) =>
      url.toLowerCase().includes('.jpeg') || url.toLowerCase().includes('.jpg')
    )

    if (jpegUrl) {
      return jpegUrl
    }

    // 如果有3个或更多URL,选择第3个(通常是JPEG)
    if (coverUrlList.length >= 3) {
      return coverUrlList[2]
    }

    // 使用第一个URL并尝试转换为JPEG
    const firstUrl = coverUrlList[0]
    return this.convertToJpeg(firstUrl)
  }

  /**
   * 将HEIC格式的URL转换为JPEG
   */
  private convertToJpeg(url: string): string {
    if (!url) return ''
    return url.replace(/\.heic(\?|$)/gi, '.jpeg$1')
  }
}
