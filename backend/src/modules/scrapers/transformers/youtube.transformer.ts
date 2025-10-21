/**
 * YouTube 数据转换器
 *
 * 将 YouTube Data API v3 原始数据转换为标准化格式
 */

import { BaseTransformer } from './base.transformer'
import type { StandardizedProfile, StandardizedVideo } from '../../../types/standardized'

/**
 * YouTube Channel 原始数据类型
 * 基于 YouTube Data API v3 响应格式
 */
export interface YouTubeRawChannel {
  id: string
  snippet: {
    title: string
    description: string
    customUrl?: string
    publishedAt: string
    thumbnails: {
      default?: { url: string }
      medium?: { url: string }
      high?: { url: string }
    }
  }
  statistics: {
    viewCount: string
    subscriberCount: string
    hiddenSubscriberCount: boolean
    videoCount: string
  }
  contentDetails?: {
    relatedPlaylists?: {
      uploads: string
    }
  }
  [key: string]: any
}

/**
 * YouTube Video 原始数据类型
 * 基于 YouTube Data API v3 响应格式
 */
export interface YouTubeRawVideo {
  id: string
  snippet: {
    publishedAt: string
    channelId: string
    title: string
    description: string
    thumbnails: {
      default?: { url: string }
      medium?: { url: string }
      high?: { url: string }
      maxres?: { url: string }
    }
    channelTitle: string
  }
  statistics: {
    viewCount: string
    likeCount: string
    commentCount: string
  }
  contentDetails: {
    duration: string  // ISO 8601 格式 (PT1M30S)
    dimension: string
    definition: string
  }
  [key: string]: any
}

/**
 * YouTube 转换器
 */
export class YouTubeTransformer extends BaseTransformer<YouTubeRawChannel, YouTubeRawVideo> {
  readonly platformType = 'youtube' as const

  /**
   * 转换 YouTube 频道数据
   */
  transformProfile(rawData: YouTubeRawChannel): StandardizedProfile {
    const { id, snippet, statistics } = rawData

    // 处理customUrl (移除@符号)
    let username = snippet.customUrl || id
    if (username.startsWith('@')) {
      username = username.substring(1)
    }

    // 选择最佳头像URL
    const avatarUrl = this.selectFirstValidUrl([
      snippet.thumbnails.high?.url,
      snippet.thumbnails.medium?.url,
      snippet.thumbnails.default?.url
    ])

    const profile: StandardizedProfile = {
      platform: this.platformType,
      platformUserId: this.safeString(id),
      username: this.safeString(username),
      displayName: this.safeString(snippet.title),
      profileUrl: this.generateProfileUrl(snippet.customUrl || id),
      avatarUrl: avatarUrl || null,
      bio: this.safeString(snippet.description) || null,
      followerCount: this.safeBigInt(statistics.subscriberCount),
      followingCount: 0n, // YouTube没有关注数概念
      totalVideos: this.safeNumber(statistics.videoCount, 0),
      isVerified: false, // YouTube API不直接提供此信息
      rawData: rawData
    }

    // 验证数据完整性
    this.validateProfile(profile)

    return profile
  }

  /**
   * 转换 YouTube 视频数据
   */
  transformVideo(rawData: YouTubeRawVideo): StandardizedVideo {
    const { id, snippet, statistics, contentDetails } = rawData

    // 解析视频时长
    const duration = this.parseDuration(contentDetails.duration)

    // 提取标题和描述
    const title = this.truncateString(this.safeString(snippet.title), 500)
    const description = this.safeString(snippet.description)

    // 选择最佳缩略图
    const thumbnailUrl = this.selectFirstValidUrl([
      snippet.thumbnails.maxres?.url,
      snippet.thumbnails.high?.url,
      snippet.thumbnails.medium?.url,
      snippet.thumbnails.default?.url
    ])

    // 生成视频URL
    const videoUrl = this.generateVideoUrl(id)
    const pageUrl = this.generateVideoUrl(id)

    // 提取标签
    const tags = this.extractHashtags(title + ' ' + description)

    const standardizedVideo: StandardizedVideo = {
      platform: this.platformType,
      platformVideoId: this.safeString(id),
      title: title,
      description: description || null,
      publishedAt: this.safeDate(snippet.publishedAt),
      videoUrl: this.safeString(videoUrl),
      pageUrl: pageUrl,
      thumbnailUrl: this.safeString(thumbnailUrl),
      viewCount: this.safeBigInt(statistics.viewCount),
      likeCount: this.safeBigInt(statistics.likeCount),
      commentCount: this.safeBigInt(statistics.commentCount),
      shareCount: 0n, // YouTube API不提供分享数
      saveCount: 0n,  // YouTube API不提供收藏数
      duration: duration,
      tags: tags,
      rawData: rawData
    }

    // 验证数据完整性
    this.validateVideo(standardizedVideo)

    return standardizedVideo
  }

  /**
   * 生成YouTube频道URL
   */
  private generateProfileUrl(identifier: string): string {
    if (identifier.startsWith('@')) {
      return `https://www.youtube.com/${identifier}`
    }
    if (identifier.startsWith('UC')) {
      // Channel ID 格式
      return `https://www.youtube.com/channel/${identifier}`
    }
    return `https://www.youtube.com/@${identifier}`
  }

  /**
   * 生成YouTube视频URL
   */
  private generateVideoUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`
  }

  /**
   * 解析 ISO 8601 duration 格式
   * 例如: PT1M30S → 90秒, PT1H2M3S → 3723秒
   */
  private parseDuration(isoDuration: string): number | null {
    if (!isoDuration) return null

    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return null

    const hours = parseInt(match[1] || '0')
    const minutes = parseInt(match[2] || '0')
    const seconds = parseInt(match[3] || '0')

    return hours * 3600 + minutes * 60 + seconds
  }
}
