/**
 * Instagram 数据转换器
 *
 * 将 Instagram API 原始数据转换为标准化格式
 */

import { BaseTransformer } from './base.transformer'
import type { StandardizedProfile, StandardizedVideo } from '../../../types/standardized'
import type { ScrapeCreatorsProfileResponse } from '../../../types'

/**
 * Instagram Profile 原始数据类型
 * 基于 ScrapeCreators API v1 响应格式
 *
 * 📊 API数据限制说明:
 *
 * ✅ API提供的数据:
 * - 粉丝数、关注数、帖子总数 (实时准确)
 * - 用户基本信息 (用户名、简介、头像等)
 * - 最新帖子列表 (包含点赞、评论、观看数)
 * - 认证状态和账号类型
 *
 * ❌ API不提供的关键数据:
 * - 总点赞数 (所有帖子累计) - 需要手动计算
 * - 总评论数 (所有帖子累计) - 需要手动计算
 * - 总观看数 (所有视频累计) - 需要手动计算
 * - 分享数 - Instagram API完全不提供
 * - 收藏数 - 仅作者可见，API不提供
 * - 历史增长趋势数据
 * - 最佳发布时间分析
 * - 标签使用统计
 */
export interface InstagramRawProfile {
  user: {
    id: string
    username: string
    full_name?: string
    biography?: string
    external_url?: string

    // 统计数据 - API提供实时数据
    edge_followed_by: {
      count: number  // 粉丝数 - API提供准确数据
    }
    edge_follow: {
      count: number  // 关注数 - API提供准确数据
    }

    // 状态信息
    is_private: boolean
    is_verified: boolean
    is_business_account: boolean
    is_professional_account?: boolean

    // 头像信息
    profile_pic_url?: string
    profile_pic_url_hd?: string

    // 帖子数据 - 包含最新帖子，可用于分析
    edge_owner_to_timeline_media: {
      count: number  // 帖子总数 - API提供准确数据
      edges?: Array<{
        node: {
          id: string
          shortcode: string
          display_url: string
          video_url?: string
          is_video: boolean
          edge_liked_by: { count: number }  // 单帖点赞数
          edge_media_to_comment: { count: number }  // 单帖评论数
          taken_at_timestamp: number
          dimensions: { width: number; height: number }
          thumbnail_src?: string
          video_view_count?: number  // 视频观看数 (仅视频)
          caption?: string
        }
      }>
    }

    // 其他可用数据
    bio_links?: Array<{
      title: string
      url: string
      link_type: string
    }>
    category_name?: string
    business_address_json?: string

    [key: string]: any
  }
  [key: string]: any
}

/**
 * Instagram Video/Post 原始数据类型
 * 基于 ScrapeCreators API v2 posts端点响应格式
 *
 * 📊 API数据限制说明:
 *
 * ✅ API提供的数据:
 * - 点赞数、评论数、观看数 (实时准确)
 * - 帖子基本信息 (标题、图片、视频URL)
 * - 发布时间和尺寸信息
 * - 作者基本信息
 * - 视频时长 (仅视频)
 *
 * ❌ API不提供的关键数据:
 * - 分享数 - Instagram API完全不提供
 * - 收藏数 - 仅作者可见，API不提供
 * - 详细用户互动列表
 * - 触达范围和推荐分数
 * - 地理位置详细信息 (用户未公开时)
 * - 详细评论内容 (只能获取数量和部分评论)
 */
export interface InstagramRawVideo {
  // 基本标识信息
  pk: string              // 平台视频ID
  id: string              // 同pk
  code: string            // shortcode

  // 媒体类型
  media_type: number       // 2=视频, 1=图片
  product_type?: string    // "clips", "feed", "post"

  // 互动数据 - API提供实时数据
  like_count: number       // 点赞数 - API提供准确数据
  comment_count: number    // 评论数 - API提供准确数据
  play_count?: number      // 播放数 - API提供准确数据 (仅视频)
  share_count?: number     // 分享数 - API可能不提供

