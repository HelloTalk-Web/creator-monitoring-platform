import cron from 'node-cron'
import { logger } from '../utils/logger'
import { db } from '../database/db'
import { creatorAccounts } from '../database/schema'
import { scraperManager } from '../../modules/scrapers/manager/scraper.manager'
import { eq, or, isNull } from 'drizzle-orm'

/**
 * 视频数据自动刷新调度器
 *
 * 功能：
 * 1. 定期刷新所有活跃账号的视频数据
 * 2. 支持配置刷新频率
 * 3. 避免并发过高导致API限流
 * 4. 自动记录刷新日志
 */
export class VideoRefreshScheduler {
  private isRunning = false
  private cronJob: cron.ScheduledTask | null = null

  /**
   * 启动定时任务
   * @param schedule cron表达式，默认每天凌晨2点执行
   */
  start(schedule: string = '0 2 * * *') {
    if (this.cronJob) {
      logger.warn('Video refresh scheduler is already running')
      return
    }

    this.cronJob = cron.schedule(schedule, async () => {
      await this.refreshAllVideos()
    }, {
      timezone: 'Asia/Shanghai'
    })

    logger.info('Video refresh scheduler started', {
      schedule,
      timezone: 'Asia/Shanghai'
    })
  }

  /**
   * 停止定时任务
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop()
      this.cronJob = null
      logger.info('Video refresh scheduler stopped')
    }
  }

  /**
   * 手动触发刷新所有视频
   */
  async refreshAllVideos(): Promise<{
    success: boolean
    totalAccounts: number
    successCount: number
    failedCount: number
    totalVideosUpdated: number
  }> {
    if (this.isRunning) {
      logger.warn('Video refresh is already running, skipping this cycle')
      return {
        success: false,
        totalAccounts: 0,
        successCount: 0,
        failedCount: 0,
        totalVideosUpdated: 0
      }
    }

    this.isRunning = true
    const startTime = Date.now()
    let successCount = 0
    let failedCount = 0
    let totalVideosUpdated = 0

    try {
      logger.info('Starting scheduled video refresh for all accounts')

      // 获取所有活跃的创作者账号
      const accounts = await db
        .select()
        .from(creatorAccounts)
        .where(
          or(
            eq(creatorAccounts.status, 'active'),
            isNull(creatorAccounts.status)
          )
        )

      logger.info(`Found ${accounts.length} active accounts to refresh`)

      // 逐个刷新账号，避免并发过高
      for (const account of accounts) {
        try {
          logger.info(`Refreshing account: ${account.displayName} (${account.username})`)

          // 使用爬虫管理器重新抓取数据
          const result = await scraperManager.scrapeAndStoreCreatorAccount({
            url: account.profileUrl,
            userId: account.userId
          })

          totalVideosUpdated += result.videosCount
          successCount++

          logger.info(`Account refreshed successfully: ${account.displayName}`, {
            accountId: account.id,
            videosCount: result.videosCount
          })

          // 等待一段时间，避免请求过快
          await this.sleep(2000) // 2秒延迟
        } catch (error) {
          failedCount++
          logger.error(`Failed to refresh account: ${account.displayName}`, {
            accountId: account.id,
            error: (error as Error).message
          })
        }
      }

      const duration = Date.now() - startTime
      logger.info('Scheduled video refresh completed', {
        totalAccounts: accounts.length,
        successCount,
        failedCount,
        totalVideosUpdated,
        duration: `${(duration / 1000).toFixed(2)}s`
      })

      return {
        success: true,
        totalAccounts: accounts.length,
        successCount,
        failedCount,
        totalVideosUpdated
      }
    } catch (error) {
      logger.error('Scheduled video refresh failed', {
        error: (error as Error).message,
        stack: (error as Error).stack
      })

      return {
        success: false,
        totalAccounts: 0,
        successCount,
        failedCount,
        totalVideosUpdated
      }
    } finally {
      this.isRunning = false
    }
  }

  /**
   * 刷新单个账号的视频数据
   */
  async refreshAccount(accountId: number): Promise<{
    success: boolean
    videosUpdated: number
    message: string
  }> {
    try {
      // 获取账号信息
      const accounts = await db
        .select()
        .from(creatorAccounts)
        .where(eq(creatorAccounts.id, accountId))
        .limit(1)

      if (accounts.length === 0) {
        throw new Error(`Account ${accountId} not found`)
      }

      const account = accounts[0]

      logger.info(`Manually refreshing account: ${account.displayName}`)

      // 使用爬虫管理器重新抓取数据
      const result = await scraperManager.scrapeAndStoreCreatorAccount({
        url: account.profileUrl,
        userId: account.userId
      })

      logger.info(`Account refreshed successfully: ${account.displayName}`, {
        accountId: account.id,
        videosCount: result.videosCount
      })

      return {
        success: true,
        videosUpdated: result.videosCount,
        message: `成功刷新账号 ${account.displayName}，更新了 ${result.videosCount} 个视频`
      }
    } catch (error) {
      logger.error(`Failed to refresh account ${accountId}`, {
        error: (error as Error).message
      })

      return {
        success: false,
        videosUpdated: 0,
        message: `刷新失败: ${(error as Error).message}`
      }
    }
  }

  /**
   * 获取调度器状态
   */
  getStatus(): {
    isScheduled: boolean
    isRunning: boolean
  } {
    return {
      isScheduled: this.cronJob !== null,
      isRunning: this.isRunning
    }
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 导出单例
export const videoRefreshScheduler = new VideoRefreshScheduler()
