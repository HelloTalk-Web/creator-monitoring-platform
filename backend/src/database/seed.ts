import { prisma } from './prisma'
import { logger } from '../utils/logger'

async function main() {
  logger.info('Starting database seeding...')

  // 清理现有数据（仅在开发环境中）
  if (process.env.NODE_ENV === 'development') {
    logger.info('Cleaning existing data...')
    await prisma.auditLog.deleteMany()
    await prisma.videoMetricsHistory.deleteMany()
    await prisma.video.deleteMany()
    await prisma.scrapeTask.deleteMany()
    await prisma.creatorAccount.deleteMany()
    await prisma.systemConfig.deleteMany()
    await prisma.platform.deleteMany()
    await prisma.user.deleteMany()
  }

  // 插入平台数据
  logger.info('Seeding platforms...')
  const platforms = await Promise.all([
    prisma.platform.upsert({
      where: { name: 'tiktok' },
      update: {},
      create: {
        name: 'tiktok',
        displayName: 'TikTok',
        baseUrl: 'https://www.tiktok.com',
        urlPattern: '^https://(www\\.)?tiktok\\.com/@[^/\\?]+/?',
        colorCode: '#000000',
        rateLimit: 100,
        supportedFeatures: ['profile', 'videos', 'video_details']
      }
    }),
    prisma.platform.upsert({
      where: { name: 'instagram' },
      update: {},
      create: {
        name: 'instagram',
        displayName: 'Instagram',
        baseUrl: 'https://www.instagram.com',
        urlPattern: '^https://(www\\.)?instagram\\.com/[^/]+/?',
        colorCode: '#E4405F',
        rateLimit: 100,
        supportedFeatures: ['profile', 'videos', 'video_details']
      }
    }),
    prisma.platform.upsert({
      where: { name: 'youtube' },
      update: {},
      create: {
        name: 'youtube',
        displayName: 'YouTube',
        baseUrl: 'https://www.youtube.com',
        urlPattern: '^https://(www\\.)?youtube\\.com/(c|channel|user)/[^/]+/?',
        colorCode: '#FF0000',
        rateLimit: 100,
        supportedFeatures: ['profile', 'videos', 'video_details']
      }
    }),
    prisma.platform.upsert({
      where: { name: 'facebook' },
      update: {},
      create: {
        name: 'facebook',
        displayName: 'Facebook',
        baseUrl: 'https://www.facebook.com',
        urlPattern: '^https://(www\\.)?facebook\\.com/[^/]+/?',
        colorCode: '#1877F2',
        rateLimit: 100,
        supportedFeatures: ['profile', 'videos', 'video_details']
      }
    }),
    prisma.platform.upsert({
      where: { name: 'xiaohongshu' },
      update: {},
      create: {
        name: 'xiaohongshu',
        displayName: '小红书',
        baseUrl: 'https://www.xiaohongshu.com',
        urlPattern: '^https://(www\\.)?xiaohongshu\\.com/user/profile/[^/]+/?',
        colorCode: '#FE2C55',
        rateLimit: 50,
        supportedFeatures: ['profile', 'videos']
      }
    }),
    prisma.platform.upsert({
      where: { name: 'douyin' },
      update: {},
      create: {
        name: 'douyin',
        displayName: '抖音',
        baseUrl: 'https://www.douyin.com',
        urlPattern: '^https://(www\\.)?douyin\\.com/user/[^/]+/?',
        colorCode: '#000000',
        rateLimit: 50,
        supportedFeatures: ['profile', 'videos']
      }
    })
  ])

  // 插入系统配置
  logger.info('Seeding system configs...')
  const configs = await Promise.all([
    prisma.systemConfig.upsert({
      where: { key: 'scrape_limits' },
      update: {},
      create: {
        key: 'scrape_limits',
        value: {
          daily_per_user: 1000,
          hourly_per_account: 10,
          concurrent_per_user: 3
        },
        description: '抓取限制配置',
        isPublic: true
      }
    }),
    prisma.systemConfig.upsert({
      where: { key: 'data_retention' },
      update: {},
      create: {
        key: 'data_retention',
        value: {
          video_metrics_days: 90,
          task_logs_days: 30
        },
        description: '数据保留期限',
        isPublic: false
      }
    }),
    prisma.systemConfig.upsert({
      where: { key: 'api_settings' },
      update: {},
      create: {
        key: 'api_settings',
        value: {
          timeout: 30000,
          retry_attempts: 3,
          rate_limit_window: 3600
        },
        description: 'API设置',
        isPublic: false
      }
    })
  ])

  // 创建测试用户（仅在开发环境中）
  if (process.env.NODE_ENV === 'development') {
    logger.info('Creating test user...')
    const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.default.hash('password123', 12)

    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        passwordHash,
        planType: 'pro',
        apiQuota: 5000,
        status: 'active'
      }
    })

    logger.info('Test user created:', { id: testUser.id, email: testUser.email })
  }

  logger.info('Database seeding completed successfully')
  logger.info(`Created ${platforms.length} platforms and ${configs.length} system configs`)
}

main()
  .catch((e) => {
    logger.error('Database seeding failed:', { error: e.message, stack: e.stack })
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })