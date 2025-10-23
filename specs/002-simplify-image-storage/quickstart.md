# Quickstart: 简化图片存储加载机制

**Branch**: `002-simplify-image-storage` | **Date**: 2025-10-23
**For Developers**: 快速上手新的统一图片存储系统

## Overview

这个快速指南帮助你理解和使用新的统一图片存储机制。新系统简化了原有的多字段存储方式，提供统一的API和自动化的图片本地化能力。

### 核心概念

**简化前** (旧系统):
```typescript
// 数据库存储
avatarUrl: "https://example.com/avatar.jpg"      // 原始URL
localAvatarUrl: "/static/images/avatars/..."    // 本地路径

// 前端逻辑
const url = localAvatarUrl || getProxyUrl(avatarUrl);  // 复杂判断
```

**简化后** (新系统):
```typescript
// 数据库存储
avatarUrl: "https://example.com/avatar.jpg"      // 统一标识符

// 前端逻辑
const url = `/api/images/avatar/${accountId}`;   // 统一接口
```

系统自动处理：
- 图片本地化（后台下载）
- 失败重试（指数退避）
- 占位图降级
- 访问统计

---

## Setup

### 1. 安装依赖

```bash
# Backend
cd backend
npm install vitest @vitest/ui p-queue --save-dev

# Frontend
cd frontend
npm install vitest @vitest/ui --save-dev
```

### 2. 配置测试框架

**backend/vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'dist/']
    }
  }
});
```

**frontend/vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts']
  }
});
```

### 3. 准备占位图资源

```bash
# 创建占位图目录
mkdir -p backend/static/images/placeholders

# 添加默认占位图
# - avatar-default.svg (账号头像占位图)
# - video-default.svg (视频缩略图占位图)
```

### 4. 数据库迁移准备

```bash
# 生成迁移文件
cd backend
npm run db:generate

# 查看生成的SQL
cat drizzle/migrations/*.sql
```

---

## Development Workflow

### Backend开发

#### 1. 新的数据模型

**backend/src/shared/database/schema.ts** (新增):

```typescript
import { pgTable, serial, text, varchar, bigint, integer, timestamp } from 'drizzle-orm/pg-core';

export const imageMetadata = pgTable('image_metadata', {
  id: serial('id').primaryKey(),

  // 图片标识
  originalUrl: text('original_url').notNull().unique(),
  urlHash: varchar('url_hash', { length: 32 }).notNull().unique(),

  // 存储信息
  localPath: text('local_path'),
  fileSize: bigint('file_size', { mode: 'number' }),
  mimeType: varchar('mime_type', { length: 50 }),

  // 状态追踪
  downloadStatus: varchar('download_status', { length: 20 }).notNull().default('pending'),
  retryCount: integer('retry_count').notNull().default(0),
  maxRetries: integer('max_retries').notNull().default(3),
  lastError: text('last_error'),
  nextRetryAt: timestamp('next_retry_at'),

  // 访问统计
  accessCount: bigint('access_count', { mode: 'number' }).notNull().default(0),
  lastAccessedAt: timestamp('last_accessed_at'),
  firstAccessedAt: timestamp('first_accessed_at'),

  // 时间戳
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export type ImageMetadata = typeof imageMetadata.$inferSelect;
export type NewImageMetadata = typeof imageMetadata.$inferInsert;
```

#### 2. 统一图片存储服务

**backend/src/services/ImageStorageService.ts** (新增):

```typescript
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../shared/database';
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
    const stats = await db
      .select({
        total: count(),
        completed: countIf(eq(imageMetadata.downloadStatus, 'completed')),
        pending: countIf(eq(imageMetadata.downloadStatus, 'pending')),
        failed: countIf(eq(imageMetadata.downloadStatus, 'failed'))
      })
      .from(imageMetadata);

    return stats[0];
  }
}
```

#### 3. 统一图片访问API

**backend/src/routes/images.ts** (新增):

