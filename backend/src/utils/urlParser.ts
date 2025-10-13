import type { ParsedUrl, PlatformType } from '@/types'
import { PLATFORM_CONFIG } from '@/types'

/**
 * URL解析器 - 解析不同平台的URL并提取用户信息
 */
export class UrlParser {
  /**
   * 解析URL并返回平台和用户信息
   */
  parse(url: string): ParsedUrl | null {
    if (!url || typeof url !== 'string') {
      return null
    }

    // 清理URL
    const cleanUrl = this.cleanUrl(url)

    // 遍历所有平台配置
    for (const [platform, config] of Object.entries(PLATFORM_CONFIG)) {
      const result = this.parsePlatform(cleanUrl, platform as PlatformType, config.patterns)
      if (result) {
        return result
      }
    }

    return null
  }

  /**
   * 解析特定平台的URL
   */
  private parsePlatform(
    url: string,
    platform: PlatformType,
    patterns: RegExp[]
  ): ParsedUrl | null {
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        const username = match[1]
        const videoId = match[2] // 如果是视频URL，第二个匹配项是视频ID

        if (!username) {
          continue
        }

        return {
          platform,
          username: this.cleanUsername(username),
          originalUrl: url,
          isValid: true,
          videoId: videoId || undefined
        }
      }
    }

    return null
  }

  /**
   * 清理URL - 移除查询参数和哈希
   */
  private cleanUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`
    } catch {
      return url
    }
  }

  /**
   * 清理用户名 - 移除特殊字符
   */
  private cleanUsername(username: string): string {
    return username
      .trim()
      .replace(/[\/\\?%*:|"<>]/g, '') // 移除不允许的字符
      .replace(/^@/, '') // 移除开头的@符号
  }

  /**
   * 验证URL是否有效
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * 获取平台显示名称
   */
  static getPlatformDisplayName(platform: PlatformType): string {
    return PLATFORM_CONFIG[platform]?.name || platform
  }

  /**
   * 获取平台颜色
   */
  static getPlatformColor(platform: PlatformType): string {
    return PLATFORM_CONFIG[platform]?.color || '#666666'
  }

  /**
   * 构建用户主页URL
   */
  static buildProfileUrl(platform: PlatformType, username: string): string {
    const baseUrl = PLATFORM_CONFIG[platform]?.baseUrl
    if (!baseUrl) {
      throw new Error(`Unsupported platform: ${platform}`)
    }

    switch (platform) {
      case 'tiktok':
        return `${baseUrl}/@${username}`
      case 'instagram':
      case 'facebook':
        return `${baseUrl}/${username}`
      case 'youtube':
        return `${baseUrl}/channel/${username}`
      case 'xiaohongshu':
        return `${baseUrl}/user/profile/${username}`
      case 'douyin':
        return `${baseUrl}/user/${username}`
      default:
        return `${baseUrl}/${username}`
    }
  }

  /**
   * 提取用户名用于显示
   */
  static extractDisplayUsername(parsed: ParsedUrl): string {
    if (!parsed) return ''

    // TikTok用户名通常显示为 @username
    if (parsed.platform === 'tiktok') {
      return `@${parsed.username}`
    }

    return parsed.username
  }
}

/**
 * 创建URL解析器实例
 */
export const urlParser = new UrlParser()

/**
 * 便捷方法：解析URL
 */
export function parseCreatorUrl(url: string): ParsedUrl | null {
  return urlParser.parse(url)
}

/**
 * 便捷方法：验证平台URL
 */
export function isValidPlatformUrl(url: string): boolean {
  return parseCreatorUrl(url) !== null
}