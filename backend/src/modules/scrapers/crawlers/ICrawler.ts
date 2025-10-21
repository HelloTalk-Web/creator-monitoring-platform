/**
 * 平台爬虫接口
 * 定义所有平台爬虫必须实现的方法
 */

/**
 * 平台爬虫基础接口
 */
export interface ICrawler {
  /**
   * 平台名称
   */
  readonly platformName: string

  /**
   * 平台类型
   */
  readonly platformType: 'tiktok' | 'instagram' | 'youtube'

  /**
   * 初始化爬虫
   */
  initialize(): Promise<void>

  /**
   * 获取用户信息（返回原始API数据）
   */
  getUserInfo(url: string): Promise<any>

  /**
   * 获取用户视频信息（返回原始API数据）
   */
  getUserVideos(url: string, options?: any): Promise<any[]>

  /**
   * 获取用户所有视频数据（自动分页获取）
   */
  getAllUserVideos?(url: string, options?: { maxLimit?: number }): Promise<any[]>

  /**
   * 获取单个视频信息（返回原始API数据）
   */
  getVideoInfo(videoUrl: string): Promise<any>
}

/**
 * 平台爬虫基础抽象类
 * 提供通用的功能和方法
 */
export abstract class BaseCrawler implements ICrawler {
  abstract readonly platformName: string
  abstract readonly platformType: 'tiktok' | 'instagram' | 'youtube'

  /**
   * 初始化爬虫 - 子类必须实现
   */
  abstract initialize(): Promise<void>

  /**
   * 获取用户信息 - 子类必须实现
   */
  abstract getUserInfo(url: string): Promise<any>

  /**
   * 获取用户视频信息 - 子类必须实现
   */
  abstract getUserVideos(url: string, options?: any): Promise<any[]>

  /**
   * 获取单个视频信息 - 子类必须实现
   */
  abstract getVideoInfo(videoUrl: string): Promise<any>

  /**
   * 从URL提取用户标识符
   */
  protected extractIdentifier(url: string): string {
    const patterns = {
      tiktok: /tiktok\.com\/@([^\/\?]+)/,
      instagram: /instagram\.com\/([^\/\?]+)/,
      youtube: /youtube\.com\/@([^\/\?]+)/
    }

    const pattern = patterns[this.platformType]
    if (pattern) {
      const match = url.match(pattern)
      return match ? match[1] : ''
    }

    return ''
  }

  /**
   * 生成标准化的个人资料URL
   */
  protected generateProfileUrl(identifier: string): string {
    const templates = {
      tiktok: `https://www.tiktok.com/@${identifier}`,
      instagram: `https://www.instagram.com/${identifier}/`,
      youtube: `https://www.youtube.com/@${identifier}`
    }

    return templates[this.platformType] || ''
  }

  /**
   * 验证URL格式
   */
  protected isValidUrl(url: string): boolean {
    const identifier = this.extractIdentifier(url)
    return identifier.length > 0
  }
}