```typescript
import { Router } from 'express';
import { ImageStorageService } from '../services/ImageStorageService';
import { db } from '../shared/database';
import { creatorAccounts, videos } from '../shared/database/schema';
import { eq } from 'drizzle-orm';

const router = Router();
const imageService = new ImageStorageService();

/**
 * GET /api/images/:type/:id
 * 统一图片访问接口
 */
router.get('/images/:type/:id', async (req, res) => {
  const { type, id } = req.params;

  try {
    // 根据类型查询实体
    let originalUrl: string | null = null;

    if (type === 'avatar') {
      const account = await db
        .select({ avatarUrl: creatorAccounts.avatarUrl })
        .from(creatorAccounts)
        .where(eq(creatorAccounts.id, parseInt(id)))
        .limit(1);
      originalUrl = account[0]?.avatarUrl || null;
    } else if (type === 'thumbnail') {
      const video = await db
        .select({ thumbnailUrl: videos.thumbnailUrl })
        .from(videos)
        .where(eq(videos.id, parseInt(id)))
        .limit(1);
      originalUrl = video[0]?.thumbnailUrl || null;
    }

    if (!originalUrl) {
      // 降级到占位图
      return res.redirect(`/static/images/placeholders/${type}-default.svg`);
    }

    // 获取最佳访问URL
    const imageUrl = await imageService.getImageUrl(originalUrl, type);

    // 重定向到实际URL
    res.redirect(imageUrl);

  } catch (error) {
    console.error('Image access error:', error);
    res.status(500).json({ error: 'Failed to access image' });
  }
});

/**
 * GET /api/images/stats
 * 获取存储统计信息
 */
router.get('/images/stats', async (req, res) => {
  try {
    const stats = await imageService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
```

#### 4. 后台下载任务

**backend/src/jobs/image-download-worker.ts** (新增):

```typescript
import cron from 'node-cron';
import PQueue from 'p-queue';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { db } from '../shared/database';
import { imageMetadata } from '../shared/database/schema';
import { eq, or, and, lt, lte } from 'drizzle-orm';

const downloadQueue = new PQueue({ concurrency: 5 });

/**
 * 每10分钟检查待下载任务
 */
cron.schedule('*/10 * * * *', async () => {
  console.log('[ImageWorker] Checking pending downloads...');

  const pendingImages = await db
    .select()
    .from(imageMetadata)
    .where(
      or(
        eq(imageMetadata.downloadStatus, 'pending'),
        and(
          eq(imageMetadata.downloadStatus, 'failed'),
          lt(imageMetadata.retryCount, imageMetadata.maxRetries),
          lte(imageMetadata.nextRetryAt, new Date())
        )
      )
    )
    .limit(100);

  console.log(`[ImageWorker] Found ${pendingImages.length} tasks`);

  for (const image of pendingImages) {
    downloadQueue.add(() => downloadImage(image));
  }
});

/**
 * 下载单个图片
 */
async function downloadImage(metadata: typeof imageMetadata.$inferSelect) {
  try {
    console.log(`[Download] Starting: ${metadata.originalUrl}`);

    // 更新状态为下载中
    await db
      .update(imageMetadata)
      .set({ downloadStatus: 'downloading' })
      .where(eq(imageMetadata.id, metadata.id));

    // 下载图片
    const response = await axios.get(metadata.originalUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    // 确定文件扩展名
    const contentType = response.headers['content-type'] || 'image/jpeg';
    const ext = contentType.split('/')[1] || 'jpg';

    // 生成本地路径 (需要根据实际业务逻辑确定type和id)
    const filename = `image_${metadata.id}.${ext}`;
    const localPath = `/static/images/downloaded/${filename}`;
    const fullPath = path.join(process.cwd(), 'static/images/downloaded', filename);

    // 保存文件
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, response.data);

    // 更新元数据
    await db
      .update(imageMetadata)
      .set({
        downloadStatus: 'completed',
        localPath,
        fileSize: response.data.length,
        mimeType: contentType,
        updatedAt: new Date()
      })
      .where(eq(imageMetadata.id, metadata.id));

    console.log(`[Download] Completed: ${metadata.originalUrl}`);

  } catch (error) {
    console.error(`[Download] Failed: ${metadata.originalUrl}`, error);

    // 计算下一次重试时间 (指数退避)
    const retryDelays = [60000, 300000, 1800000]; // 1分钟, 5分钟, 30分钟
    const nextRetryAt = new Date(Date.now() + retryDelays[metadata.retryCount] || 1800000);

    // 更新失败状态
    await db
      .update(imageMetadata)
      .set({
        downloadStatus: metadata.retryCount + 1 >= metadata.maxRetries ? 'failed' : 'pending',
        retryCount: metadata.retryCount + 1,
        lastError: error instanceof Error ? error.message : 'Unknown error',
        nextRetryAt,
        updatedAt: new Date()
      })
      .where(eq(imageMetadata.id, metadata.id));
  }
}

console.log('[ImageWorker] Started image download worker');
```

---

### Frontend开发

#### 1. 简化的工具函数

