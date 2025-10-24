# Feature Specification: OpenList 图片管线精简

**Feature Branch**: `003-openlist-integration`
**Status**: Adopted

## 概述

本规格描述我们已经落地的 OpenList 集成改造: 新的图片管线不再依赖本地代理路由, 所有头像与视频封面优先上传到 OpenList, 数据库存储可直接访问的 `raw_url`, 并通过统一的 `/api/images/:type/:id` 接口流式返回图片数据, 解决浏览器把缩略图当成附件下载的问题。

## 目标

- 为爬虫与后台服务提供稳定的 OpenList 上传能力, 保持接口简单 (login / upload / getProxyUrl / download)。
- 将 OpenList `raw_url` 作为我们自己的持久化地址, 与旧的外部 CDN URL 共存、可回退。
- 替换原 `/api/openlist-proxy` 路由, 由 `/api/images/:type/:id` 直接判定是否需要流式转发 OpenList 资源, 避免浏览器下载行为。
- 保留失败时的传统代理降级, 不新增批量迁移或后台清理任务。

## 非目标

- **批量迁移**: 不在本轮处理 2587 个历史文件的批量迁移, 需要时可额外编写脚本。
- **临时文件治理**: 不引入后台清理、定时任务或复杂的目录映射策略。
- **分块/断点上传**: 仍按现有 10MB 以内的小文件同步上传处理。

## 当前行为 vs 目标行为

```
现状:                                               目标方案:
┌───────────────┐                                ┌───────────────┐
│ 爬虫拿到外部 URL │                                │ 爬虫拿到外部 URL │
└──────┬────────┘                                └──────┬────────┘
       │ 下载图片到内存                                    │ 下载图片到内存
       ▼                                                  ▼
┌───────────────┐                                ┌──────────────────────┐
│ ImageDownload │ --(保存本地/返回原 URL)-->      │ ImageDownload + OpenList │
└──────┬────────┘                                └──────┬──────────────────┘
       │                                                  │ 上传成功? 返回 raw_url
       │                                                  │ 上传失败? 返回原 URL
       ▼                                                  ▼
┌───────────────┐                                ┌──────────────────────┐
│ 数据库存储外链 │                                │ 数据库存储 raw_url 或外链 │
└──────┬────────┘                                └──────┬──────────────────┘
       │                                                  │
┌──────▼────────┐                                ┌────────▼────────┐
│ /api/images   │ --(重定向 old proxy)-->         │ /api/images   │ --(OpenList 流式或传统代理)--> 浏览器渲染
└───────────────┘                                └──────────────────────┘
```

## 用户故事

### US1: 爬虫将图片托管到 OpenList (P1)

**场景**: 爬虫抓取头像或封面时, 由 `ImageDownloadService` 下载原图并上传至 OpenList。

**接受标准**:
- 上传前自动登录, 401 时自动重登后重试一次。
- 上传成功返回 `UploadResult.url` (raw_url), 写入数据库。
- 上传失败或 OpenList 不可达时返回原始 URL, 并记录日志。

### US2: `/api/images/:type/:id` 流式返回图片 (P1)

**场景**: 前端通过统一接口获取图片, 不再出现附件下载弹窗。

**接受标准**:
- 若数据库保存的是 OpenList raw_url, 后端拉取并设置正确的 `Content-Type` 与缓存头, 不带 `Content-Disposition`。
- 若保存的是旧的代理路径或上传失败回退 URL, 继续按旧逻辑处理 (本地文件或传统代理)。
- 出错时返回 JSON 错误响应而非挂起连接。

### US3: 兼容既有数据 (P2)

**场景**: 存量记录中仍可能存放原始 CDN URL 或旧的 `/api/openlist-proxy` 地址。

**接受标准**:
- `ImageStorageService` able to 解析 `/api/openlist-proxy?url=...` 并提取 raw_url。
- 若字段为外链, 首次访问时触发上传任务; 上传失败则继续外链访问。
- 访问成功后更新访问计数, 供后续统计使用。

## 功能需求

- **FR-001**: 提供 `OpenListClient` 封装登录、上传、获取 raw_url、下载四个方法, 并在 401 时自动重登一次。
- **FR-002**: `ImageDownloadService` 在头像/封面下载成功后调用 `OpenListClient.upload`, 生成带哈希的唯一文件名, 成功时返回 raw_url, 失败保留原 URL。
- **FR-003**: `ImageStorageService` 使用 `image_metadata` 表追踪上传状态, 存储 OpenList raw_url, 并在需要时触发下载+上传流程。
- **FR-004**: `/api/images/:type/:id` 根据 `ImageStorageService` 返回的结果, 在三种路径间抉择:
  1. OpenList raw_url → 服务器流式转发。
  2. 本地缓存文件 → 直接 `sendFile`。
  3. 传统代理回退 → 302 重定向 `/api/image-proxy?url=...`。
- **FR-005**: 所有分支记录结构化日志(成功/失败/降级), 便于排查问题。

## 约束与假设

- OpenList 服务地址、账号、密码通过环境变量 (`OPENLIST_URL`、`OPENLIST_USERNAME`、`OPENLIST_PASSWORD`) 配置。
- 单文件不超过 10MB, 不做流式分块上传。
- 上传并发通过 `MAX_CONCURRENT_UPLOADS` 控制(默认 5), 防止爬虫批量上传时阻塞。
- 旧的 `/api/openlist-proxy` 路由已移除, 客户端只能通过 `/api/images` 访问。

## 成功标准

- **SC-001**: 新增图片的数据库字段 (`creator_accounts.avatar_url`、`videos.thumbnail_url`) 保存为 OpenList raw_url, 首次访问即可成功渲染。
- **SC-002**: `GET /api/images/avatar/:id` 与 `GET /api/images/thumbnail/:id` 在浏览器中直接显示图片 (不触发文件下载), 并返回 200。
- **SC-003**: 当 OpenList 上传失败时, 统一走传统代理降级, 日志包含 `proxy=fallback` 标记, 不阻塞业务流程。
- **SC-004**: `image_metadata` 记录访问计数和状态, 便于后续观察上传成功率与热点数据。

## 测试建议

- 单元测试覆盖 `OpenListClient` 的登录与错误处理 (Mock 401、网络错误)。
- 集成测试验证 `/api/images/:type/:id` 在三种分支下的行为 (raw_url、文件、代理)。
- 手工测试：访问最近抓取的视频列表, 确认缩略图不再被浏览器下载。

## 实现范围

### 包含
✅ OpenListClient 基础能力 (login/upload/download/getProxyUrl)
✅ 401 自动重登 & 网络单次重试
✅ `ImageDownloadService` 上传逻辑与稳定命名
✅ `ImageStorageService` 元数据追踪与 raw_url 持久化
✅ `/api/images/:type/:id` 流式/本地/代理三分支
✅ 结构化日志 (openlist / fallback)

### 不包含
❌ 批量迁移脚本
❌ 临时文件清理或后台任务
❌ 分块上传、上传进度回调
❌ 统一错误码映射或额外元数据表

## 后续扩展 (可选)

- 若需要批量迁移, 可基于现有 `openlistClient` 编写脚本。
- 如需更细粒度的监控或缓存策略, 可在 `ImageStorageService` 基础上继续拓展。
