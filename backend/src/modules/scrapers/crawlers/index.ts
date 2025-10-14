/**
 * 平台爬虫模块导出
 */

import { ICrawler } from './ICrawler'
import { TikTokAdapter } from './TikTok'
export { BaseCrawler, type ICrawler } from './ICrawler'

/**
 * 获取平台爬虫实例
 * 支持 types/index.ts 中定义的所有平台类型
 */
export function getPlatformCrawler(platform: 'tiktok' | 'instagram' | 'youtube' | 'facebook' | 'xiaohongshu' | 'douyin'): ICrawler {
  switch (platform) {
    case 'tiktok':
      return new TikTokAdapter()
    case 'instagram':
      throw new Error('Instagram crawler not implemented yet')
    case 'youtube':
      throw new Error('YouTube crawler not implemented yet')
    case 'facebook':
      throw new Error('Facebook crawler not implemented yet')
    case 'xiaohongshu':
      throw new Error('小红书 crawler not implemented yet')
    case 'douyin':
      throw new Error('抖音 crawler not implemented yet')
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

/**
 */
export function getImplementedPlatforms(): string[] {
  return ['tiktok']
}

/**
 * 检查平台是否已实现
 */
export function isPlatformImplemented(platform: string): boolean {
  return getImplementedPlatforms().includes(platform)
}

/**
 * 获取所有支持的平台列表（包括未实现的）
 */
export function getAllSupportedPlatforms(): string[] {
  return ['tiktok', 'instagram', 'youtube', 'facebook', 'xiaohongshu', 'douyin']
}