  // 时间信息
  taken_at: number         // 发布时间 (Unix timestamp)

  // 内容信息
  caption?: any           // 帖子标题/描述 (复杂对象)
  description?: string     // 简化描述

  // URL信息
  url?: string             // 帖子页面URL

  // 媒体资源
  image_versions2?: {
    candidates: Array<{
      width: number
      height: number
      url: string
    }>
  }

  video_versions?: Array<{
    width: number
    height: number
    type: number
    url: string
  }>

  video_duration?: number  // 视频时长 (秒)

  // 作者信息
  user?: {
    pk: string              // 用户ID
    username: string        // 用户名
    full_name: string       // 显示名称
    is_verified?: boolean   // 认证状态
    profile_pic_url?: string // 头像URL
  }

  owner?: {
    pk: string
    username: string
    full_name: string
    is_verified?: boolean
    profile_pic_url?: string
  }

  // 缩略图
  thumbnail_url?: string

  // 音频信息 (仅视频)
  music_metadata?: any

  // 其他数据
  [key: string]: any
}

/**
 * Instagram 数据转换器
 *
 * 实现 Instagram 数据到标准格式的转换
 */
export class InstagramTransformer extends BaseTransformer<InstagramRawProfile, InstagramRawVideo> {
  readonly platformType = 'instagram' as const

  /**
   * 处理不同API响应格式的用户数据，统一为标准格式
   *
   * Instagram API在不同端点返回的用户数据结构:
   * - /profile: 返回 { success: true, data: { user: {...} } }
   * - /post: 返回 { data: { xdt_shortcode_media: { owner: {...} } } }
   * - /posts: 返回 { data: { posts: [{ owner: {...} }] } }
   */
  private normalizeProfileData(data: any): InstagramRawProfile {
    // 处理标准profile响应格式: { success: true, data: { user: {...} } }
    if (data?.data?.user) {
      return data.data
    }

    // 处理直接的profile响应格式: { user: {...} }
    if (data?.user) {
      return data
    }

    // 处理从post响应中提取的用户信息: { data: { xdt_shortcode_media: { owner: {...} } } }
    if (data?.xdt_shortcode_media?.owner) {
      const owner = data.xdt_shortcode_media.owner
      // 构造最小化的用户资料对象
      return {
        user: {
          id: owner.id,
          username: owner.username,
          full_name: owner.full_name,
          is_verified: owner.is_verified,
          profile_pic_url: owner.profile_pic_url,
          edge_followed_by: { count: 0 }, // 从单个帖子无法获取
          edge_follow: { count: 0 },
          edge_owner_to_timeline_media: { count: 0, edges: [] },
          is_private: false,
          is_business_account: false
        }
      }
    }

    // 处理包装在data中的post响应
    if (data?.data?.xdt_shortcode_media?.owner) {
      const owner = data.data.xdt_shortcode_media.owner
      return {
        user: {
          id: owner.id,
          username: owner.username,
          full_name: owner.full_name,
          is_verified: owner.is_verified,
          profile_pic_url: owner.profile_pic_url,
          edge_followed_by: { count: 0 },
          edge_follow: { count: 0 },
          edge_owner_to_timeline_media: { count: 0, edges: [] },
          is_private: false,
          is_business_account: false
        }
      }
    }

    // 直接返回已经是标准格式的数据
    return data
  }

