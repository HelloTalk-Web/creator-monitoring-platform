import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import cron from 'node-cron';
import PQueue from 'p-queue';
import { eq, sql } from 'drizzle-orm';
import { db } from '../shared/database/db';
import { imageMetadata } from '../shared/database/schema';
import { StorageMonitorService } from '../services/StorageMonitorService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 下载配置
const DOWNLOAD_DIR = path.join(__dirname, '../../static/images/downloaded');
const CONCURRENCY_LIMIT = 5;
const BATCH_SIZE = 100; // 每次处理的待下载图片数量
const RETRY_DELAYS = [60 * 1000, 5 * 60 * 1000, 30 * 60 * 1000]; // 1min, 5min, 30min

// p-queue 实例
const downloadQueue = new PQueue({ concurrency: CONCURRENCY_LIMIT });

// 存储监控服务实例
const storageMonitor = new StorageMonitorService();

/**
 * 从 MIME 类型获取文件扩展名
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/bmp': '.bmp',
    'image/x-icon': '.ico'
  };

  return mimeMap[mimeType.toLowerCase()] || '.jpg'; // 默认 .jpg
}

/**
 * 计算下一次重试时间
 */
function calculateNextRetry(retryCount: number): Date {
  const delay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
  return new Date(Date.now() + delay);
}

/**
 * 下载单个图片
 */
async function downloadImage(record: {
  id: number;
  originalUrl: string;
  urlHash: string;
  retryCount: number;
}): Promise<void> {
  try {
    console.log(`[ImageDownloadWorker] 开始下载: ${record.originalUrl}`);

    // 更新状态为 downloading
    await db
      .update(imageMetadata)
      .set({
        downloadStatus: 'downloading',
        updatedAt: new Date()
      })
      .where(eq(imageMetadata.id, record.id));

    // 使用 axios stream 下载图片
    const response = await axios.get(record.originalUrl, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30s 超时
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    // 检测 MIME 类型
    const contentType = response.headers['content-type'] || 'image/jpeg';
    const extension = getExtensionFromMimeType(contentType);

    // 生成本地文件路径: <url_hash><extension>
    const fileName = `${record.urlHash}${extension}`;
    const localPath = path.join(DOWNLOAD_DIR, fileName);

    // 确保目录存在
    await fs.mkdir(DOWNLOAD_DIR, { recursive: true });

    // 保存文件
    await fs.writeFile(localPath, response.data);

    // 获取文件大小
    const stats = await fs.stat(localPath);

    // 更新数据库状态为 completed
    await db
      .update(imageMetadata)
      .set({
        downloadStatus: 'completed',
        localPath: `static/images/downloaded/${fileName}`,
        fileSize: stats.size,
        mimeType: contentType,
        lastError: null,
        nextRetryAt: null,
        updatedAt: new Date()
      })
      .where(eq(imageMetadata.id, record.id));

    console.log(`[ImageDownloadWorker] 下载成功: ${fileName} (${stats.size} bytes)`);
  } catch (error) {
    // 下载失败,记录错误并更新重试计数
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[ImageDownloadWorker] 下载失败: ${record.originalUrl}`, errorMessage);

    const newRetryCount = record.retryCount + 1;
    const maxRetries = 3;

    if (newRetryCount >= maxRetries) {
      // 超过最大重试次数,标记为 failed
      await db
        .update(imageMetadata)
        .set({
          downloadStatus: 'failed',
          retryCount: newRetryCount,
          lastError: errorMessage,
          nextRetryAt: null,
          updatedAt: new Date()
        })
        .where(eq(imageMetadata.id, record.id));

      console.error(`[ImageDownloadWorker] 已达到最大重试次数,标记为失败: ${record.originalUrl}`);
    } else {
      // 计算下次重试时间 (指数退避)
      const nextRetry = calculateNextRetry(record.retryCount);

      await db
        .update(imageMetadata)
        .set({
          downloadStatus: 'pending',
          retryCount: newRetryCount,
          lastError: errorMessage,
          nextRetryAt: nextRetry,
          updatedAt: new Date()
        })
        .where(eq(imageMetadata.id, record.id));

      console.log(`[ImageDownloadWorker] 将在 ${nextRetry.toISOString()} 重试 (第 ${newRetryCount} 次)`);
    }
  }
}

/**
 * 获取待下载的图片列表
 */
async function getPendingDownloads(): Promise<Array<{
  id: number;
  originalUrl: string;
  urlHash: string;
  retryCount: number;
}>> {
  const now = new Date();

  const results = await db
    .select({
      id: imageMetadata.id,
      originalUrl: imageMetadata.originalUrl,
      urlHash: imageMetadata.urlHash,
      retryCount: imageMetadata.retryCount
    })
    .from(imageMetadata)
    .where(
      sql`(
        ${imageMetadata.downloadStatus} = 'pending'
        AND (
          ${imageMetadata.nextRetryAt} IS NULL
          OR ${imageMetadata.nextRetryAt} <= ${now}
        )
      )`
    )
    .limit(BATCH_SIZE);

  return results;
}

/**
 * 处理下载队列
 */
async function processDownloadQueue() {
  try {
    console.log('[ImageDownloadWorker] 开始检查待下载图片...');

    // 检查存储空间是否充足
    if (storageMonitor.shouldPauseDownloads()) {
      console.warn('[ImageDownloadWorker] 存储空间不足,已暂停下载任务');
      return;
    }

    const pendingImages = await getPendingDownloads();

    if (pendingImages.length === 0) {
      console.log('[ImageDownloadWorker] 无待下载图片');
      return;
    }

    console.log(`[ImageDownloadWorker] 找到 ${pendingImages.length} 张待下载图片,添加到队列`);

    // 将所有下载任务添加到 p-queue
    for (const image of pendingImages) {
      downloadQueue.add(() => downloadImage(image));
    }

    // 等待队列完成
    await downloadQueue.onIdle();

    console.log('[ImageDownloadWorker] 本轮下载完成');
  } catch (error) {
    console.error('[ImageDownloadWorker] 处理队列时出错:', error);
  }
}

/**
 * 启动下载 Worker (每 10 分钟执行一次)
 */
export function startImageDownloadWorker() {
  console.log('[ImageDownloadWorker] Worker 已启动,每 10 分钟检查一次待下载图片');

  // 立即执行一次下载任务
  processDownloadQueue();

  // 立即执行一次存储监控
  storageMonitor.monitorStorage();

  // 设置定时任务: 下载队列 (每 10 分钟)
  cron.schedule('*/10 * * * *', () => {
    console.log('[ImageDownloadWorker] 定时任务触发 - 下载队列');
    processDownloadQueue();
  });

  // 设置定时任务: 存储监控 (每小时)
  cron.schedule('0 * * * *', () => {
    console.log('[ImageDownloadWorker] 定时任务触发 - 存储监控');
    storageMonitor.monitorStorage();
  });
}

/**
 * 优雅关闭队列
 */
export async function shutdownImageDownloadWorker() {
  console.log('[ImageDownloadWorker] 正在优雅关闭下载队列...');

  // 等待队列中的任务完成
  await downloadQueue.onIdle();

  // 清空队列
  downloadQueue.clear();

  console.log('[ImageDownloadWorker] 下载队列已关闭');
}
