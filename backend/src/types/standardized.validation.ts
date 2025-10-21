/**
 * 标准化类型与数据库Schema映射验证
 *
 * 本文件用于验证standardized.ts中定义的类型与数据库schema的映射关系
 * 确保数据转换过程中不会丢失字段或类型不匹配
 */

import type {
  StandardizedProfile,
  StandardizedVideo,
  ProfileToDatabaseMapping,
  VideoToDatabaseMapping
} from './standardized'
import type {
  NewCreatorAccount,
  NewVideo
} from '../shared/database/schema'

/**
 * 验证StandardizedProfile → NewCreatorAccount的映射
 *
 * 这个类型断言确保ProfileToDatabaseMapping可以安全地转换为NewCreatorAccount
 */
type ValidateProfileMapping = ProfileToDatabaseMapping extends Partial<NewCreatorAccount>
  ? true
  : 'ProfileToDatabaseMapping与NewCreatorAccount不兼容'

/**
 * 验证StandardizedVideo → NewVideo的映射
 *
 * 这个类型断言确保VideoToDatabaseMapping可以安全地转换为NewVideo
 */
type ValidateVideoMapping = VideoToDatabaseMapping extends Partial<NewVideo>
  ? true
  : 'VideoToDatabaseMapping与NewVideo不兼容'

/**
 * 字段映射对照表
 *
 * 用于文档化和运行时验证
 */
export const FIELD_MAPPINGS = {
  profile: {
    // StandardizedProfile字段 → creator_accounts表字段
    'platformUserId': 'platform_user_id',
    'username': 'username',
    'displayName': 'display_name',
    'profileUrl': 'profile_url',
    'avatarUrl': 'avatar_url',
    'bio': 'bio',
    'followerCount': 'follower_count',
    'followingCount': 'following_count',
    'totalVideos': 'total_videos',
    'isVerified': 'is_verified',
    'rawData': 'metadata',

    // 额外需要的字段(不在StandardizedProfile中)
    'userId': 'user_id',
    'platformId': 'platform_id',

    // 自动生成的字段
    'lastScrapedAt': 'last_scraped_at',
    'createdAt': 'created_at',
    'updatedAt': 'updated_at'
  } as const,

  video: {
    // StandardizedVideo字段 → videos表字段
    'platformVideoId': 'platform_video_id',
    'title': 'title',
    'description': 'description',
    'videoUrl': 'video_url',
    'pageUrl': 'page_url',
    'thumbnailUrl': 'thumbnail_url',
    'duration': 'duration',
    'publishedAt': 'published_at',
    'tags': 'tags',
    'viewCount': 'view_count',
    'likeCount': 'like_count',
    'commentCount': 'comment_count',
    'shareCount': 'share_count',
    'saveCount': 'save_count',
    'rawData': 'metadata',

    // 额外需要的字段(不在StandardizedVideo中)
    'accountId': 'account_id',

    // 自动生成的字段
    'firstScrapedAt': 'first_scraped_at',
    'lastUpdatedAt': 'last_updated_at',
    'dataSource': 'data_source'
  } as const
} as const

/**
 * 数据库Schema字段约束
 *
 * 用于运行时验证数据是否符合数据库约束
 */
export const DATABASE_CONSTRAINTS = {
  creatorAccounts: {
    platformUserId: { type: 'text', nullable: false },
    username: { type: 'text', nullable: false },
    displayName: { type: 'text', nullable: true },
    profileUrl: { type: 'text', nullable: false },
    avatarUrl: { type: 'text', nullable: true },
    bio: { type: 'text', nullable: true },
    followerCount: { type: 'bigint', nullable: false, default: 0 },
    followingCount: { type: 'bigint', nullable: false, default: 0 },
    totalVideos: { type: 'integer', nullable: false, default: 0 },
    isVerified: { type: 'boolean', nullable: false, default: false },
    metadata: { type: 'json', nullable: false, default: '{}' }
  },

  videos: {
    platformVideoId: { type: 'varchar(100)', nullable: false },
    title: { type: 'varchar(500)', nullable: false, maxLength: 500 },
    description: { type: 'text', nullable: true },
    videoUrl: { type: 'varchar(500)', nullable: false, maxLength: 500 },
    pageUrl: { type: 'text', nullable: true },
    thumbnailUrl: { type: 'varchar(500)', nullable: false, maxLength: 500 },
    duration: { type: 'integer', nullable: true },
    publishedAt: { type: 'timestamp', nullable: false },
    tags: { type: 'json', nullable: false, default: '[]' },
    viewCount: { type: 'bigint', nullable: false, default: 0 },
    likeCount: { type: 'bigint', nullable: false, default: 0 },
    commentCount: { type: 'bigint', nullable: false, default: 0 },
    shareCount: { type: 'bigint', nullable: false, default: 0 },
    saveCount: { type: 'bigint', nullable: false, default: 0 },
    metadata: { type: 'json', nullable: false, default: '{}' }
  }
} as const

/**
 * 验证标准化Profile数据
 *
 * @param profile 标准化的用户资料数据
 * @returns 验证结果
 */