  /**
   * 将 Instagram 用户资料转换为标准格式
   *
   * 📊 数据转换说明:
   *
   * ✅ 直接映射的数据 (API提供准确值):
   * - platformUserId: API用户ID
   * - username: API用户名
   * - followerCount: API粉丝数 (实时)
   * - followingCount: API关注数 (实时)
   * - totalVideos: API帖子总数 (实时)
   * - isVerified: API认证状态
   *
   * ⚠️ 数据限制:
   * - 总点赞数/评论数: Instagram API不提供累计数据，设为0
   * - 需要通过分析最新帖子来估算互动表现
   */
  transformProfile(rawData: InstagramRawProfile | any): StandardizedProfile {
    // 标准化不同API端点的数据格式
    const normalizedData = this.normalizeProfileData(rawData)
    const user = normalizedData.user

    return {
      platform: this.platformType,
      platformUserId: this.safeString(user.id),
      username: this.safeString(user.username),
      profileUrl: `https://www.instagram.com/${user.username}/`,
      displayName: this.safeString(user.full_name || user.username),
      bio: this.safeString(user.biography),
      avatarUrl: this.safeString(user.profile_pic_url_hd || user.profile_pic_url),
      totalVideos: this.safeNumber(user.edge_owner_to_timeline_media?.count),
      followerCount: BigInt(this.safeNumber(user.edge_followed_by?.count)),
      followingCount: BigInt(this.safeNumber(user.edge_follow?.count)),
      isVerified: Boolean(user.is_verified),
      rawData: normalizedData
    }
  }

  /**
   * 处理不同的API响应格式，统一为标准格式
   *
   * Instagram API在不同端点返回的数据结构略有不同:
   * - /profile: 返回data.user.edge_owner_to_timeline_media.edges[].node格式
   * - /v2/posts: 返回items数组格式
   * - /post: 返回data.xdt_shortcode_media格式
   */
  private normalizeVideoData(data: any): InstagramRawVideo {
    // 处理 /v2/posts 端点的响应格式: items[]
    if (data?.items && Array.isArray(data.items)) {
      return data.items[0] || data
    }

    // 直接是items数组中的一个元素
    if (data?.pk || data?.id) {
      return data
    }

    // 处理 /post 端点的响应格式: data.xdt_shortcode_media
    if (data?.xdt_shortcode_media) {
      return this.convertPostInfoToVideoFormat(data.xdt_shortcode_media)
    }

    // 处理从用户资料中提取的帖子格式: edge_owner_to_timeline_media.edges[].node
    if (data?.node) {
      return this.convertProfileNodeToVideoFormat(data.node)
    }

    // 直接返回标准格式数据
    return data
  }

  /**
   * 将Post Info API的数据格式转换为标准视频格式
   */
  private convertPostInfoToVideoFormat(postData: any): InstagramRawVideo {
    return {
      pk: postData.id || postData.shortcode,
      id: postData.id || postData.shortcode,
      code: postData.shortcode,
      media_type: postData.is_video ? 2 : 1,
      product_type: postData.product_type,
      like_count: postData.edge_liked_by?.count || 0,
      comment_count: postData.edge_media_to_comment?.count || 0,
      play_count: postData.video_view_count,
      taken_at: postData.taken_at_timestamp,
      caption: postData.edge_media_to_caption?.edges?.[0]?.node?.text,
      url: `https://www.instagram.com/p/${postData.shortcode}/`,
      image_versions2: postData.display_resources ? {
        candidates: postData.display_resources.map((resource: any) => ({
          width: resource.config_width,
          height: resource.config_height,
          url: resource.src
        }))
      } : undefined,
      video_versions: postData.video_url ? [{
        width: postData.dimensions?.width || 0,
        height: postData.dimensions?.height || 0,
        type: 101,
        url: postData.video_url
      }] : undefined,
      video_duration: postData.video_duration,
      owner: postData.owner,
      thumbnail_url: postData.thumbnail_src || postData.display_url,
      ...postData
    }
  }

  /**
   * 将Profile API中的帖子节点转换为标准视频格式
   */
  private convertProfileNodeToVideoFormat(node: any): InstagramRawVideo {
    return {
      pk: node.id,
      id: node.id,
      code: node.shortcode,
      media_type: node.is_video ? 2 : 1,
      product_type: node.product_type,
      like_count: node.edge_liked_by?.count || 0,
      comment_count: node.edge_media_to_comment?.count || 0,
      play_count: node.video_view_count,
      taken_at: node.taken_at_timestamp,
      caption: node.caption,
      url: `https://www.instagram.com/p/${node.shortcode}/`,
      image_versions2: node.display_resources ? {
        candidates: node.display_resources.map((resource: any) => ({
          width: resource.config_width,
          height: resource.config_height,
          url: resource.src
        }))
      } : undefined,
      video_versions: node.video_url ? [{
        width: node.dimensions?.width || 0,
        height: node.dimensions?.height || 0,
        type: 101,
        url: node.video_url
      }] : undefined,
      video_duration: node.video_duration,
      owner: node.owner,
      thumbnail_url: node.thumbnail_src || node.display_url,
      ...node
    }
  }

