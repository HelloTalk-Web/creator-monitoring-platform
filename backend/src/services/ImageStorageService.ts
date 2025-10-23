import crypto from 'crypto';
import { eq, sql } from 'drizzle-orm';
import { db } from '../shared/database/db';
import { imageMetadata } from '../shared/database/schema';

export class ImageStorageService {
  /**
   * 获取图片访问URL
   * 自动处理: 本地化检查 → 代理下载 → 占位图降级
   */
  async getImageUrl(
    originalUrl: string,
    type: 'avatar' | 'thumbnail'
  ): Promise<string> {
    const urlHash = crypto.createHash('md5').update(originalUrl).digest('hex');

    // 查询元数据
    const metadata = await db
      .select()
      .from(imageMetadata)
      .where(eq(imageMetadata.urlHash, urlHash))
      .limit(1);

    // 已本地化 → 返回本地路径
    if (metadata[0]?.downloadStatus === 'completed' && metadata[0].localPath) {
      await this.recordAccess(metadata[0].id);
      return metadata[0].localPath;
    }

    // 未本地化 → 创建元数据并排队下载
    if (!metadata[0]) {
      await this.createMetadata(originalUrl, urlHash);
    }

    // 降级到代理URL
    return `/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;
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

  /**
   * 记录访问统计
   */
  private async recordAccess(imageId: number) {
    await db
      .update(imageMetadata)
      .set({
        accessCount: sql`${imageMetadata.accessCount} + 1`,
        lastAccessedAt: new Date()
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
}
