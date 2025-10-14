// 创建平台请求
export interface CreatePlatformRequest {
  name: string
  displayName: string
  baseUrl: string
  urlPattern: string
  colorCode?: string
  iconUrl?: string
  rateLimit?: number
  supportedFeatures?: string[]
  isActive?: boolean
}

// 更新平台请求
export interface UpdatePlatformRequest {
  name?: string
  displayName?: string
  baseUrl?: string
  urlPattern?: string
  colorCode?: string
  iconUrl?: string
  rateLimit?: number
  supportedFeatures?: string[]
  isActive?: boolean
}

// 平台响应
export interface PlatformResponse {
  id: number
  name: string
  displayName: string
  baseUrl: string
  urlPattern: string
  colorCode: string | null
  iconUrl: string | null
  rateLimit: number | null
  supportedFeatures: any
  isActive: boolean
  created_at: string
  updated_at: string
}

// 平台列表响应
export interface PlatformsListResponse {
  platforms: PlatformResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// 平台过滤器
export interface PlatformFilters {
  page?: number
  limit?: number
  name?: string
  isActive?: boolean
}