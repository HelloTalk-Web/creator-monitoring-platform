# Research: 简化图片存储加载机制

**Date**: 2025-10-23
**Purpose**: 解决技术上下文中的 NEEDS CLARIFICATION 项，确定最佳实践

## Research Tasks

### 1. 测试框架选型

**Decision**: **Vitest** (适用于 Backend 和 Frontend)

**Rationale**:
- ✅ **原生TypeScript支持**: 无需额外配置，与项目现有tsx和ts-node完美集成
- ✅ **快速执行**: 基于Vite，冷启动极快，watch模式响应迅速
- ✅ **Jest兼容API**: 迁移成本低，学习曲线平缓
- ✅ **Next.js 15支持**: 官方推荐的测试方案之一
- ✅ **统一工具链**: Backend和Frontend使用同一框架，降低维护成本

**Alternatives Considered**:
- **Jest**: 成熟但配置复杂，ESM支持需要额外配置，启动较慢
- **Node Test Runner**: Node.js内置但功能有限，生态不如Vitest

**Implementation**:
```json
// package.json (backend & frontend)
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0"
  },
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

### 2. 图片下载最佳实践

**Decision**: 使用 **axios** + **p-queue** (并发控制)

**Rationale**:
- ✅ **axios已集成**: 项目已使用axios，无需引入新依赖
- ✅ **并发控制**: p-queue提供简单可靠的并发限制和优先级队列
- ✅ **流式下载**: axios支持stream，内存友好
- ✅ **重试机制**: 可配合axios-retry或自定义指数退避

**Architecture**:
```
ImageDownloadQueue (p-queue, concurrency: 5)
  ↓
[Task 1] → axios.get(url, {responseType: 'stream'}) → writeStream
[Task 2] → axios.get(url, {responseType: 'stream'}) → writeStream
...
[Task 5] → axios.get(url, {responseType: 'stream'}) → writeStream
  ↓
Retry Logic (指数退避: 1分钟 → 5分钟 → 30分钟)
```

**Key Parameters**:
- 并发数: 5 (避免过载第三方服务器)
- 超时: 30秒/图片
- 重试: 最多3次，指数退避
- 内存: 使用stream避免大文件占用内存

**Alternatives Considered**:
- **node-fetch**: 功能较弱，不如axios成熟
- **undici**: 性能最佳但API不太友好，overkill for this use case

---

### 3. 文件存储组织策略

**Decision**: **按类型分层 + ID命名** (保持现有结构)

**Rationale**:
- ✅ **简单直观**: `avatars/avatar_{id}.{ext}`, `thumbnails/thumbnail_{id}.{ext}`
- ✅ **快速查找**: 通过ID直接定位，无需额外索引
- ✅ **兼容现有**: 保持与当前系统一致
- ✅ **易于清理**: 按类型目录批量操作

**Directory Structure**:
```
backend/static/images/
├── avatars/              # 头像
│   ├── avatar_1.jpg
│   ├── avatar_2.png
│   └── ...
├── thumbnails/           # 视频缩略图
│   ├── thumbnail_1.jpg
│   ├── thumbnail_2.webp
│   └── ...
├── placeholders/         # 占位图 (新增)
│   ├── avatar-default.svg
│   └── video-default.svg
└── temp/                 # 临时下载目录 (新增)
    └── (下载中的文件)
```

**Naming Convention**:
- 格式: `{type}_{id}.{extension}`
- 示例: `avatar_12345.jpg`, `thumbnail_67890.png`
- 原子性: 先下载到temp/，完成后移动到目标目录

**Storage Monitoring**:
- 定时检查磁盘空间 (node-cron, 每小时)
- 阈值: 可用空间 < 10GB 时告警
- 通知: 记录日志 + 可选邮件/Slack通知

**Alternatives Considered**:
- **Hash-based**: 更复杂，无明显优势
- **分片目录** (如 `/avatars/12/34/avatar_1234.jpg`): 对于当前规模(数千-数万)不必要

---

### 4. 数据库迁移安全策略

**Decision**: **Drizzle Kit + 自定义备份脚本**

**Rationale**:
- ✅ **类型安全**: Drizzle ORM原生TypeScript支持
- ✅ **声明式迁移**: 通过schema定义自动生成SQL
- ✅ **已集成**: 项目已使用Drizzle
- ✅ **备份简单**: PostgreSQL的pg_dump/pg_restore

**Migration Workflow**:
```
1. Pre-migration
   ├─ 创建数据库备份: pg_dump → backup_{timestamp}.sql
   ├─ 验证备份文件完整性
   └─ 记录当前数据统计 (行数、checksum)

