# Implementation Plan: OpenList 图片管线精简

**Branch**: `003-openlist-integration`  ·  **Source Spec**: [spec.md](./spec.md)

本计划用于记录已经交付的实现结构, 方便后续维护或追加测试。

## 总览

交付内容拆成三层:

1. **OpenListClient 基础层** – 提供登录、上传、下载、获取 raw_url 的最小封装。
2. **图片入库流程** – 爬虫只存外部 URL, `/api/images` 首次访问时自动上传并回写 raw_url。
3. **统一访问接口** – `/api/images/:type/:id` 根据存储结果决定流式转发或传统代理。

## 技术上下文

- Node.js 18 / TypeScript 5
- 依赖: `axios`, `form-data`, `drizzle-orm`
- 环境变量: `OPENLIST_URL`, `OPENLIST_USERNAME`, `OPENLIST_PASSWORD`, `OPENLIST_STORAGE_PATH`(可选), `MAX_CONCURRENT_UPLOADS`(预留)
- OpenList 服务实现基于 AList, 以 `raw_url` 作为直链

## Phase 1 · 基础模块

| 步骤 | 描述 | 文件 |
| --- | --- | --- |
| P1-1 | 创建 `OpenListClient` 类, 内置 401 自动重登、网络重试一次 | `backend/src/modules/openlist/client.ts` |
| P1-2 | 定义 `OpenListConfig`、`UploadResult`、`OpenListError` 类型, 暴露单例 | `backend/src/modules/openlist/types.ts`, `index.ts` |
| P1-3 | 通过 `openlist.config.ts` 读取并校验环境变量, 默认存储前缀为空 | `backend/src/config/openlist.config.ts` |

## Phase 2 · 图片写入

| 步骤 | 描述 | 文件 |
| --- | --- | --- |
| P2-1 | `ScraperManager` 仅保存平台返回的头像/封面 URL, 不做即时上传 | `backend/src/modules/scrapers/manager/scraper.manager.ts` |
| P2-2 | `ImageDownloadService` 支持按需下载+上传, 根据实体生成稳定文件名 | `backend/src/shared/services/ImageDownloadService.ts` |
| P2-3 | `ImageStorageService` 维护 `image_metadata`, 首次上传成功后回写数据库字段 | `backend/src/services/ImageStorageService.ts` |

## Phase 3 · 图片访问

| 步骤 | 描述 | 文件 |
| --- | --- | --- |
| P3-1 | 统一 `/api/images/:type/:id` 逻辑, 支持 OpenList 流式、磁盘文件、传统代理三种分支 | `backend/src/routes/images.ts` |
| P3-2 | 删除历史 `/api/openlist-proxy` 路由, 避免重复接口 | `backend/src/index.ts` |
| P3-3 | 在成功与降级分支写结构化日志, 便于后续监控 | `backend/src/routes/images.ts` |

## Phase 4 · 账号批量操作

| 步骤 | 描述 | 文件 |
| --- | --- | --- |
| P4-1 | 新增批量重新爬取接口, 支持一次抓取多个账号 | `backend/src/modules/scrapers/controller/scraper.controller.ts`, ` routes.ts` |
| P4-2 | 账号管理页提供多选与“批量重新爬取”按钮 | `frontend/app/accounts/page.tsx` |

## 验证与测试

- 单元测试: Mock OpenList API 检查 401 自动重登与重试次数。
- 手动验证: 在浏览器访问 `/api/images/thumbnail/:id` 与 `/api/images/avatar/:id`, 确认不再触发下载弹窗。
- 回归检查: OpenList 不可用时, `ImageStorageService` 返回传统代理 URL 并在日志中标记 `proxy=fallback`。

## 后续可选项

- 如果需要批量迁移历史数据, 可复用 `OpenListClient` 与 `image_metadata` 状态编写一次性脚本。
- `maxConcurrentUploads` 已保留配置, 未来如需限流可在脚本或爬虫中读取使用。
- 可根据业务需要扩展更多监控 (例如统计 raw_url 命中率)。
