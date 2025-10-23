import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 获取图片显示URL (简化版 - 使用统一API)
 *
 * @param type - 图片类型: 'avatar' | 'thumbnail'
 * @param id - 实体ID (账号ID或视频ID)
 * @returns 统一图片API URL
 *
 * 🎯 极致简化: 开发者只需提供 type 和 id, 所有逻辑由后端处理
 */
export function getDisplayImageUrl(
  type: 'avatar' | 'thumbnail',
  id: number
): string {
  const baseUrl = resolveApiBaseUrl()
  return `${baseUrl}/api/images/${type}/${id}`
}

/**
 * 旧版本函数 - 保留用于向后兼容
 * @deprecated 请使用新的 getDisplayImageUrl(type, id) 签名
 */
export function getDisplayImageUrlLegacy(
  originalUrl?: string | null,
  localPath?: string | null
): string | null {
  const baseUrl = resolveApiBaseUrl()

  // 优先: 本地路径 (最快、最可靠)
  if (localPath) {
    return `${baseUrl}${localPath}`
  }

  // 没有本地路径: 统一走代理 (代理会自动下载并本地化)
  if (originalUrl) {
    return `${baseUrl}/api/image-proxy/image?url=${encodeURIComponent(originalUrl)}`
  }

  return null
}

/**
 * 获取 API 基础地址
 */
export function resolveApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8000"
}
