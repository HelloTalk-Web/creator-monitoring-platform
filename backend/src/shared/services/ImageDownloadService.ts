import path from 'path'
import axios from 'axios'
import crypto from 'crypto'
import { openlistClient } from '../../modules/openlist'
import type { OpenListError, UploadResult } from '../../modules/openlist/types'
import { logger } from '../utils/logger'

/**
 * 图片下载服务
 * 负责从各个平台下载图片并上传到OpenList存储
 */
export class ImageDownloadService {
  private readonly avatarRemotePrefix = '/images/avatars'
  private readonly thumbnailRemotePrefix = '/images/thumbnails'

  /**
   * 获取平台特定的请求头
   */
  private getPlatformHeaders(url: string): Record<string, string> {
    try {
      const urlObj = new URL(url)

      // TikTok特定的请求头
      if (urlObj.hostname.includes('tiktokcdn.com')) {
        return {
          'Referer': 'https://www.tiktok.com/',
          'Origin': 'https://www.tiktok.com',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      }

      // Instagram特定的请求头
      if (
        urlObj.hostname.includes('instagram.com') ||
        urlObj.hostname.includes('cdninstagram.com') ||
        urlObj.hostname.includes('scontent.cdninstagram.com')
      ) {
        return {
          'Referer': 'https://www.instagram.com/',
          'Origin': 'https://www.instagram.com',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      }
    } catch (error) {
      logger.warn(`无法解析URL: ${url}`)
    }

    // 默认请求头
    return {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  }

  /**
   * 生成本地文件名
   */
  private generateFileName(url: string, entityKey: number | string, prefix: string): string {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      let ext = path.extname(pathname).split('?')[0].toLowerCase() || '.jpg'

      if (!ext || ext === '.') {
        ext = '.jpg'
      }

      const uniqueKey = this.getUniqueKey(url, entityKey)
      return `${prefix}_${uniqueKey}${ext}`
    } catch (error) {
      logger.warn(`无法从URL提取扩展名: ${url}, 使用默认.jpg`)
      const uniqueKey = this.getUniqueKey(url, entityKey)
      return `${prefix}_${uniqueKey}.jpg`
    }
  }

  private getUniqueKey(url: string, entityKey: number | string): string {
    if (typeof entityKey === 'number' && Number.isFinite(entityKey) && entityKey > 0) {
      return String(entityKey)
    }

    if (typeof entityKey === 'string' && entityKey.trim().length > 0) {
      return crypto.createHash('md5').update(entityKey).digest('hex').slice(0, 16)
    }

    return crypto.createHash('md5').update(url).digest('hex').slice(0, 16)
  }

  private buildRemotePath(prefix: string, fileName: string): string {
    const normalizedPrefix = prefix.endsWith('/')
      ? prefix.slice(0, -1)
      : prefix

    const withLeadingSlash = normalizedPrefix.startsWith('/')
      ? normalizedPrefix
      : `/${normalizedPrefix}`

    return `${withLeadingSlash}/${fileName}`.replace(/\/\/+/g, '/')
  }

  private async uploadToOpenList(
    fileBuffer: Buffer,
    remotePath: string,
    context: { entityId: number | string; type: 'avatar' | 'thumbnail' }
  ): Promise<UploadResult | null> {
    try {
      const result = await openlistClient.upload(fileBuffer, remotePath)
      logger.info(`✓ OpenList上传成功 [${context.type} ${context.entityId}]: ${remotePath}`)
      return result
    } catch (error) {
      const openListError = this.toOpenListError(error)
      logger.error(`OpenList上传失败 [${context.type} ${context.entityId}]`, {
        path: remotePath,
        status: openListError.status,
        code: openListError.code,
        message: openListError.message
      })
      return null
    }
  }

  private toOpenListError(error: unknown): OpenListError {
    if (error && typeof error === 'object' && 'message' in error) {
      return error as OpenListError
    }

    const fallback = new Error(String(error ?? 'Unknown OpenList error')) as OpenListError
    fallback.code = (error as OpenListError)?.code
    fallback.status = (error as OpenListError)?.status
    fallback.details = (error as OpenListError)?.details
    return fallback
  }

  /**
   * 下载图片
   */
  private async downloadImageData(
    url: string,
    maxRetries: number = 3
  ): Promise<Buffer | null> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`尝试下载图片 [${attempt}/${maxRetries}]: ${url}`)

        const headers = this.getPlatformHeaders(url)

        const response = await axios.get(url, {
          headers,
          responseType: 'arraybuffer',
          timeout: 20000,
          maxRedirects: 5
        })

        logger.info(`✅ 下载成功: ${url}`)
        return response.data as Buffer
      } catch (error) {
        lastError = error as Error
        logger.warn(`❌ 尝试 ${attempt} 失败: ${(error as Error).message}`)

        // 如果不是最后一次尝试，等待后重试
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    logger.error(`无法下载图片 (全部重试失败): ${url}`, { error: lastError?.message })
    return null
  }

  /**
   * 下载账号头像
   * @param url 头像URL
   * @param accountId 账号ID
   * @returns 本地路径或null
   */
  async downloadAvatar(url: string, accountKey: number | string): Promise<UploadResult | null> {
    if (!url) {
      logger.warn(`账号 ${accountKey} 没有头像URL`)
      return null
    }

    const fileName = this.generateFileName(url, accountKey, 'avatar')
    const remotePath = this.buildRemotePath(this.avatarRemotePrefix, fileName)

    const imageData = await this.downloadImageData(url)
    if (!imageData) {
      return null
    }

    return this.uploadToOpenList(imageData, remotePath, {
      entityId: accountKey,
      type: 'avatar'
    })
  }

  /**
   * 下载视频缩略图
   * @param url 缩略图URL
   * @param videoId 视频ID
   * @returns 本地路径或null
   */
  async downloadThumbnail(url: string, videoKey: number | string): Promise<UploadResult | null> {
    if (!url) {
      logger.warn(`视频 ${videoKey} 没有缩略图URL`)
      return null
    }

    const fileName = this.generateFileName(url, videoKey, 'thumbnail')
    const remotePath = this.buildRemotePath(this.thumbnailRemotePrefix, fileName)

    const imageData = await this.downloadImageData(url)
    if (!imageData) {
      return null
    }

    return this.uploadToOpenList(imageData, remotePath, {
      entityId: videoKey,
      type: 'thumbnail'
    })
  }

}

// 导出单例
export const imageDownloadService = new ImageDownloadService()