**frontend/lib/utils.ts** (修改):

```typescript
/**
 * 获取图片显示URL (简化版)
 */
export function getDisplayImageUrl(
  type: 'avatar' | 'thumbnail',
  entityId: number
): string {
  return `/api/images/${type}/${entityId}`;
}

// 使用示例
const avatarUrl = getDisplayImageUrl('avatar', account.id);
const thumbnailUrl = getDisplayImageUrl('thumbnail', video.id);
```

#### 2. 统一图片组件

**frontend/components/common/Image.tsx** (新增):

```typescript
'use client';

import { useState } from 'react';
import NextImage, { ImageProps } from 'next/image';

interface UnifiedImageProps extends Omit<ImageProps, 'src'> {
  type: 'avatar' | 'thumbnail';
  entityId: number;
}

export function UnifiedImage({ type, entityId, alt, ...props }: UnifiedImageProps) {
  const [error, setError] = useState(false);

  // 构建统一URL
  const src = error
    ? `/static/images/placeholders/${type}-default.svg`
    : `/api/images/${type}/${entityId}`;

  return (
    <NextImage
      src={src}
      alt={alt}
      onError={() => setError(true)}
      {...props}
    />
  );
}
```

#### 3. 更新现有页面

**frontend/app/accounts/page.tsx** (修改):

```typescript
// 旧代码
import { getDisplayImageUrl } from '@/lib/utils';

// 简化后
import { UnifiedImage } from '@/components/common/Image';

export default function AccountsPage() {
  return (
    <div>
      {accounts.map((account) => (
        <UnifiedImage
          key={account.id}
          type="avatar"
          entityId={account.id}
          alt={account.username}
          width={50}
          height={50}
          className="rounded-full"
        />
      ))}
    </div>
  );
}
```

---

## Database Migration

### 执行迁移

```bash
cd backend

# 1. 模拟运行 (dry-run)
tsx scripts/migrate-image-fields.ts --dry-run

# 2. 查看输出，确认无误后执行
tsx scripts/migrate-image-fields.ts --execute

# 3. 验证迁移结果
tsx scripts/migrate-image-fields.ts --verify
```

### 迁移脚本使用

**backend/scripts/migrate-image-fields.ts** (新增):

```typescript
import { db } from '../src/shared/database';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';

const execAsync = promisify(exec);

async function migrate(dryRun: boolean = false) {
  console.log(`[Migration] Starting ${dryRun ? '(DRY RUN)' : '(EXECUTE)'}...`);

  if (!dryRun) {
    // 1. 创建备份
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backup_${timestamp}.sql`;
    await execAsync(`pg_dump $DATABASE_URL > ${backupFile}`);
    console.log(`[Migration] Backup created: ${backupFile}`);
  }

  // 2. 开始事务
  await db.transaction(async (tx) => {
    // 3. 创建新表 (通过Drizzle migration已创建)

    // 4. 迁移账号头像数据
    const accounts = await tx.query.creatorAccounts.findMany({
      columns: { id: true, avatarUrl: true, localAvatarUrl: true }
    });

    for (const account of accounts) {
      if (!account.avatarUrl) continue;

      const urlHash = crypto.createHash('md5').update(account.avatarUrl).digest('hex');

      await tx.insert(imageMetadata).values({
        originalUrl: account.avatarUrl,
        urlHash,
        localPath: account.localAvatarUrl || null,
        downloadStatus: account.localAvatarUrl ? 'completed' : 'pending'
      }).onConflictDoNothing();
    }

    console.log(`[Migration] Migrated ${accounts.length} avatars`);

    // 5. 迁移视频缩略图数据
    const videos = await tx.query.videos.findMany({
      columns: { id: true, thumbnailUrl: true, thumbnailLocalPath: true }
    });

    for (const video of videos) {
      if (!video.thumbnailUrl) continue;

      const urlHash = crypto.createHash('md5').update(video.thumbnailUrl).digest('hex');

      await tx.insert(imageMetadata).values({
        originalUrl: video.thumbnailUrl,
        urlHash,
        localPath: video.thumbnailLocalPath || null,
        downloadStatus: video.thumbnailLocalPath ? 'completed' : 'pending'
      }).onConflictDoNothing();
    }

    console.log(`[Migration] Migrated ${videos.length} thumbnails`);

    if (!dryRun) {
      // 6. 删除旧字段 (仅在实际执行时)
      await tx.execute(sql`ALTER TABLE creator_accounts DROP COLUMN local_avatar_url`);
      await tx.execute(sql`ALTER TABLE videos DROP COLUMN thumbnail_local_path`);
      console.log(`[Migration] Dropped old columns`);
    }
  });

  console.log(`[Migration] Completed`);
}