2. Migration Execution
   ├─ BEGIN TRANSACTION
   ├─ 创建新表 (image_metadata, download_queue)
   ├─ 迁移数据 (INSERT INTO image_metadata SELECT ...)
   ├─ 验证数据完整性 (COUNT, JOIN验证)
   ├─ DROP旧字段 (ALTER TABLE ... DROP COLUMN)
   └─ COMMIT (成功) 或 ROLLBACK (失败)

3. Post-migration
   ├─ 验证迁移结果
   ├─ 运行健康检查
   └─ 保留备份文件 (7天)

4. Rollback (if needed)
   ├─ DROP新表
   ├─ pg_restore backup_{timestamp}.sql
   └─ 验证恢复结果
```

**Safety Features**:
- ✅ **Dry-run模式**: 模拟迁移，不实际修改数据
- ✅ **事务保护**: 全程在事务中，失败自动回滚
- ✅ **数据验证**: 迁移前后数据量校验
- ✅ **时间限制**: 超过5分钟自动中止

**Key Commands**:
```bash
# 生成迁移
npm run db:generate

# 执行迁移 (dry-run)
tsx scripts/migrate-image-fields.ts --dry-run

# 执行迁移 (production)
tsx scripts/migrate-image-fields.ts --execute

# 回滚
tsx scripts/migrate-image-fields.ts --rollback
```

**Alternatives Considered**:
- **纯SQL迁移**: 缺少类型安全和回滚支持
- **ORM自动迁移**: Drizzle不支持自动字段删除，需手动控制

---

### 5. 定时任务和后台作业

**Decision**: **node-cron + 内存队列** (初期) → **可选升级Bull** (后期)

**Rationale**:
- ✅ **简单开始**: node-cron已集成，满足基本需求
- ✅ **内存队列**: p-queue足够处理当前规模
- ✅ **渐进式**: 需要时可升级到Bull (Redis-based)
- ✅ **低复杂度**: 避免过早优化

**Architecture** (Phase 1 - Simple):
```
┌─────────────────────────────────┐
│ node-cron Scheduler             │
│ ├─ 每10分钟: 检查待下载图片    │
│ ├─ 每小时: 检查存储空间        │
│ └─ 每天: 清理失败任务          │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ ImageDownloadWorker             │
│ ├─ p-queue (concurrency: 5)    │
│ ├─ Task: downloadAndSave()     │
│ └─ Retry: ExponentialBackoff   │
└─────────────────────────────────┘
```

**Cron Schedule**:
```javascript
// backend/src/jobs/image-download-worker.ts
cron.schedule('*/10 * * * *', async () => {
  // 每10分钟检查待下载任务
  const pendingImages = await getPendingDownloads();
  await queueDownloads(pendingImages);
});

cron.schedule('0 * * * *', async () => {
  // 每小时检查存储空间
  const spaceInfo = await checkDiskSpace();
  if (spaceInfo.availableGB < 10) {
    await notifyAdmin('Storage low');
    await pauseDownloads();
  }
});
```

**Task Queue State Management**:
```typescript
interface DownloadTask {
  id: string;
  imageUrl: string;
  type: 'avatar' | 'thumbnail';
  entityId: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  retryCount: number;
  nextRetryAt?: Date;
  error?: string;
}
```

**Graceful Shutdown**:
```typescript
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await queue.onIdle(); // 等待队列清空
  await db.close();
  process.exit(0);
});
```

**Upgrade Path to Bull** (if needed):
- 触发条件: 任务数 > 10000, 需要分布式处理
- 优势: Redis持久化、任务优先级、延迟任务
- 成本: 新增Redis依赖

**Alternatives Considered**:
- **Bull from start**: Overkill for current scale
- **Custom queue with DB**: 复杂度高，性能未必更好

---

## Summary of Decisions

| Topic | Decision | Key Benefit |
|-------|----------|-------------|
| Testing | Vitest | 快速、TypeScript原生、统一工具链 |
| Download | axios + p-queue | 已集成、可靠、并发控制 |
| Storage | 按类型分层 + ID命名 | 简单、兼容现有、易维护 |
| Migration | Drizzle + pg_dump | 类型安全、事务保护、可回滚 |
| Background Jobs | node-cron + 内存队列 | 简单开始、可升级 |

---

## Next Phase

所有 NEEDS CLARIFICATION 已解决 ✅

**准备进入 Phase 1**: Design & Contracts
- 数据模型设计 (`data-model.md`)
- API契约定义 (`contracts/`)
- 快速入门指南 (`quickstart.md`)

---

**Generated**: 2025-10-23 | **Status**: Research complete
