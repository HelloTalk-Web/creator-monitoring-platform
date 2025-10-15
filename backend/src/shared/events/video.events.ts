import { EventEmitter } from 'events'

/**
 * 视频数据变化事件
 */
export interface VideoUpdatedEvent {
  videoId: number
  oldData: {
    viewCount: number | null
    likeCount: number | null
    commentCount: number | null
    shareCount: number | null
  }
  newData: {
    viewCount: number | null
    likeCount: number | null
    commentCount: number | null
    shareCount: number | null
  }
  updatedAt: Date
}

/**
 * 视频事件发射器
 *
 * 支持的事件:
 * - 'video:updated': 视频数据更新时触发
 * - 'video:created': 新视频创建时触发
 */
class VideoEventEmitter extends EventEmitter {
  /**
   * 触发视频更新事件
   */
  emitVideoUpdated(event: VideoUpdatedEvent): void {
    // 使用 setImmediate 确保异步执行,不阻塞主业务
    setImmediate(() => {
      this.emit('video:updated', event)
    })
  }

  /**
   * 监听视频更新事件
   */
  onVideoUpdated(listener: (event: VideoUpdatedEvent) => void | Promise<void>): void {
    this.on('video:updated', listener)
  }
}

// 导出单例
export const videoEvents = new VideoEventEmitter()
