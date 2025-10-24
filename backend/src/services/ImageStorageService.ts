import crypto from 'crypto';
import { eq, sql } from 'drizzle-orm';
import { db } from '../shared/database/db';
import { imageMetadata } from '../shared/database/schema';
import type { ImageMetadata } from '../shared/database/schema';
import { imageDownloadService } from '../shared/services/ImageDownloadService';
import type { UploadResult } from '../modules/openlist/types';
import openlistConfig from '../config/openlist.config';

export type ImageAccessResult =
  | { type: 'openlist'; url: string }
  | { type: 'redirect'; url: string }
  | { type: 'file'; path: string };

export class ImageStorageService {
  /**
   * 获取图片访问URL
   * 工作流程:
   * 1. 检查是否已上传到OpenList → 返回OpenList代理URL
   * 2. 如果未上传 → 下载并上传到OpenList → 返回代理URL
   * 3. 如果失败 → 降级到传统代理
   */
  async getImageUrl(
    originalUrl: string,
    type: 'avatar' | 'thumbnail',
    entityId: number
  ): Promise<ImageAccessResult> {
    const fallback: ImageAccessResult = {
      type: 'redirect',
      url: `/api/image-proxy?url=${encodeURIComponent(originalUrl)}`
    };

    if (!originalUrl) {
      return fallback;
    }

    const directOpenListUrl = this.extractOpenListRaw(originalUrl);
    if (directOpenListUrl) {
      return { type: 'openlist', url: directOpenListUrl };
    }

    const urlHash = crypto.createHash('md5').update(originalUrl).digest('hex');

    let metadata = await this.findByHash(urlHash);

    if (metadata?.downloadStatus === 'completed' && metadata.localPath) {
      await this.recordAccess(metadata.id);

      const storedOpenListUrl = this.extractOpenListRaw(metadata.localPath);
      if (storedOpenListUrl) {
        return { type: 'openlist', url: storedOpenListUrl };
      }

      if (this.isLocalPath(metadata.localPath)) {
        return { type: 'file', path: metadata.localPath };
      }

      return { type: 'redirect', url: metadata.localPath };
    }

    if (!metadata) {
      await this.createMetadata(originalUrl, urlHash);
      metadata = await this.findByHash(urlHash);
    }

    if (!metadata) {
      return fallback;
    }

    await this.markInProgress(metadata.id);

    const uploadResult = await this.downloadAndUpload(originalUrl, type, entityId);

    if (uploadResult) {
      await this.markCompleted(metadata.id, uploadResult);
      return { type: 'openlist', url: uploadResult.url };
    }

    await this.markFailed(metadata.id, `Failed to upload ${type} ${entityId}`);
    return fallback;
  }

  /**
   * 创建图片元数据
   */
  private async createMetadata(originalUrl: string, urlHash: string) {
    await db.insert(imageMetadata).values({
      originalUrl,
      urlHash,
      downloadStatus: 'pending'
    }).onConflictDoNothing();
  }

  private async findByHash(urlHash: string): Promise<ImageMetadata | null> {
    const [record] = await db
      .select()
      .from(imageMetadata)
      .where(eq(imageMetadata.urlHash, urlHash))
      .limit(1);

    return record ?? null;
  }

  private async downloadAndUpload(
    originalUrl: string,
    type: 'avatar' | 'thumbnail',
    entityId: number
  ): Promise<UploadResult | null> {
    if (type === 'avatar') {
      return imageDownloadService.downloadAvatar(originalUrl, entityId);
    }

    return imageDownloadService.downloadThumbnail(originalUrl, entityId);
  }

  private async markInProgress(imageId: number) {
    const now = new Date();

    await db
      .update(imageMetadata)
      .set({
        downloadStatus: 'downloading',
        updatedAt: now
      })
      .where(eq(imageMetadata.id, imageId));
  }

  private async markCompleted(imageId: number, result: UploadResult) {
    const now = new Date();

    await db
      .update(imageMetadata)
      .set({
        downloadStatus: 'completed',
        localPath: result.url,
        fileSize: result.size ?? null,
        retryCount: 0,
        lastError: null,
        accessCount: 1,
        firstAccessedAt: now,
        lastAccessedAt: now,
        nextRetryAt: null,
        updatedAt: now
      })
      .where(eq(imageMetadata.id, imageId));
  }

  private async markFailed(imageId: number, message: string) {
    const now = new Date();

    await db
      .update(imageMetadata)
      .set({
        downloadStatus: 'failed',
        retryCount: sql`${imageMetadata.retryCount} + 1`,
        lastError: message,
        nextRetryAt: null,
        updatedAt: now
      })
      .where(eq(imageMetadata.id, imageId));
  }

  /**
   * 记录访问统计
   */
  private async recordAccess(imageId: number) {
    const now = new Date();

    await db
      .update(imageMetadata)
      .set({
        accessCount: sql`${imageMetadata.accessCount} + 1`,
        lastAccessedAt: now,
        firstAccessedAt: sql`COALESCE(${imageMetadata.firstAccessedAt}, now())`
      })
      .where(eq(imageMetadata.id, imageId));
  }

  /**
   * 获取存储统计信息
   */
  async getStats() {
    const allRecords = await db.select().from(imageMetadata);

    const total = allRecords.length;
    const completed = allRecords.filter(r => r.downloadStatus === 'completed').length;
    const pending = allRecords.filter(r => r.downloadStatus === 'pending').length;
    const failed = allRecords.filter(r => r.downloadStatus === 'failed').length;

    return {
      total,
      completed,
      pending,
      failed
    };
  }

  private extractOpenListRaw(url: string | null | undefined): string | null {
    if (!url) {
      return null;
    }

    if (this.isOpenListUrl(url)) {
      return url;
    }

    if (url.startsWith('/api/openlist-proxy')) {
      try {
        const parsed = new URL(url, 'http://localhost');
        const raw = parsed.searchParams.get('url');
        return raw ?? null;
      } catch {
        return null;
      }
    }

    return null;
  }

  private isOpenListUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const base = new URL(openlistConfig.baseURL);
      return parsed.host === base.host;
    } catch {
      return false;
    }
  }

  private isLocalPath(pathValue: string): boolean {
    return pathValue.startsWith('/') || pathValue.startsWith('./');
  }
}
