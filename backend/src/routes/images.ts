import { Router, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { db } from '../shared/database/db';
import { creatorAccounts, videos } from '../shared/database/schema';
import { ImageStorageService } from '../services/ImageStorageService';

const router = Router();
const imageService = new ImageStorageService();

// 占位图路径
const PLACEHOLDER_AVATAR = path.join(__dirname, '../../static/images/placeholders/avatar-default.svg');
const PLACEHOLDER_THUMBNAIL = path.join(__dirname, '../../static/images/placeholders/video-default.svg');

/**
 * GET /api/images/:type/:id
 * 统一图片访问接口
 *
 * @param type - 图片类型: avatar | thumbnail
 * @param id - 实体ID (账号ID或视频ID)
 */
router.get('/:type/:id', async (req: Request, res: Response) => {
  const startTime = Date.now(); // 性能监控: 记录开始时间

  try {
    const { type, id } = req.params;

    // 验证图片类型
    if (type !== 'avatar' && type !== 'thumbnail') {
      return res.status(400).json({
        error: 'InvalidType',
        message: 'Type must be "avatar" or "thumbnail"'
      });
    }

    // 验证ID格式
    const entityId = parseInt(id, 10);
    if (isNaN(entityId)) {
      return res.status(400).json({
        error: 'InvalidId',
        message: 'ID must be a valid integer'
      });
    }

    // 查询实体获取图片URL
    let originalUrl: string | null = null;

    if (type === 'avatar') {
      const account = await db
        .select()
        .from(creatorAccounts)
        .where(eq(creatorAccounts.id, entityId))
        .limit(1);

      if (!account[0]) {
        return res.status(404).json({
          error: 'NotFound',
          message: `Account with ID ${entityId} not found`
        });
      }

      originalUrl = account[0].avatarUrl;
    } else {
      const video = await db
        .select()
        .from(videos)
        .where(eq(videos.id, entityId))
        .limit(1);

      if (!video[0]) {
        return res.status(404).json({
          error: 'NotFound',
          message: `Video with ID ${entityId} not found`
        });
      }

      originalUrl = video[0].thumbnailUrl;
    }

    // 如果没有图片URL,返回占位图
    if (!originalUrl) {
      const placeholderPath = type === 'avatar' ? PLACEHOLDER_AVATAR : PLACEHOLDER_THUMBNAIL;
      try {
        const placeholderExists = await fs.access(placeholderPath).then(() => true).catch(() => false);
        if (placeholderExists) {
          return res.sendFile(placeholderPath);
        } else {
          return res.status(404).json({
            error: 'NoImage',
            message: 'No image URL available and placeholder not found'
          });
        }
      } catch (error) {
        return res.status(500).json({
          error: 'ServerError',
          message: 'Failed to serve placeholder image'
        });
      }
    }

    // 获取图片访问URL (本地路径或代理URL)
    const imageUrl = await imageService.getImageUrl(originalUrl, type);

    // 如果是本地路径,直接返回文件
    if (imageUrl.startsWith('/') || imageUrl.startsWith('./')) {
      const fullPath = path.isAbsolute(imageUrl)
        ? imageUrl
        : path.join(__dirname, '../../', imageUrl);

      try {
        const fileExists = await fs.access(fullPath).then(() => true).catch(() => false);
        if (fileExists) {
          const responseTime = Date.now() - startTime;
          console.log(`[Image] 本地文件响应: ${type}/${id} (${responseTime}ms)`);
          return res.sendFile(fullPath);
        } else {
          // 文件不存在,降级到占位图
          const placeholderPath = type === 'avatar' ? PLACEHOLDER_AVATAR : PLACEHOLDER_THUMBNAIL;
          const responseTime = Date.now() - startTime;
          console.warn(`[Image] 本地文件缺失,使用占位图: ${type}/${id} (${responseTime}ms)`);
          return res.sendFile(placeholderPath);
        }
      } catch (error) {
        // 降级到占位图
        const placeholderPath = type === 'avatar' ? PLACEHOLDER_AVATAR : PLACEHOLDER_THUMBNAIL;
        const responseTime = Date.now() - startTime;
        console.error(`[Image] 错误,使用占位图: ${type}/${id} (${responseTime}ms)`, error);
        return res.sendFile(placeholderPath);
      }
    }

    // 如果是代理URL,重定向
    const responseTime = Date.now() - startTime;
    console.log(`[Image] 代理重定向: ${type}/${id} (${responseTime}ms)`);
    return res.redirect(302, imageUrl);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[Image] 服务器错误: ${responseTime}ms`, error);
    return res.status(500).json({
      error: 'ServerError',
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/images/stats
 * 获取图片存储统计信息
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await imageService.getStats();

    return res.json({
      totalImages: stats.total,
      byStatus: {
        pending: stats.pending,
        completed: stats.completed,
        failed: stats.failed
      },
      cacheHitRate: stats.total > 0 ? stats.completed / stats.total : 0,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({
      error: 'ServerError',
      message: 'Failed to fetch statistics'
    });
  }
});

export default router;
