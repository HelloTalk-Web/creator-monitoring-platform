# Data Model: 简化图片存储加载机制

**Date**: 2025-10-23
**Purpose**: 定义新的数据库模式，支持统一图片存储和管理

## Overview

当前系统使用多字段存储图片信息（原始URL + 本地路径），新模式简化为统一管理，通过独立的元数据表跟踪图片状态。

## Schema Changes

### 1. 现有表修改

#### `creatorAccounts` 表
**变更**: 移除 `localAvatarUrl` 字段

```sql
-- Before
CREATE TABLE creator_accounts (
  id SERIAL PRIMARY KEY,
  avatar_url TEXT,              -- 原始第三方URL
  local_avatar_url TEXT,        -- 本地存储路径 ❌ 删除
  ...
);

-- After
CREATE TABLE creator_accounts (
  id SERIAL PRIMARY KEY,
  avatar_url TEXT,              -- 统一图片标识符 (保留原始URL语义)
  ...
);
```

**迁移映射**:
- 如果 `local_avatar_url` 存在 → 创建 `image_metadata` 记录
- `avatar_url` 保持不变作为统一标识符

#### `videos` 表
**变更**: 移除 `thumbnail_local_path` 字段

```sql
-- Before
CREATE TABLE videos (
  id SERIAL PRIMARY KEY,
  thumbnail_url TEXT,           -- 原始第三方URL
  thumbnail_local_path VARCHAR, -- 本地存储路径 ❌ 删除
  ...
);

-- After
CREATE TABLE videos (
  id SERIAL PRIMARY KEY,
  thumbnail_url TEXT,           -- 统一图片标识符
  ...
);
```

---

### 2. 新增表

#### `image_metadata` 表
**用途**: 集中管理所有图片的元数据和状态

```sql
CREATE TABLE image_metadata (
  id SERIAL PRIMARY KEY,

  -- 图片标识
  original_url TEXT NOT NULL UNIQUE,     -- 原始URL (唯一索引)
  url_hash VARCHAR(32) NOT NULL UNIQUE,  -- URL的MD5哈希 (快速查找)

  -- 存储信息
  local_path TEXT,                       -- 本地文件路径 (如 /static/images/avatars/avatar_123.jpg)
  file_size BIGINT,                      -- 文件大小(字节)
  mime_type VARCHAR(50),                 -- MIME类型 (image/jpeg, image/png等)

  -- 状态追踪
  download_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending: 等待下载
    -- downloading: 下载中
    -- completed: 已完成
    -- failed: 失败 (达到最大重试次数)

  retry_count INT NOT NULL DEFAULT 0,    -- 当前重试次数
  max_retries INT NOT NULL DEFAULT 3,    -- 最大重试次数
  last_error TEXT,                       -- 最后一次错误信息
  next_retry_at TIMESTAMP,               -- 下一次重试时间 (指数退避计算)

  -- 访问统计
  access_count BIGINT NOT NULL DEFAULT 0,  -- 访问次数
  last_accessed_at TIMESTAMP,             -- 最后访问时间
  first_accessed_at TIMESTAMP,            -- 首次访问时间

  -- 时间戳
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- 索引
  CONSTRAINT chk_status CHECK (download_status IN ('pending', 'downloading', 'completed', 'failed'))
);

-- 索引策略
CREATE INDEX idx_image_url_hash ON image_metadata(url_hash);           -- URL查找
CREATE INDEX idx_image_status ON image_metadata(download_status);      -- 状态筛选
CREATE INDEX idx_image_retry ON image_metadata(next_retry_at)          -- 重试调度
  WHERE download_status = 'failed' AND retry_count < max_retries;
CREATE INDEX idx_image_access ON image_metadata(last_accessed_at);     -- 清理策略
```

#### `download_queue` 表 (可选)
**用途**: 管理下载任务队列 (初期可用内存队列，后期可持久化)

**实施决策**: 本次迭代使用内存队列（p-queue），download_queue 表延迟到未来版本实施。触发条件：任务数 > 10000 或需要分布式处理时。

```sql
CREATE TABLE download_queue (
  id SERIAL PRIMARY KEY,

  -- 任务信息
  image_metadata_id INT NOT NULL REFERENCES image_metadata(id) ON DELETE CASCADE,
  priority INT NOT NULL DEFAULT 5,        -- 优先级 (1-10, 10最高)

  -- 状态
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
    -- queued: 已入队
    -- processing: 处理中
    -- completed: 完成
    -- failed: 失败

  -- 时间信息
  queued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- 元数据
  worker_id VARCHAR(50),                  -- 处理此任务的worker ID

  CONSTRAINT chk_queue_status CHECK (status IN ('queued', 'processing', 'completed', 'failed'))
);

-- 索引
CREATE INDEX idx_queue_status_priority ON download_queue(status, priority DESC);
CREATE INDEX idx_queue_metadata ON download_queue(image_metadata_id);
```

---

## Entity Relationships

```
creatorAccounts (1) ──< (0..1) image_metadata (via avatar_url = original_url)
videos (1) ──< (0..1) image_metadata (via thumbnail_url = original_url)
image_metadata (1) ──< (0..*) download_queue
```

