import { videoEvents, VideoUpdatedEvent } from '../../../shared/events/video.events'
import { videoMetricsHistoryService } from '../service/video-metrics-history.service'
import { logger } from '../../../shared/utils/logger'

/**
 * 视频历史快照监听器
 *
 * 功能: 监听视频更新事件,当视频指标发生变化时自动保存历史快照
 * 触发时机: 视频数据更新后
 * 执行方式: 异步执行,不阻塞主业务流程
 */
export class VideoHistoryListener {
  /**
   * 注册监听器
   */
  register(): void {
    videoEvents.onVideoUpdated(this.handleVideoUpdated.bind(this))
    logger.info('VideoHistoryListener registered')
  }

  /**
   * 处理视频更新事件
   */
  private async handleVideoUpdated(event: VideoUpdatedEvent): Promise<void> {
    try {
      // 检测指标是否有实际变化
      const hasChanges = this.detectMetricsChanges(event.oldData, event.newData)

      if (!hasChanges) {
        logger.debug(`视频 ${event.videoId} 指标无变化,跳过历史记录`)
        return
      }

      // 异步保存历史快照(带重试机制)
      await this.saveSnapshotWithRetry(event.videoId)

      logger.info(`视频 ${event.videoId} 历史快照已保存`, {
        videoId: event.videoId,
        oldData: event.oldData,
        newData: event.newData
      })
    } catch (error) {
      // 记录错误但不抛出,避免影响主业务
      logger.error(`保存视频 ${event.videoId} 历史快照失败`, {
        videoId: event.videoId,
        error: (error as Error).message,
        stack: (error as Error).stack
      })
    }
  }

  /**
   * 检测指标变化
   */
  private detectMetricsChanges(
    oldData: VideoUpdatedEvent['oldData'],
    newData: VideoUpdatedEvent['newData']
  ): boolean {
    return (
      oldData.viewCount !== newData.viewCount ||
      oldData.likeCount !== newData.likeCount ||
      oldData.commentCount !== newData.commentCount ||
      oldData.shareCount !== newData.shareCount
    )
  }

  /**
   * 保存快照(带重试机制)
   */
  private async saveSnapshotWithRetry(
    videoId: number,
    maxRetries = 3
  ): Promise<void> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await videoMetricsHistoryService.createSnapshots([videoId])
        return // 成功则返回
      } catch (error) {
        lastError = error as Error
        logger.warn(`保存历史快照失败,重试 ${attempt}/${maxRetries}`, {
          videoId,
          attempt,
          error: lastError.message
        })

        // 等待一段时间后重试(指数退避)
        if (attempt < maxRetries) {
          await this.sleep(Math.pow(2, attempt) * 1000) // 2s, 4s, 8s
        }
      }
    }

    // 所有重试都失败,抛出错误
    throw lastError || new Error('保存历史快照失败')
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 导出单例
export const videoHistoryListener = new VideoHistoryListener()
