import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { logger } from '../utils/logger'

/**
 * 图片下载服务
 * 负责从各个平台下载图片并保存到本地
 */
export class ImageDownloadService {
  private readonly baseImageDir: string
  private readonly avatarDir: string
  private readonly thumbnailDir: string

  constructor(baseDir: string = './static/images') {
    this.baseImageDir = baseDir
    this.avatarDir = path.join(baseDir, 'avatars')
    this.thumbnailDir = path.join(baseDir, 'thumbnails')

    // 确保目录存在
    this.ensureDirectories()
  }

  /**
   * 确保目录存在
   */
  private ensureDirectories(): void {
    [this.baseImageDir, this.avatarDir, this.thumbnailDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    })
  }

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
  private generateFileName(url: string, entityId: number, prefix: string): string {
    try {
      // 从URL中提取文件扩展名
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      let ext = path.extname(pathname).split('?')[0].toLowerCase() || '.jpg'

      // 如果没有有效的扩展名，使用jpg
      if (!ext || ext === '.') {
        ext = '.jpg'
      }

      return `${prefix}_${entityId}${ext}`
    } catch (error) {
      logger.warn(`无法从URL提取扩展名: ${url}, 使用默认.jpg`)
      return `${prefix}_${entityId}.jpg`
    }
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
  async downloadAvatar(url: string, accountId: number): Promise<string | null> {
    if (!url) {
      logger.warn(`账号 ${accountId} 没有头像URL`)
      return null
    }

    const fileName = this.generateFileName(url, accountId, 'avatar')
    const localPath = path.join(this.avatarDir, fileName)

    // 如果文件已存在，直接返回
    if (fs.existsSync(localPath)) {
      logger.info(`✓ 头像已存在 [账号 ${accountId}]: ${fileName}`)
      return `/static/images/avatars/${fileName}`
    }

    const imageData = await this.downloadImageData(url)
    if (!imageData) {
      return null
    }

    try {
      fs.writeFileSync(localPath, imageData)
      logger.info(`✓ 头像已保存 [账号 ${accountId}]: ${fileName}`)
      return `/static/images/avatars/${fileName}`
    } catch (error) {
      logger.error(`保存头像失败 [账号 ${accountId}]`, { error: (error as Error).message })
      return null
    }
  }

  /**
   * 下载视频缩略图
   * @param url 缩略图URL
   * @param videoId 视频ID
   * @returns 本地路径或null
   */
  async downloadThumbnail(url: string, videoId: number): Promise<string | null> {
    if (!url) {
      logger.warn(`视频 ${videoId} 没有缩略图URL`)
      return null
    }

    const fileName = this.generateFileName(url, videoId, 'thumbnail')
    const localPath = path.join(this.thumbnailDir, fileName)

    // 如果文件已存在，直接返回
    if (fs.existsSync(localPath)) {
      logger.info(`✓ 缩略图已存在 [视频 ${videoId}]: ${fileName}`)
      return `/static/images/thumbnails/${fileName}`
    }

    const imageData = await this.downloadImageData(url)
    if (!imageData) {
      return null
    }

    try {
      fs.writeFileSync(localPath, imageData)
      logger.info(`✓ 缩略图已保存 [视频 ${videoId}]: ${fileName}`)
      return `/static/images/thumbnails/${fileName}`
    } catch (error) {
      logger.error(`保存缩略图失败 [视频 ${videoId}]`, { error: (error as Error).message })
      return null
    }
  }

  /**
   * 删除本地文件
   */
  deleteFile(localPath: string): boolean {
    try {
      const fullPath = path.join(this.baseImageDir, localPath.replace(/^\/static\/images\//, ''))
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
        logger.info(`✓ 文件已删除: ${localPath}`)
        return true
      }
      return false
    } catch (error) {
      logger.error(`删除文件失败: ${localPath}`, { error: (error as Error).message })
      return false
    }
  }

  /**
   * 获取本地图片目录统计信息
   */
  getStorageStats(): {
    totalAvatars: number
    totalThumbnails: number
    avatarDirSize: number
    thumbnailDirSize: number
  } {
    const getSize = (dir: string): number => {
      if (!fs.existsSync(dir)) return 0

      return fs
        .readdirSync(dir)
        .reduce((total, file) => {
          const filePath = path.join(dir, file)
          const stat = fs.statSync(filePath)
          return total + stat.size
        }, 0)
    }

    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    }

    const avatarDirSize = getSize(this.avatarDir)
    const thumbnailDirSize = getSize(this.thumbnailDir)

    return {
      totalAvatars: fs.existsSync(this.avatarDir) ? fs.readdirSync(this.avatarDir).length : 0,
      totalThumbnails: fs.existsSync(this.thumbnailDir)
        ? fs.readdirSync(this.thumbnailDir).length
        : 0,
      avatarDirSize,
      thumbnailDirSize
    }
  }
}

// 导出单例
export const imageDownloadService = new ImageDownloadService()
