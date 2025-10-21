/**
 * 转换器模块导出
 *
 * 提供转换器工厂函数和所有转换器实例
 */

import type { IPlatformTransformer } from '../../../types/standardized'
import type { PlatformType } from '../../../types'
import { TikTokTransformer } from './tiktok.transformer'
import { YouTubeTransformer } from './youtube.transformer'
import { InstagramTransformer } from './instagram.transformer'

// 导出所有转换器类
export { BaseTransformer } from './base.transformer'
export { TikTokTransformer } from './tiktok.transformer'
export { YouTubeTransformer } from './youtube.transformer'
export { InstagramTransformer } from './instagram.transformer'
export { DataMapper, dataMapper } from './data.mapper'

/**
 * 转换器工厂函数
 *
 * 根据平台类型返回对应的转换器实例
 *
 * @param platform 平台类型
 * @returns 平台转换器实例
 * @throws Error 如果平台未实现转换器
 */
export function getPlatformTransformer(platform: PlatformType): IPlatformTransformer {
  switch (platform) {
    case 'tiktok':
      return new TikTokTransformer()

    case 'youtube':
      return new YouTubeTransformer()

    case 'instagram':
      return new InstagramTransformer()

    case 'facebook':
      throw new Error('Facebook transformer not implemented yet')

    case 'xiaohongshu':
      throw new Error('小红书 transformer not implemented yet')

    case 'douyin':
      throw new Error('抖音 transformer not implemented yet')

    default:
      // TypeScript会确保这里永远不会被执行
      const _exhaustive: never = platform
      throw new Error(`Unsupported platform: ${_exhaustive}`)
  }
}

/**
 * 获取已实现的转换器平台列表
 */
export function getImplementedTransformers(): PlatformType[] {
  return ['tiktok', 'youtube', 'instagram']
}

/**
 * 检查平台是否已实现转换器
 */
export function hasTransformer(platform: PlatformType): boolean {
  return getImplementedTransformers().includes(platform)
}

/**
 * 转换器缓存
 * 避免重复创建相同的转换器实例
 */
class TransformerCache {
  private cache: Map<PlatformType, IPlatformTransformer> = new Map()

  get(platform: PlatformType): IPlatformTransformer {
    if (!this.cache.has(platform)) {
      this.cache.set(platform, getPlatformTransformer(platform))
    }
    return this.cache.get(platform)!
  }

  clear(): void {
    this.cache.clear()
  }
}

/**
 * 全局转换器缓存实例
 */
export const transformerCache = new TransformerCache()

/**
 * 获取缓存的转换器实例
 *
 * 推荐使用此函数而非直接调用 getPlatformTransformer,
 * 可以避免重复创建转换器实例
 */
export function getTransformer(platform: PlatformType): IPlatformTransformer {
  return transformerCache.get(platform)
}
