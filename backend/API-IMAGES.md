# 图片存储 API 文档

本文档描述简化图片存储加载机制的所有 API 端点。

## 概述

新的图片存储系统提供:
- 统一的图片访问接口
- 自动后台下载和本地化
- 存储空间监控
- 迁移和清理工具

---

## API 端点

### 1. 统一图片访问

#### `GET /api/images/:type/:id`

获取指定类型和ID的图片。自动处理本地化检查、代理下载和占位图降级。

**路径参数**:
- `type` (string, required): 图片类型
  - `avatar`: 账号头像
  - `thumbnail`: 视频缩略图
- `id` (number, required): 实体ID
  - 对于 `avatar`: 账号ID (creator_accounts.id)
  - 对于 `thumbnail`: 视频ID (videos.id)

**响应**:
- **成功 (200)**: 返回图片文件 (已本地化)
- **重定向 (302)**: 重定向到代理URL (未本地化)
- **错误 (400)**: 参数验证失败
- **错误 (404)**: 实体不存在
- **错误 (500)**: 服务器错误

**示例**:
```bash
# 获取账号头像
GET /api/images/avatar/123

# 获取视频缩略图
GET /api/images/thumbnail/456
```

**工作流程**:
1. 验证 `type` 和 `id` 参数
2. 从数据库查询实体 (账号/视频)
3. 检查 `image_metadata` 表是否已本地化
4. **已本地化**: 返回本地文件 (< 200ms)
5. **未本地化**: 创建 `pending` 记录,返回代理URL
6. **无URL**: 返回占位图

**性能监控**:
所有请求都会记录响应时间:
```
[Image] 本地文件响应: avatar/123 (15ms)
[Image] 代理重定向: thumbnail/456 (45ms)
[Image] 本地文件缺失,使用占位图: avatar/789 (32ms)
```

---

### 2. 统计信息

#### `GET /api/images/stats`

获取图片存储统计信息。

**响应**:
```json
{
  "totalImages": 1285,
  "byStatus": {
    "pending": 45,
    "completed": 1200,
    "failed": 40
  },
  "cacheHitRate": 0.9338,
  "lastUpdated": "2025-10-23T08:00:00.000Z"
}
```

**字段说明**:
- `totalImages`: 总图片数量
- `byStatus`: 按状态分组统计
  - `pending`: 待下载
  - `completed`: 已完成
  - `failed`: 下载失败
- `cacheHitRate`: 缓存命中率 (已完成 / 总数)
- `lastUpdated`: 统计时间

**示例**:
```bash
curl http://localhost:8000/api/images/stats
```

---

## 数据库表结构

### `image_metadata`

存储所有图片的元数据和本地化状态。

```sql
CREATE TABLE image_metadata (
  id SERIAL PRIMARY KEY,
  original_url TEXT NOT NULL UNIQUE,
  url_hash VARCHAR(32) NOT NULL UNIQUE,
  local_path TEXT,
  file_size BIGINT,
  mime_type VARCHAR(50),
  download_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  next_retry_at TIMESTAMP,
  access_count BIGINT NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMP,
  first_accessed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_image_url_hash ON image_metadata(url_hash);
CREATE INDEX idx_image_status ON image_metadata(download_status);
CREATE INDEX idx_image_access ON image_metadata(last_accessed_at);
```

**字段说明**:
- `original_url`: 原始第三方URL
- `url_hash`: URL的MD5哈希 (快速查找)
- `local_path`: 本地文件路径 (相对路径)
- `download_status`: 下载状态 (pending/downloading/completed/failed)
- `retry_count`: 重试次数
- `next_retry_at`: 下次重试时间
- `access_count`: 访问统计

---

## 后台下载 Worker

### 工作原理

1. **定时任务**: 每10分钟检查一次待下载图片
2. **并发控制**: 使用 p-queue,最多5个并发下载
3. **重试机制**: 指数退避 (1分钟 → 5分钟 → 30分钟)
4. **状态管理**: pending → downloading → completed/failed

### 存储监控

1. **定时检查**: 每小时检查一次磁盘空间
2. **阈值**: 可用空间 < 10GB 时暂停下载
3. **通知**: console.error 日志通知管理员

---

## 迁移工具

### 迁移脚本

```bash
# 预览迁移数据
npx tsx scripts/migrate-image-fields.ts --dry-run

# 执行迁移 (自动备份)
npx tsx scripts/migrate-image-fields.ts --execute

# 回滚迁移
npx tsx scripts/migrate-image-fields.ts --rollback <backup_file>
```

**功能**:
- 自动备份 (pg_dump)
- 数据验证
- 事务包装
- 回滚支持 (pg_restore)

### 清理脚本

```bash
# 查看统计
npx tsx scripts/cleanup-storage.ts --stats

# 预览清理
npx tsx scripts/cleanup-storage.ts --dry-run

# 执行清理
npx tsx scripts/cleanup-storage.ts --execute
```

**功能**:
- 检测未引用文件
- 安全删除检查
- 空间统计

---

## 错误处理

### 下载失败

当图片下载失败时:
1. 记录错误到 `last_error` 字段
2. 增加 `retry_count`
3. 设置 `next_retry_at` (指数退避)
4. 重试3次后标记为 `failed`

### 占位图降级

当图片无法获取时,自动返回占位图:
- **头像**: `static/images/placeholders/avatar-default.svg`
- **缩略图**: `static/images/placeholders/video-default.svg`

---

## 性能指标

### 目标

- **首次访问**: 代理重定向 < 100ms
- **本地化访问**: 文件响应 < 200ms
- **缓存命中率**: > 90%

### 监控

所有图片请求都会记录响应时间,便于性能分析:
```
[Image] 本地文件响应: avatar/123 (15ms) ✅
[Image] 代理重定向: thumbnail/456 (45ms) ⚠️
[Image] 本地文件缺失,使用占位图: avatar/789 (32ms) ❌
```

---

## 最佳实践

### 前端集成

使用简化的组件接口:

```tsx
import { AvatarImage, ThumbnailImage } from '@/components/common/Image'

// 头像
<AvatarImage id={account.id} alt={account.displayName} />

// 缩略图
<ThumbnailImage id={video.id} alt={video.title} />
```

### 错误处理

组件自动处理错误:
- 显示加载状态
- 自动降级到占位图
- 支持自定义 onError 回调

---

## 故障排查

### 图片无法显示

1. 检查实体是否存在 (账号/视频)
2. 检查 `image_metadata` 表记录
3. 查看下载状态和错误信息
4. 检查本地文件是否存在

### 下载失败

```sql
-- 查询失败的下载
SELECT original_url, last_error, retry_count
FROM image_metadata
WHERE download_status = 'failed';
```

### 性能问题

```sql
-- 查询访问频繁的图片
SELECT original_url, access_count, local_path
FROM image_metadata
ORDER BY access_count DESC
LIMIT 100;
```

---

## 版本历史

- **v1.0.0** (2025-10-23): 初始版本
  - 统一图片访问 API
  - 后台下载 Worker
  - 迁移和清理工具
