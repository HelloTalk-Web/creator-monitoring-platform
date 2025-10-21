/**
 * 转换器基类
 *
 * 提供所有平台转换器的通用功能和工具方法
 */

import type { StandardizedProfile, StandardizedVideo, IPlatformTransformer } from '../../../types/standardized'
import type { PlatformType } from '../../../types'

/**
 * 抽象基础转换器
 *
 * 所有平台转换器都应该继承此类
 */
export abstract class BaseTransformer<TRawProfile = any, TRawVideo = any>
  implements IPlatformTransformer<TRawProfile, TRawVideo> {

  abstract readonly platformType: PlatformType

  /**
   * 将平台原始用户数据转换为标准格式
   */
  abstract transformProfile(rawData: TRawProfile): StandardizedProfile

  /**
   * 将平台原始视频数据转换为标准格式
   */
  abstract transformVideo(rawData: TRawVideo): StandardizedVideo

  /**
   * 工具方法: 安全地提取字符串值
   */
  protected safeString(value: any, defaultValue: string = ''): string {
    if (value === null || value === undefined) {
      return defaultValue
    }
    return String(value).trim()
  }

  /**
   * 工具方法: 安全地提取数字值
   */
  protected safeNumber(value: any, defaultValue: number = 0): number {
    if (value === null || value === undefined) {
      return defaultValue
    }
    const num = Number(value)
    return isNaN(num) ? defaultValue : num
  }

  /**
   * 工具方法: 安全地提取BigInt值
   * 用于统计数据(粉丝数、播放量等)
   */
  protected safeBigInt(value: any, defaultValue: bigint = 0n): bigint {
    if (value === null || value === undefined) {
      return defaultValue
    }
    try {
      // 如果已经是bigint,直接返回
      if (typeof value === 'bigint') {
        return value
      }
      // 如果是字符串或数字,转换为bigint
      return BigInt(Math.floor(Number(value)))
    } catch {
      return defaultValue
    }
  }

  /**
   * 工具方法: 安全地提取布尔值
   */
  protected safeBoolean(value: any, defaultValue: boolean = false): boolean {
    if (value === null || value === undefined) {
      return defaultValue
    }
    if (typeof value === 'boolean') {
      return value
    }
    return Boolean(value)
  }

  /**
   * 工具方法: 安全地提取Date对象
   */
  protected safeDate(value: any): Date {
    if (value instanceof Date) {
      return value
    }
    if (typeof value === 'number') {
      // Unix timestamp (秒或毫秒)
      const timestamp = value > 10000000000 ? value : value * 1000
      return new Date(timestamp)
    }
    if (typeof value === 'string') {
      const date = new Date(value)
      return isNaN(date.getTime()) ? new Date() : date
    }
    return new Date()
  }

  /**
   * 工具方法: 限制字符串长度
   */
  protected truncateString(value: string, maxLength: number): string {
    if (!value) return ''
    return value.length > maxLength ? value.substring(0, maxLength) : value
  }

  /**
   * 工具方法: 从文本中提取hashtag标签
   */
  protected extractHashtags(text: string): string[] {
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
   * 工具方法: 从数组中选择第一个有效的URL
   */
  protected selectFirstValidUrl(urls: (string | null | undefined)[]): string {
    for (const url of urls) {
      if (url && url.trim().length > 0) {
        return url.trim()
      }
    }
    return ''
  }

  /**
   * 工具方法: 确保URL是HTTPS
   */
  protected ensureHttps(url: string): string {
    if (!url) return ''
    if (url.startsWith('http://')) {
      return url.replace('http://', 'https://')
    }
    if (!url.startsWith('https://')) {
      return `https://${url}`
    }
    return url
  }

  /**
   * 工具方法: 验证转换后的Profile数据
   */
  protected validateProfile(profile: StandardizedProfile): void {
    const errors: string[] = []

    if (!profile.platformUserId) errors.push('platformUserId不能为空')
    if (!profile.username) errors.push('username不能为空')
    if (!profile.displayName) errors.push('displayName不能为空')
    if (!profile.profileUrl) errors.push('profileUrl不能为空')
    if (profile.followerCount < 0) errors.push('followerCount不能为负数')
    if (profile.followingCount < 0) errors.push('followingCount不能为负数')
    if (profile.totalVideos < 0) errors.push('totalVideos不能为负数')

    if (errors.length > 0) {
      throw new Error(`Profile数据验证失败:\n${errors.join('\n')}`)
    }
  }

  /**
   * 工具方法: 验证转换后的Video数据
   */
  protected validateVideo(video: StandardizedVideo): void {
    const errors: string[] = []
    const warnings: string[] = []

    // 必需字段 - 这些字段必须存在
    if (!video.platformVideoId) errors.push('platformVideoId不能为空')
    if (!video.pageUrl) errors.push('pageUrl不能为空')
    if (!video.publishedAt || !(video.publishedAt instanceof Date)) {
      errors.push('publishedAt必须是有效的Date对象')
    }

    // 可选字段 - 如果为空则设置默认值，不报错
    if (!video.title) {
      video.title = '无标题'
      warnings.push('标题为空，已设置为默认值')
    }

    if (!video.videoUrl) {
      video.videoUrl = ''
      warnings.push('视频URL为空，已设置为空字符串')
    }

    if (!video.thumbnailUrl) {
      video.thumbnailUrl = ''
      warnings.push('缩略图URL为空，已设置为空字符串')
    }

    // 检查字段长度限制
    const MAX_URL_LENGTH = Number(process.env.MAX_VIDEO_URL_LENGTH || 2048)
    if (video.title.length > 500) {
      errors.push(`title超过最大长度500字符 (当前: ${video.title.length})`)
    }
    if (video.videoUrl.length > MAX_URL_LENGTH) {
      errors.push(`videoUrl超过最大长度${MAX_URL_LENGTH}字符 (当前: ${video.videoUrl.length})`)
    }
    if (video.thumbnailUrl.length > MAX_URL_LENGTH) {
      errors.push(`thumbnailUrl超过最大长度${MAX_URL_LENGTH}字符 (当前: ${video.thumbnailUrl.length})`)
    }

    // 记录警告信息到日志
    if (warnings.length > 0) {
      console.warn(`Video数据验证警告 (${video.platformVideoId}):\n${warnings.join('\n')}`)
    }

    // 只有真正的错误才抛出异常
    if (errors.length > 0) {
      throw new Error(`Video数据验证失败:\n${errors.join('\n')}`)
    }
  }
}