// CLI参数解析
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const execute = args.includes('--execute');

if (execute) {
  migrate(false);
} else {
  migrate(true);
}
```

### 回滚迁移

```bash
# 恢复备份
pg_restore backup_2025-10-23T10-30-00.sql

# 或使用回滚脚本
tsx scripts/migrate-image-fields.ts --rollback
```

---

## Testing

### Backend测试示例

**backend/src/services/__tests__/ImageStorageService.test.ts**:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ImageStorageService } from '../ImageStorageService';

describe('ImageStorageService', () => {
  let service: ImageStorageService;

  beforeEach(() => {
    service = new ImageStorageService();
  });

  it('should create metadata for new images', async () => {
    const url = 'https://example.com/avatar.jpg';
    const result = await service.getImageUrl(url, 'avatar');

    expect(result).toContain('/api/image-proxy');
  });

  it('should return local path for downloaded images', async () => {
    // Mock已下载的图片
    const url = 'https://example.com/avatar.jpg';
    // ... 测试逻辑
  });
});
```

### Frontend测试示例

**frontend/components/common/__tests__/Image.test.tsx**:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UnifiedImage } from '../Image';

describe('UnifiedImage', () => {
  it('should render with correct src', () => {
    render(
      <UnifiedImage
        type="avatar"
        entityId={123}
        alt="Test Avatar"
        width={50}
        height={50}
      />
    );

    const img = screen.getByAltText('Test Avatar');
    expect(img).toBeInTheDocument();
  });
});
```

### 运行测试

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test

# 覆盖率报告
npm run test:coverage
```

---

## Monitoring & Debugging

### 查看存储统计

```bash
curl http://localhost:3000/api/images/stats

# 输出示例:
{
  "total": 55000,
  "completed": 53000,
  "pending": 1000,
  "failed": 1000
}
```

### 查看下载任务日志

```bash
# Backend日志
tail -f backend/logs/download-worker.log

# 输出示例:
[ImageWorker] Found 50 tasks
[Download] Starting: https://example.com/avatar.jpg
[Download] Completed: https://example.com/avatar.jpg
```

### 手动触发重试

```sql
-- 重置失败的图片状态
UPDATE image_metadata
SET download_status = 'pending', retry_count = 0
WHERE download_status = 'failed';
```

---

## Best Practices

### 1. 使用统一组件
✅ 推荐:
```tsx
<UnifiedImage type="avatar" entityId={account.id} alt={account.username} />
```

❌ 避免:
```tsx
<img src={account.localAvatarUrl || account.avatarUrl} />
```

### 2. 错误处理
```typescript
// 始终提供alt文本
<UnifiedImage type="avatar" entityId={id} alt="User Avatar" />

// 组件内置占位图降级，无需手动处理
```

### 3. 性能优化
```typescript
// 使用Next.js Image组件的优化特性
<UnifiedImage
  type="thumbnail"
  entityId={video.id}
  width={300}
  height={200}
  priority={isAboveFold}  // 首屏图片优先加载
  loading="lazy"          // 其他图片懒加载
/>
```

---

## Troubleshooting

### 问题1: 图片一直显示占位图

**原因**: 可能未启动后台下载任务

**解决**:
```bash
# 检查后台任务是否运行
ps aux | grep image-download-worker

# 手动启动
cd backend
tsx src/jobs/image-download-worker.ts
```

### 问题2: 迁移失败

**原因**: 数据库连接问题或权限不足

**解决**:
```bash
# 检查数据库连接
psql $DATABASE_URL -c "SELECT 1"

# 查看迁移日志
cat migration-log.txt
```

### 问题3: 存储空间不足

**原因**: 图片下载占用磁盘空间

**解决**:
```bash
# 查看存储使用情况
du -sh backend/static/images/*

# 手动清理旧图片
tsx scripts/cleanup-storage.ts --dry-run
tsx scripts/cleanup-storage.ts --execute
```

---

## Next Steps

1. ✅ 完成开发环境配置
2. ⏭️ 运行 `/speckit.tasks` 生成详细任务清单
3. 📋 按照 `tasks.md` 逐步实施功能
4. ✅ 编写测试用例
5. 🚀 部署到测试环境

---

**Generated**: 2025-10-23 | **Status**: Ready for development
