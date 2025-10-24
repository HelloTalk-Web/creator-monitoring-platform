# Feature Specification: OpenList 图片管线精简

**Feature Branch**: `003-openlist-integration`
**Status**: Adopted

## 概述

本规格描述我们已经落地的 OpenList 集成改造: 爬虫阶段仅保存平台返回的原始图片 URL, 首次访问 `/api/images/:type/:id` 时由后端自动下载并上传到 OpenList, 成功后回写 `raw_url`, 统一走服务器流式返回, 彻底解决浏览器把缩略图当成附件下载的问题。

## 目标

- 保持 OpenList 客户端接口简单 (login / upload / getProxyUrl / download)。
- 爬虫只负责落库原始外链, 上传过程延迟到图片首次访问时自动完成。
- 首次上传成功后回写 `raw_url`, 后续统一走 `/api/images/:type/:id` 流式返回。
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
       │ 下载图片到内存                                    │ 直接写入外部 URL
       ▼                                                  ▼
┌───────────────┐                                ┌──────────────────────┐
│ ImageDownload │ --(保存本地/返回原 URL)-->      │ image_metadata 标记 pending │
└──────┬────────┘                                └──────┬──────────────────┘
       │                                                  │
┌──────▼────────┐                                ┌────────▼────────┐
│ /api/images   │ --(重定向 old proxy)-->         │ /api/images   │ -- 首次访问触发下载→上传 ──┐
└───────────────┘                                └────────┬────────┘                          │
                                                         │                                      ▼
                                                         │ 上传成功回写 raw_url → 后续流式返回
                                                         │ 上传失败继续走传统代理
```

## 用户故事

### US1: 爬虫写入原始图片 URL (P1)

**场景**: 爬虫抓取账号或视频时，只保存平台返回的外链。

**接受标准**:
- 不调用 OpenList API，不阻塞爬虫流程。
- 数据库存储外链，供 `/api/images` 判断是否需要首次上传。
- 记录抓取日志，排查缺图问题。

### US2: `/api/images/:type/:id` 首次访问自动上传 (P1)

**场景**: 前端通过统一接口访问图片，后端发现仍是外链时自动下载并上传到 OpenList。

**接受标准**:
- 自动登录 OpenList，401 时重登并重试一次。
- 上传成功后回写 `creator_accounts` / `videos` 字段为 raw_url。
- 设置正确的 `Content-Type`，不返回 `Content-Disposition`。
- 上传失败时保留外链并返回传统代理。

### US3: 兼容既有数据 (P2)

**场景**: 存量记录中仍可能存放原始 CDN URL 或旧的 `/api/openlist-proxy` 地址。

**接受标准**:
- `ImageStorageService` 能解析 `/api/openlist-proxy?url=...` 并提取 raw_url。
- 若字段为外链, `/api/images` 首次访问时触发上传任务; 上传失败则继续外链访问。
- 访问或上传成功后更新访问计数, 供后续统计使用。

### US4: 账号管理批量重新爬取 (P2)

**场景**: 在账号管理页面选中多个账号, 一键触发重新抓取最新数据。

**接受标准**:
- 提供“批量重新爬取”按钮, 显示当前选中数量。
- 调用后台接口逐个抓取, 完成后反馈成功/失败数量。
- 失败不会中断其它账号的抓取, 结果记录在日志中。

## 功能需求

- **FR-001**: 提供 `OpenListClient` 封装登录、上传、获取 raw_url、下载四个方法, 并在 401 时自动重登一次。
- **FR-002**: `ImageDownloadService` 仅在 `/api/images` 首次访问时触发下载+上传, 生成带哈希的唯一文件名, 成功时返回 raw_url, 失败保留原 URL。
- **FR-003**: `ImageStorageService` 使用 `image_metadata` 表追踪上传状态, 上传成功后回写 `creator_accounts` / `videos` 字段, 并在后续访问中直接命中 raw_url。
- **FR-004**: `/api/images/:type/:id` 根据 `ImageStorageService` 返回的结果, 在三种路径间抉择:
  1. OpenList raw_url → 服务器流式转发。
  2. 本地缓存文件 → 直接 `sendFile`。
  3. 传统代理回退 → 302 重定向 `/api/image-proxy?url=...`。
- **FR-005**: 所有分支记录结构化日志(成功/失败/降级), 便于排查问题。
- **FR-006**: 提供批量重新爬取接口与管理页按钮, 支持一次触发多个账号的完整抓取。

## 约束与假设

- OpenList 服务地址、账号、密码通过环境变量 (`OPENLIST_URL`、`OPENLIST_USERNAME`、`OPENLIST_PASSWORD`) 配置。
- 单文件不超过 10MB, 不做流式分块上传。
- 保留 `MAX_CONCURRENT_UPLOADS` 环境变量供脚本或未来扩展使用 (当前爬虫不使用)。
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
✅ `ImageDownloadService` 支持按需下载+上传与稳定命名
✅ `ImageStorageService` 元数据追踪、raw_url 回写与访问统计
✅ `/api/images/:type/:id` 流式/本地/代理三分支
✅ 结构化日志 (openlist / fallback)
✅ 账号管理页批量重新爬取按钮 + 对应接口

### 不包含
❌ 批量迁移脚本
❌ 临时文件清理或后台任务
❌ 分块上传、上传进度回调
❌ 统一错误码映射或额外元数据表

## 后续扩展 (可选)

- 若需要批量迁移, 可基于现有 `openlistClient` 编写脚本。
- 如需更细粒度的监控或缓存策略, 可在 `ImageStorageService` 基础上继续拓展。