  /**
   * 将 Instagram 视频/帖子转换为标准格式
   *
   * 📊 数据转换说明:
   *
   * ✅ 直接映射的数据 (API提供准确值):
   * - platformVideoId: API帖子ID
   * - viewCount: API观看数 (仅视频，实时)
   * - likeCount: API点赞数 (实时)
   * - commentCount: API评论数 (实时)
   * - duration: API视频时长 (仅视频)
   *
   * ⚠️ 数据限制和默认值:
   * - shareCount: Instagram API完全不提供分享数，设为0
   * - saveCount: 仅作者可见，API不提供，设为0
   * - tags: API不提供结构化标签，设为空数组
 * - title: Instagram帖子没有独立标题，优先使用caption文本，否则生成兜底标题
   *
   * 🔧 特殊处理:
   * - videoUrl: 仅视频有值，图片帖为空字符串
   * - description: 从caption字段提取，可能为空
   * - pageUrl: 基于shortcode生成标准Instagram URL
   */
  transformVideo(rawData: InstagramRawVideo | any): StandardizedVideo {
    // 标准化不同API端点的数据格式
    const normalizedData = this.normalizeVideoData(rawData)

    // 提取标题和描述
    const captionText = this.extractCaptionText(normalizedData.caption)
    const title = captionText || this.generateFallbackTitle(normalizedData)
    const description = captionText ? captionText : null

    // 提取视频URL
    const videoUrl = this.selectBestVideoUrl(normalizedData)

    // 提取缩略图URL
    const thumbnailUrl = this.selectBestThumbnailUrl(normalizedData)

    // 提取页面URL
    const pageUrl = this.safeString(normalizedData.url) ||
                    `https://www.instagram.com/p/${this.safeString(normalizedData.code)}/`

    // 提取标签
    const tags = this.extractHashtags(captionText)

    const standardizedVideo: StandardizedVideo = {
      platform: this.platformType,
      platformVideoId: this.safeString(normalizedData.pk || normalizedData.id),
      title: this.truncateString(title, 500),
      description: description || null,
      publishedAt: normalizedData.taken_at
        ? new Date(normalizedData.taken_at * 1000)
        : new Date(),
      videoUrl: this.safeString(videoUrl),
      pageUrl: this.safeString(pageUrl),
      thumbnailUrl: this.safeString(thumbnailUrl),

      // 互动数据 - API提供实时准确数据
      viewCount: this.safeBigInt(normalizedData.play_count),
      likeCount: this.safeBigInt(normalizedData.like_count),
      commentCount: this.safeBigInt(normalizedData.comment_count),
      shareCount: this.safeBigInt(normalizedData.share_count, 0n), // 可能为0
      saveCount: BigInt(0), // Instagram不提供

      duration: normalizedData.video_duration !== undefined && normalizedData.video_duration !== null
        ? Math.round(this.safeNumber(normalizedData.video_duration))
        : null,
      tags: tags,

      rawData: normalizedData
    }

    // 验证数据完整性
    this.validateVideo(standardizedVideo)

    return standardizedVideo
  }

  /**
   * 批量转换视频数据
   */
  transformVideos(rawVideos: InstagramRawVideo[]): StandardizedVideo[] {
    return rawVideos.map(video => this.transformVideo(video))
  }

