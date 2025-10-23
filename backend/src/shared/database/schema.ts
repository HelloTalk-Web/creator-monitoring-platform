import { pgTable, serial, varchar, text, bigint, integer, boolean, timestamp, json, uniqueIndex, index } from 'drizzle-orm/pg-core'

// 平台表
export const platforms = pgTable('platforms', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  baseUrl: varchar('base_url', { length: 255 }).notNull(),
  urlPattern: varchar('url_pattern', { length: 255 }).notNull(),
  colorCode: varchar('color_code', { length: 7 }),
  iconUrl: varchar('icon_url', { length: 255 }),
  rateLimit: integer('rate_limit'),
  supportedFeatures: json('supported_features'),
  isActive: boolean('is_active'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
})

// 用户表
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// 创作者账号表
export const creatorAccounts = pgTable('creator_accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  platformId: integer('platform_id').notNull(),
  platformUserId: text('platform_user_id').notNull(),
  username: text('username').notNull(),
  displayName: text('display_name'),
  profileUrl: text('profile_url').notNull(),
  avatarUrl: text('avatar_url'),
  localAvatarUrl: text('local_avatar_url'), // 本地头像路径
  bio: text('bio'),
  followerCount: bigint('follower_count', { mode: 'bigint' }),
  followingCount: bigint('following_count', { mode: 'bigint' }),
  totalVideos: integer('total_videos'),
  isVerified: boolean('is_verified'),
  status: text('status'),
  lastScrapedAt: timestamp('last_scraped_at'),
  lastVideoCrawlAt: timestamp('last_video_crawl_at'),
  scrapeFrequency: integer('scrape_frequency'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
})

// 视频表
export const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull(),
  platformVideoId: varchar('platform_video_id', { length: 100 }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  videoUrl: text('video_url').notNull(),
  pageUrl: text('page_url'),
  thumbnailUrl: text('thumbnail_url').notNull(),
  thumbnailLocalPath: varchar('thumbnail_local_path', { length: 500 }),
  duration: integer('duration'),
  publishedAt: timestamp('published_at').notNull(),
  tags: json('tags'),
  viewCount: bigint('view_count', { mode: 'bigint' }),
  likeCount: bigint('like_count', { mode: 'bigint' }),
  commentCount: bigint('comment_count', { mode: 'bigint' }),
  shareCount: bigint('share_count', { mode: 'bigint' }),
  saveCount: bigint('save_count', { mode: 'bigint' }),
  firstScrapedAt: timestamp('first_scraped_at'),
  lastUpdatedAt: timestamp('last_updated_at'),
  dataSource: varchar('data_source', { length: 20 }),
  metadata: json('metadata'),
})

// 视频指标历史表
export const videoMetricsHistory = pgTable('video_metrics_history', {
  id: serial('id').primaryKey(),
  videoId: integer('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  viewCount: bigint('view_count', { mode: 'bigint' }),
  likeCount: bigint('like_count', { mode: 'bigint' }),
  commentCount: bigint('comment_count', { mode: 'bigint' }),
  shareCount: bigint('share_count', { mode: 'bigint' }),
  saveCount: bigint('save_count', { mode: 'bigint' }),
  recordedAt: timestamp('recorded_at').defaultNow(),
}, (table) => ({
  videoRecordedAtIndex: index('video_recorded_at_idx').on(table.videoId, table.recordedAt),
}))

// 抓取任务表
export const scrapeTasks = pgTable('scrape_tasks', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').references(() => creatorAccounts.id, { onDelete: 'cascade' }),
  taskType: varchar('task_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  priority: integer('priority').default(5),
  config: json('config'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').default(3),
  totalVideosFound: integer('total_videos_found').default(0),
  newVideosAdded: integer('new_videos_added').default(0),
  videosUpdated: integer('videos_updated').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  statusCreatedAtIndex: index('status_created_at_idx').on(table.status, table.createdAt),
}))

// 系统配置表
export const systemConfigs = pgTable('system_configs', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: json('value').notNull(),
  description: text('description'),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Platform = typeof platforms.$inferSelect
export type NewPlatform = typeof platforms.$inferInsert

export type CreatorAccount = typeof creatorAccounts.$inferSelect
export type NewCreatorAccount = typeof creatorAccounts.$inferInsert

export type Video = typeof videos.$inferSelect
export type NewVideo = typeof videos.$inferInsert

export type VideoMetricsHistory = typeof videoMetricsHistory.$inferSelect
export type NewVideoMetricsHistory = typeof videoMetricsHistory.$inferInsert

export type ScrapeTask = typeof scrapeTasks.$inferSelect
export type NewScrapeTask = typeof scrapeTasks.$inferInsert

export type SystemConfig = typeof systemConfigs.$inferSelect
export type NewSystemConfig = typeof systemConfigs.$inferInsert

// 图片元数据表 - 集中管理所有图片的元数据和状态
export const imageMetadata = pgTable('image_metadata', {
  id: serial('id').primaryKey(),

  // 图片标识
  originalUrl: text('original_url').notNull().unique(), // 原始URL (唯一索引)
  urlHash: varchar('url_hash', { length: 32 }).notNull().unique(), // URL的MD5哈希 (快速查找)

  // 存储信息
  localPath: text('local_path'), // 本地文件路径
  fileSize: bigint('file_size', { mode: 'number' }), // 文件大小(字节)
  mimeType: varchar('mime_type', { length: 50 }), // MIME类型

  // 状态追踪
  downloadStatus: varchar('download_status', { length: 20 }).notNull().default('pending'), // pending | downloading | completed | failed
  retryCount: integer('retry_count').notNull().default(0), // 当前重试次数
  maxRetries: integer('max_retries').notNull().default(3), // 最大重试次数
  lastError: text('last_error'), // 最后一次错误信息
  nextRetryAt: timestamp('next_retry_at'), // 下一次重试时间

  // 访问统计
  accessCount: bigint('access_count', { mode: 'number' }).notNull().default(0), // 访问次数
  lastAccessedAt: timestamp('last_accessed_at'), // 最后访问时间
  firstAccessedAt: timestamp('first_accessed_at'), // 首次访问时间

  // 时间戳
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  urlHashIndex: index('idx_image_url_hash').on(table.urlHash), // URL查找
  downloadStatusIndex: index('idx_image_status').on(table.downloadStatus), // 状态筛选
  lastAccessedIndex: index('idx_image_access').on(table.lastAccessedAt), // 清理策略
}))

export type ImageMetadata = typeof imageMetadata.$inferSelect
export type NewImageMetadata = typeof imageMetadata.$inferInsert
