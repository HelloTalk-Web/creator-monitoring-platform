import { videoEvents } from '../events/video.events'
import { logger } from '../utils/logger'

/**
 * 视频变化追踪装饰器
 *
 * 使用AOP思想,在数据库更新方法执行后自动触发事件
 * 业务代码无需感知历史快照的存在
 *
 * 使用方式:
 * @TrackVideoChanges()
 * async updateVideo(videoId: number, newData: any) {
 *   // 业务逻辑
 * }
 */
export function TrackVideoChanges() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      // 执行原始方法
      const result = await originalMethod.apply(this, args)

      // 方法执行成功后,尝试提取并触发事件
      try {
        // 从方法上下文中提取视频变更信息
        // 这里需要一个约定:被装饰的方法需要返回包含变更信息的对象
        if (result && result.videoUpdates && Array.isArray(result.videoUpdates)) {
          for (const update of result.videoUpdates) {
            if (update.videoId && update.oldData && update.newData) {
              videoEvents.emitVideoUpdated({
                videoId: update.videoId,
                oldData: update.oldData,
                newData: update.newData,
                updatedAt: new Date()
              })

              logger.debug('Video change tracked via decorator', {
                videoId: update.videoId,
                method: propertyKey
              })
            }
          }
        }
      } catch (error) {
        // 装饰器不应该影响主业务流程
        logger.warn('Failed to track video changes', {
          method: propertyKey,
          error: (error as Error).message
        })
      }

      return result
    }

    return descriptor
  }
}