**说明**:
- 每个账号/视频的图片URL对应一条 `image_metadata` 记录
- 同一个URL在多个实体间共享同一条 `image_metadata` (去重)
- 下载队列可以有多条记录指向同一图片元数据 (重试场景)

---

## Data Migration Plan

### Phase 1: 创建新表
```sql
-- 执行 drizzle-kit generate 生成迁移SQL
-- 创建 image_metadata 和 download_queue 表
```

### Phase 2: 迁移数据
```sql
-- 1. 迁移账号头像数据
INSERT INTO image_metadata (
  original_url,
  url_hash,
  local_path,
  download_status,
  created_at,
  updated_at
)
SELECT DISTINCT
  avatar_url,
  MD5(avatar_url),
  local_avatar_url,
  CASE
    WHEN local_avatar_url IS NOT NULL THEN 'completed'
    ELSE 'pending'
  END,
  NOW(),
  NOW()
FROM creator_accounts
WHERE avatar_url IS NOT NULL
ON CONFLICT (original_url) DO NOTHING;

-- 2. 迁移视频缩略图数据
INSERT INTO image_metadata (
  original_url,
  url_hash,
  local_path,
  download_status,
  created_at,
  updated_at
)
SELECT DISTINCT
  thumbnail_url,
  MD5(thumbnail_url),
  thumbnail_local_path,
  CASE
    WHEN thumbnail_local_path IS NOT NULL THEN 'completed'
    ELSE 'pending'
  END,
  NOW(),
  NOW()
FROM videos
WHERE thumbnail_url IS NOT NULL
ON CONFLICT (original_url) DO NOTHING;
```

### Phase 3: 验证数据完整性
```sql
-- 验证账号头像完整性
SELECT COUNT(*) FROM creator_accounts WHERE avatar_url IS NOT NULL;
SELECT COUNT(*) FROM image_metadata WHERE original_url IN (
  SELECT avatar_url FROM creator_accounts WHERE avatar_url IS NOT NULL
);
-- 两个数字应该相等

-- 验证视频缩略图完整性
SELECT COUNT(DISTINCT thumbnail_url) FROM videos WHERE thumbnail_url IS NOT NULL;
SELECT COUNT(*) FROM image_metadata WHERE original_url IN (
  SELECT thumbnail_url FROM videos WHERE thumbnail_url IS NOT NULL
);
-- 两个数字应该相等 (考虑URL去重)
```

### Phase 4: 删除旧字段
```sql
-- ⚠️ 仅在验证通过后执行
ALTER TABLE creator_accounts DROP COLUMN local_avatar_url;
ALTER TABLE videos DROP COLUMN thumbnail_local_path;
```

### Rollback Plan
```sql
-- 1. 恢复数据库备份
-- pg_restore backup_{timestamp}.sql

-- 2. 或手动恢复字段
ALTER TABLE creator_accounts ADD COLUMN local_avatar_url TEXT;
ALTER TABLE videos ADD COLUMN thumbnail_local_path VARCHAR;

UPDATE creator_accounts ca
SET local_avatar_url = im.local_path
FROM image_metadata im
WHERE ca.avatar_url = im.original_url;

UPDATE videos v
SET thumbnail_local_path = im.local_path
FROM image_metadata im
WHERE v.thumbnail_url = im.original_url;

-- 3. 删除新表
DROP TABLE download_queue;
DROP TABLE image_metadata;
```

---

## Query Patterns

### 获取图片元数据
```typescript
// 通过URL查找
const metadata = await db
  .select()
  .from(imageMetadata)
  .where(eq(imageMetadata.urlHash, md5(imageUrl)))
  .limit(1);

// 检查图片是否已本地化
const isLocal = metadata?.downloadStatus === 'completed' && metadata.localPath;
```

### 获取待下载任务
```typescript
// 查找所有待下载或需要重试的图片
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
```

### 更新访问统计
```typescript
// 记录图片访问
await db
  .update(imageMetadata)
  .set({
    accessCount: sql`${imageMetadata.accessCount} + 1`,
    lastAccessedAt: new Date()
  })
  .where(eq(imageMetadata.id, imageId));
```

---

## Storage Size Estimates

**当前规模** (估算):
- 账号数: ~5000
- 视频数: ~50000
- 平均图片大小: 100KB

**存储需求**:
- 头像: 5000 × 100KB = 500MB
- 缩略图: 50000 × 100KB = 5GB
- **总计**: ~5.5GB

**元数据表大小** (估算):
- 每条记录: ~500 bytes
- 总记录数: ~55000 (去重后可能更少)
- 元数据表: ~27MB (可忽略)

---

## Performance Considerations

### 索引优化
- `url_hash` 唯一索引: O(log n) 查找
- `download_status` 索引: 快速筛选待下载任务
- 部分索引: 只为需要重试的记录建索引

### 查询优化
- 使用 `url_hash` 代替 `original_url` 比较 (更快)
- 批量更新访问统计 (定期合并，减少写入)
- 定期清理completed任务的 `download_queue` 记录

### 空间优化
- 定期归档旧的 `download_queue` 记录
- 软删除 `image_metadata` (标记而非删除)
- 压缩存储图片 (可选，但超出当前范围)

---

**Generated**: 2025-10-23 | **Status**: Data model complete
