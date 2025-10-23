/**
 * 图片代理工具函数
 * 用于绕过Instagram等网站的防盗链限制
 */

/**
 * 生成代理图片URL
 * @param originalUrl 原始图片URL
 * @returns 代理后的图片URL
 */
export function getProxyImageUrl(originalUrl: string | null): string | null {
  if (!originalUrl) {
    return null
  }

  try {
    // 验证URL格式
    new URL(originalUrl)

    // 如果已经是代理URL，直接返回
    if (originalUrl.includes('/api/image-proxy/image')) {
      return originalUrl
    }

    // 构建代理URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const proxyUrl = `${baseUrl}/api/image-proxy/image?url=${encodeURIComponent(originalUrl)}`

    return proxyUrl
  } catch (error) {
    console.error('Invalid image URL:', originalUrl, error)
    return originalUrl // 如果URL格式错误，返回原始URL
  }
}

/**
 * 判断是否需要使用代理
 * @param url 图片URL
 * @returns 是否需要代理
 */
export function needsProxy(url: string): boolean {
  if (!url) return false

  // Instagram域名列表
  const instagramDomains = [
    'instagram.com',
    'cdninstagram.com',
    'fbcdn.net',
    'instagram.fna.fbcdn.net',
    'instagram.cdninstagram.com'
  ]

  try {
    const urlObj = new URL(url)
    return instagramDomains.some(domain =>
      urlObj.hostname.includes(domain)
    )
  } catch {
    return false
  }
}

/**
 * 获取图片URL（自动判断是否需要代理）
 * @param url 原始图片URL
 * @returns 处理后的图片URL
 */
export function getImageUrl(url: string | null): string | null {
  if (!url) return null

  // 如果需要代理，使用代理URL
  if (needsProxy(url)) {
    return getProxyImageUrl(url)
  }

  // 否则返回原始URL
  return url
}
