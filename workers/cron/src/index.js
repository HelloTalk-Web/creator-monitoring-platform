// 定时任务 Worker
import { refreshVideoData } from '../api/src/handlers/scrape.js'

export default {
  async scheduled(event, env, ctx) {
    console.log('定时任务开始执行', {
      scheduledTime: event.scheduledTime,
      cron: event.cron
    })

    try {
      // 执行视频数据刷新
      await refreshVideoData(env)

      console.log('定时任务执行完成')
    } catch (error) {
      console.error('定时任务执行失败:', error)
    }
  }
}