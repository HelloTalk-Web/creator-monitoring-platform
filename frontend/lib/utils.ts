import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const PROXY_HOST_KEYWORDS = ["instagram.com", "fbcdn.net"]
const PROXY_ENDPOINT = "/api/image-proxy/image"

/**
 * 根据源 URL 判断是否需要通过图片代理，避免第三方禁止热链。
 */
export function getDisplayImageUrl(url?: string | null): string | null {
  if (!url) return null

  // 已经是代理地址，直接返回
  if (url.startsWith(PROXY_ENDPOINT) || url.includes("/api/image-proxy/image?")) {
    return url
  }

  try {
    const parsed = new URL(url)
    const needsProxy = PROXY_HOST_KEYWORDS.some((keyword) => parsed.hostname.includes(keyword))
    if (!needsProxy) {
      return url
    }

    return `${PROXY_ENDPOINT}?url=${encodeURIComponent(url)}`
  } catch {
    // 不是合法的绝对 URL，直接返回原值
    return url
  }
}
