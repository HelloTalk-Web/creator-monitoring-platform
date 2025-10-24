import { Router, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../shared/database/db';
import { creatorAccounts, videos } from '../shared/database/schema';
import { ImageStorageService, type ImageAccessResult } from '../services/ImageStorageService';
import { createChildLogger } from '../shared/utils/logger';

const router = Router();
const imageService = new ImageStorageService();
const imageLogger = createChildLogger('ImagesRoute');

// ESM模式下获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    const imageAccess = await imageService.getImageUrl(originalUrl, type, entityId);

    switch (imageAccess.type) {
      case 'file': {
        const fullPath = resolveFilePath(imageAccess.path);

        try {
          const fileExists = await fs.access(fullPath).then(() => true).catch(() => false);
          if (fileExists) {
            const responseTime = Date.now() - startTime;
            imageLogger.info(`[Image] 本地文件响应: ${type}/${id} (${responseTime}ms)`);
            return res.sendFile(fullPath);
          }

          const placeholderPath = type === 'avatar' ? PLACEHOLDER_AVATAR : PLACEHOLDER_THUMBNAIL;
          const responseTime = Date.now() - startTime;
          imageLogger.warn(`[Image] 本地文件缺失,使用占位图: ${type}/${id} (${responseTime}ms)`);
          return res.sendFile(placeholderPath);
        } catch (error) {
          const placeholderPath = type === 'avatar' ? PLACEHOLDER_AVATAR : PLACEHOLDER_THUMBNAIL;
          const responseTime = Date.now() - startTime;
          imageLogger.error(`[Image] 本地文件异常,使用占位图: ${type}/${id} (${responseTime}ms)`, error);
          return res.sendFile(placeholderPath);
        }
      }

      case 'openlist': {
        const responseTime = Date.now() - startTime;
        imageLogger.info(`[Image] OpenList流式代理: ${type}/${id} (${responseTime}ms)`);
        await streamOpenListImage(imageAccess.url, res);
        return;
      }

      case 'redirect':
      default: {
        const responseTime = Date.now() - startTime;
        imageLogger.info(`[Image] 代理重定向: ${type}/${id} → ${imageAccess.url.substring(0, 100)} (${responseTime}ms)`);
        return res.redirect(302, imageAccess.url);
      }
    }

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

function resolveFilePath(pathValue: string): string {
  if (pathValue.startsWith('/')) {
    return path.join(__dirname, '../../', pathValue.replace(/^\/+/, ''));
  }

  if (pathValue.startsWith('./')) {
    return path.join(__dirname, '../../', pathValue.slice(2));
  }

  return path.join(__dirname, '../../', pathValue);
}

async function streamOpenListImage(url: string, res: Response) {
  try {
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 30000,
      validateStatus: status => status < 400
    });

    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    } else {
      const ext = url.split('.').pop()?.toLowerCase();
      const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml'
      };
      res.setHeader('Content-Type', mimeTypes[ext || 'jpg'] || 'image/jpeg');
    }

    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }

    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    response.data.pipe(res);
  } catch (error) {
    imageLogger.error('代理OpenList图片失败', error);

    if (!res.headersSent) {
      res.status(500).json({
        error: 'ProxyError',
        message: 'Failed to proxy image from OpenList',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
