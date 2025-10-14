/**
 * 更新现有视频数据脚本
 * 功能：
 * 1. 从视频标题中提取hashtag标签
 * 2. 从metadata中提取JPEG格式的封面URL
 */

import { db } from '../src/shared/database/db'
import { videos } from '../src/shared/database/schema'
import { logger } from '../src/shared/utils/logger'
import { eq } from 'drizzle-orm'

/**
 * 从文本中提取hashtag标签
 */
function extractHashtags(text: string): string[] {
  if (!text) return []

  // 匹配 #标签 格式（支持字母、数字、下划线和中文）
  const hashtagRegex = /#([a-zA-Z0-9_\u4e00-\u9fff]+)/g
  const matches = text.matchAll(hashtagRegex)

  const tags: string[] = []
  for (const match of matches) {
    if (match[1]) {
      tags.push(match[1])
    }
  }

  // 去重并返回
  return Array.from(new Set(tags))
}

/**
 * 从metadata中提取JPEG格式的封面URL
 */
function extractJpegThumbnailUrl(metadata: any): string | null {
  if (!metadata) return null

  const video = metadata.video || {}
  const coverUrlList = video.cover?.url_list || video.download_addr?.url_list || []

  if (coverUrlList.length >= 3) {
    // 第3个URL通常是JPEG格式，浏览器兼容性最好
    return coverUrlList[2]
  } else if (coverUrlList.length > 0) {
    // 如果没有第3个URL，使用第一个并尝试转换为JPEG
    return coverUrlList[0].replace(/\.heic\?/i, '.jpeg?')
  }

  return null
}

/**
 * 主函数
 */
async function main() {
  try {
    logger.info('开始更新视频数据...')

    // 获取所有视频
    const allVideos = await db.select().from(videos)
    logger.info(`找到 ${allVideos.length} 个视频`)

    let updatedCount = 0
    let skippedCount = 0

    for (const video of allVideos) {
      // 提取标签
      const extractedTags = extractHashtags(video.title || '')

      // 提取JPEG封面URL
      const jpegThumbnailUrl = extractJpegThumbnailUrl(video.metadata)

      // 判断是否需要更新
      const needsTagUpdate = extractedTags.length > 0 && (!video.tags || (video.tags as string[]).length === 0)
      const needsThumbnailUpdate = jpegThumbnailUrl && jpegThumbnailUrl !== video.thumbnailUrl

      if (needsTagUpdate || needsThumbnailUpdate) {
        const updateData: any = {}

        if (needsTagUpdate) {
          updateData.tags = extractedTags
          logger.info(`视频 ${video.id}: 提取到 ${extractedTags.length} 个标签: ${extractedTags.join(', ')}`)
        }

        if (needsThumbnailUpdate) {
          updateData.thumbnailUrl = jpegThumbnailUrl
          logger.info(`视频 ${video.id}: 更新封面URL为JPEG格式`)
        }

        // 更新数据库
        await db
          .update(videos)
          .set(updateData)
          .where(eq(videos.id, video.id))

        updatedCount++
      } else {
        skippedCount++
      }
    }

    logger.info('更新完成！')
    logger.info(`成功更新: ${updatedCount} 个视频`)
    logger.info(`跳过: ${skippedCount} 个视频`)

    process.exit(0)
  } catch (error) {
    logger.error('更新失败:', error)
    process.exit(1)
  }
}

// 运行脚本
main()