  /**
   * 从caption对象中提取文本内容
   */
  private extractCaptionText(caption: any): string {
    if (!caption) return ''

    // 如果caption是字符串，直接返回
    if (typeof caption === 'string') {
      return caption.trim()
    }

    if (Array.isArray(caption)) {
      for (const item of caption) {
        const text = this.extractCaptionText(item)
        if (text) return text
      }
      return ''
    }

    if (typeof caption === 'object') {
      if (caption.text) {
        return String(caption.text).trim()
      }

      if (caption.node?.text) {
        return String(caption.node.text).trim()
      }

      if (caption.edges && Array.isArray(caption.edges)) {
        for (const edge of caption.edges) {
          const text = edge?.node?.text
          if (text) {
            return String(text).trim()
          }
        }
      }
    }

    // 其他情况返回空字符串
    return ''
  }

  /**
   * 为没有标题的帖子生成兜底标题
   */
  private generateFallbackTitle(data: InstagramRawVideo): string {
    const identifier = this.safeString(data.code) || this.safeString(data.pk) || this.safeString(data.id)
    const isVideo = data.media_type === 2 || data.product_type === 'clips' || data.product_type === 'igtv'
    const typeLabel = isVideo ? '视频' : '帖子'

    if (identifier) {
      return `Instagram${typeLabel} (${identifier})`
    }

    if (data.taken_at) {
      const date = new Date(data.taken_at * 1000)
      if (!Number.isNaN(date.getTime())) {
        const dateLabel = date.toISOString().split('T')[0]
        return `Instagram${typeLabel} (${dateLabel})`
      }
    }

    return `Instagram${typeLabel}`
  }

  /**
   * 选择最佳视频URL
   */
  private selectBestVideoUrl(data: InstagramRawVideo): string {
    if (!data.video_versions || data.video_versions.length === 0) {
      return ''
    }

    // 选择最高分辨率的视频
    const bestVideo = data.video_versions.reduce((best, current) => {
      const bestPixels = (best.width || 0) * (best.height || 0)
      const currentPixels = (current.width || 0) * (current.height || 0)
      return currentPixels > bestPixels ? current : best
    })

    return this.safeString(bestVideo.url)
  }

  /**
   * 选择最佳缩略图URL
   */
  private selectBestThumbnailUrl(data: InstagramRawVideo): string {
    // 优先使用专门的缩略图URL
    if (data.thumbnail_url) {
      return this.safeString(data.thumbnail_url)
    }

    // 尝试从image_versions2中选择最佳质量
    if (data.image_versions2?.candidates) {
      const bestImage = data.image_versions2.candidates.reduce((best, current) => {
        const bestPixels = (best.width || 0) * (best.height || 0)
        const currentPixels = (current.width || 0) * (current.height || 0)
        return currentPixels > bestPixels ? current : best
      })
      return this.safeString(bestImage.url)
    }

    return ''
  }

  /**
   * 从用户资料中提取最新视频
   */
  extractRecentVideos(profile: InstagramRawProfile, limit: number = 12): StandardizedVideo[] {
    const edges = profile.user?.edge_owner_to_timeline_media?.edges || []
    const rawVideos: InstagramRawVideo[] = edges
      .slice(0, limit)
      .map(edge => this.transformPostNodeToVideo(edge.node))

    return this.transformVideos(rawVideos)
  }

  /**
   * 将帖子节点数据转换为视频格式
  *
  * 处理从用户资料的edge_owner_to_timeline_media.edges[].node格式
  */
  private transformPostNodeToVideo(node: any): InstagramRawVideo {
    return this.convertProfileNodeToVideoFormat(node)
  }

  /**
   * 验证原始数据格式
   */
  validateRawProfile(data: any): data is InstagramRawProfile {
    return (
      data &&
      typeof data === 'object' &&
      data.user &&
      typeof data.user.id === 'string' &&
      typeof data.user.username === 'string'
    )
  }

  /**
   * 验证原始视频数据格式
   */
  validateRawVideo(data: any): data is InstagramRawVideo {
    return (
      data &&
      typeof data === 'object' &&
      data.id &&
      data.shortcode &&
      typeof data.id === 'string' &&
      typeof data.shortcode === 'string'
    )
  }
}
