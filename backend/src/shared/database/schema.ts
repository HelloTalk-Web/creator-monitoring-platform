import { pgTable, serial, varchar, text, bigint, integer, boolean, timestamp, json, uniqueIndex, index } from 'drizzle-orm/pg-core'

// 平台表
export const platforms = pgTable('platforms', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  baseUrl: varchar('base_url', { length: 255 }).notNull(),
  urlPattern: varchar('url_pattern', { length: 255 }).notNull(),
  colorCode: varchar('color_code', { length: 7 }).default('#1890ff'),
  iconUrl: varchar('icon_url', { length: 255 }),
  rateLimit: integer('rate_limit').default(100),
  supportedFeatures: json('supported_features').default(JSON.stringify([])),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
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
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platformId: integer('platform_id').notNull().references(() => platforms.id),
  platformUserId: text('platform_user_id').notNull(),
  username: text('username').notNull(),
  displayName: text('display_name'),
  profileUrl: text('profile_url').notNull(),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  followerCount: bigint('follower_count', { mode: 'bigint' }).default(BigInt(0)),
  followingCount: bigint('following_count', { mode: 'bigint' }).default(BigInt(0)),
  totalVideos: integer('total_videos').default(0),
  isVerified: boolean('is_verified').default(false),
  status: text('status').default('active'),
  lastScrapedAt: timestamp('last_scraped_at'),
  lastVideoCrawlAt: timestamp('last_video_crawl_at'),
  scrapeFrequency: integer('scrape_frequency').default(24),
  metadata: json('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userPlatformUnique: uniqueIndex('user_platform_unique').on(table.userId, table.platformId, table.platformUserId),
}))

// 视频表
export const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull().references(() => creatorAccounts.id, { onDelete: 'cascade' }),
  platformVideoId: varchar('platform_video_id', { length: 100 }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  videoUrl: varchar('video_url', { length: 500 }).notNull(),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }).notNull(),
  thumbnailLocalPath: varchar('thumbnail_local_path', { length: 500 }),
  duration: integer('duration'),
  publishedAt: timestamp('published_at').notNull(),
  tags: json('tags').default(JSON.stringify([])),
  viewCount: bigint('view_count', { mode: 'bigint' }).default(BigInt(0)),
  likeCount: bigint('like_count', { mode: 'bigint' }).default(BigInt(0)),
  commentCount: bigint('comment_count', { mode: 'bigint' }).default(BigInt(0)),
  shareCount: bigint('share_count', { mode: 'bigint' }).default(BigInt(0)),
  saveCount: bigint('save_count', { mode: 'bigint' }).default(BigInt(0)),
  firstScrapedAt: timestamp('first_scraped_at').defaultNow(),
  lastUpdatedAt: timestamp('last_updated_at').defaultNow(),
  dataSource: varchar('data_source', { length: 20 }).default('api'),
  metadata: json('metadata').default(JSON.stringify({})),
}, (table) => ({
  accountVideoUnique: uniqueIndex('account_video_unique').on(table.accountId, table.platformVideoId),
  publishedAtIndex: index('published_at_idx').on(table.publishedAt),
  lastUpdatedIndex: index('last_updated_idx').on(table.lastUpdatedAt),
}))

// 视频指标历史表
export const videoMetricsHistory = pgTable('video_metrics_history', {
  id: serial('id').primaryKey(),
  videoId: integer('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  viewCount: bigint('view_count', { mode: 'bigint' }).default(BigInt(0)),
  likeCount: bigint('like_count', { mode: 'bigint' }).default(BigInt(0)),
  commentCount: bigint('comment_count', { mode: 'bigint' }).default(BigInt(0)),
  shareCount: bigint('share_count', { mode: 'bigint' }).default(BigInt(0)),
  saveCount: bigint('save_count', { mode: 'bigint' }).default(BigInt(0)),
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
  config: json('config').default(JSON.stringify({})),
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