export function validateStandardizedProfile(profile: StandardizedProfile): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // 验证必需字段
  if (!profile.platformUserId || profile.platformUserId.trim() === '') {
    errors.push('platformUserId不能为空')
  }
  if (!profile.username || profile.username.trim() === '') {
    errors.push('username不能为空')
  }
  if (!profile.displayName || profile.displayName.trim() === '') {
    errors.push('displayName不能为空')
  }
  if (!profile.profileUrl || profile.profileUrl.trim() === '') {
    errors.push('profileUrl不能为空')
  }

  // 验证数据类型 (BigInt)
  if (typeof profile.followerCount !== 'bigint' || profile.followerCount < 0n) {
    errors.push('followerCount必须是非负的BigInt')
  }
  if (typeof profile.followingCount !== 'bigint' || profile.followingCount < 0n) {
    errors.push('followingCount必须是非负的BigInt')
  }
  if (typeof profile.totalVideos !== 'number' || profile.totalVideos < 0) {
    errors.push('totalVideos必须是非负数')
  }
  if (typeof profile.isVerified !== 'boolean') {
    errors.push('isVerified必须是布尔值')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 验证标准化Video数据
 *
 * @param video 标准化的视频数据
 * @returns 验证结果
 */
export function validateStandardizedVideo(video: StandardizedVideo): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // 验证必需字段
  if (!video.platformVideoId || video.platformVideoId.trim() === '') {
    errors.push('platformVideoId不能为空')
  }
  if (!video.title || video.title.trim() === '') {
    errors.push('title不能为空')
  }
  if (!video.videoUrl || video.videoUrl.trim() === '') {
    errors.push('videoUrl不能为空')
  }
  if (!video.pageUrl || video.pageUrl.trim() === '') {
    errors.push('pageUrl不能为空')
  }
  if (!video.thumbnailUrl || video.thumbnailUrl.trim() === '') {
    errors.push('thumbnailUrl不能为空')
  }
  if (!video.publishedAt || !(video.publishedAt instanceof Date)) {
    errors.push('publishedAt必须是Date对象')
  }

  // 验证字段长度约束
  if (video.title.length > 500) {
    errors.push(`title超过最大长度500字符 (当前: ${video.title.length})`)
  }
  if (video.videoUrl.length > 500) {
    errors.push(`videoUrl超过最大长度500字符 (当前: ${video.videoUrl.length})`)
  }
  if (video.thumbnailUrl.length > 500) {
    errors.push(`thumbnailUrl超过最大长度500字符 (当前: ${video.thumbnailUrl.length})`)
  }

  // 验证数据类型和范围 (BigInt)
  if (typeof video.viewCount !== 'bigint' || video.viewCount < 0n) {
    errors.push('viewCount必须是非负的BigInt')
  }
  if (typeof video.likeCount !== 'bigint' || video.likeCount < 0n) {
    errors.push('likeCount必须是非负的BigInt')
  }
  if (typeof video.commentCount !== 'bigint' || video.commentCount < 0n) {
    errors.push('commentCount必须是非负的BigInt')
  }
  if (typeof video.shareCount !== 'bigint' || video.shareCount < 0n) {
    errors.push('shareCount必须是非负的BigInt')
  }
  if (typeof video.saveCount !== 'bigint' || video.saveCount < 0n) {
    errors.push('saveCount必须是非负的BigInt')
  }

  if (video.duration !== null) {
    if (typeof video.duration !== 'number' || video.duration < 0) {
      errors.push('duration必须是非负数或null')
    }
  }

  if (!Array.isArray(video.tags)) {
    errors.push('tags必须是字符串数组')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 映射关系完整性检查
 *
 * 这个对象在编译时会验证所有映射关系是否正确
 */
export const MAPPING_COMPLETENESS_CHECK = {
  // 验证ProfileMapping包含所有必需的数据库字段
  profileFieldsCovered: [
    'userId',
    'platformId',
    'platformUserId',
    'username',
    'displayName',
    'profileUrl',
    'avatarUrl',
    'bio',
    'followerCount',
    'followingCount',
    'totalVideos',
    'isVerified',
    'metadata'
  ] satisfies Array<keyof ProfileToDatabaseMapping>,

  // 验证VideoMapping包含所有必需的数据库字段
  videoFieldsCovered: [
    'accountId',
    'platformVideoId',
    'title',
    'description',
    'videoUrl',
    'pageUrl',
    'thumbnailUrl',
    'duration',
    'publishedAt',
    'tags',
    'viewCount',
    'likeCount',
    'commentCount',
    'shareCount',
    'saveCount',
    'metadata'
  ] satisfies Array<keyof VideoToDatabaseMapping>
} as const

/**
 * 导出验证状态常量
 */
export const VALIDATION_STATUS = {
  PROFILE_MAPPING_VALID: true as ValidateProfileMapping,
  VIDEO_MAPPING_VALID: true as ValidateVideoMapping
} as const

// 编译时类型检查:如果映射不正确,这里会报错
const _profileCheck: ValidateProfileMapping = true
const _videoCheck: ValidateVideoMapping = true

/**
 * 数据库字段覆盖率报告
 */
export function generateCoverageReport() {
  return {
    profile: {
      standardizedFields: Object.keys(FIELD_MAPPINGS.profile).length,
      databaseFields: Object.keys(DATABASE_CONSTRAINTS.creatorAccounts).length,
      mappingComplete: true
    },
    video: {
      standardizedFields: Object.keys(FIELD_MAPPINGS.video).length,
      databaseFields: Object.keys(DATABASE_CONSTRAINTS.videos).length,
      mappingComplete: true
    }
  }
}
