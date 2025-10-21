# 后端架构概览与开发手册

## 1. 范围说明
- **目标**：帮助新成员快速理解创作者数据监控平台后端（`backend/`）的架构、约束与开发流程。
- **核心能力**：多平台创作者账号与视频数据抓取、存储、检索，并提供统计/历史指标。
- **技术栈**：Express + TypeScript、Drizzle ORM（PostgreSQL）、ScrapeCreators API、Winston、node-cron、node-cache。

```
┌─────────────┐     HTTP/API      ┌──────────────┐      ┌───────────────┐
│ Next.js FE  │ ────────────────▶ │ Express API  │ ───▶ │ PostgreSQL DB │
└─────────────┘                  │  (App Server) │      └───────────────┘
          ▲                      │    ▲   ▲      │             ▲
          │                      │    │   │      │             │
          │                      │    │   └─▶ ScrapeCreators API (TikTok/抖音…)
          │                      │    └────▶ node-cron 调度器
          │                      └────────▶ 事件/监听 & 日志
```

## 2. 模块架构
1. **入口（`src/index.ts`）**
   - 负责加载环境变量、初始化数据库与公共模块。
   - 配置全局中间件（`helmet`、`cors`、`morgan`→`winston`、`rateLimiter`、`requestLogger`）。
   - 注册 API 路由与健康检查，启动调度器、事件监听器。
2. **路由层（`src/routes` 与各模块 `routes.ts`）**
   - 组合模块路由，对外暴露 RESTful endpoint。
   - 可在入口再次映射旧路径以兼容前端（如 `/api/scrape/complete`）。
3. **模块层（`src/modules/*`）**
   - `platforms`：平台及创作者账号 CRUD、过滤、分页。
   - `scrapers`：对 ScrapeCreators API 的适配，聚合爬虫、数据转换、入库。
   - `videos`：视频列表、统计、趋势查询。
   - `video-metrics-history`：监听视频指标变化，生成历史快照。
   - `users`：内部用户管理（目前偏辅助）。
   - 每个模块通常包含 `controller`（HTTP）、`service/manager`（业务）、`repository`（访问层）与 `types`。
4. **共享层（`src/shared`）**
   - `database/`：Drizzle schema、连接、迁移脚本。
   - `middleware/`：错误处理、限流、请求日志。
   - `decorators/` + `events/`：`TrackVideoChanges` 装饰器 + `videoEvents` 事件，以事件驱动历史快照。
   - `scheduler/`：`video-refresh.scheduler` 定时刷新账号数据。
   - `infrastructure/`：`apiKeyService` 统一管理 ScrapeCreators API Key。
   - `utils/`：日志封装。
5. **脚本层（`scripts/`）**
   - 例如 `update-video-data.ts` 用于手动刷新或批处理。

## 3. 数据流与关键工作流
### 3.1 创作者抓取流程（POST `/api/scrape/complete`）
1. Controller 校验 URL → 调用 `scraperManager.scrapeAndStoreCreatorAccount`.
2. Manager 解析 URL → 选择平台爬虫（`TikTokAdapter` 等）。
3. 爬虫通过 `apiKeyService` 获取可用 API Key，调用 ScrapeCreators API 获取 profile & video 列表。
4. `transformers` 负责把第三方返回映射为平台标准模型；
   `dataMapper` 进一步变成数据库实体（含 BigInt、metadata）。
5. 写入/更新 `creator_accounts`；批量 upsert `videos`。
6. `saveStandardizedVideos` 触发 `TrackVideoChanges` 装饰器 → 发布 `video:updated` 事件。
7. `videoHistoryListener` 异步消费事件，调用 `videoMetricsHistoryService.createSnapshots` 在 `video_metrics_history` 中建快照。

### 3.2 视频查询
1. `VideoService.getVideos` 构建动态条件（账号/标题/标签/时间/指标范围）。
2. 多表 JOIN `videos`、`creator_accounts`、`platforms`，统一 BigInt 转 Number 并补充封面处理。
3. 支持分页、排序、标签 JSON 查询、按时间区间统计。

### 3.3 调度刷新
1. `videoRefreshScheduler` 使用 `node-cron` 按 `ENABLE_AUTO_REFRESH` & `VIDEO_REFRESH_SCHEDULE` 触发。
2. 顺序遍历活跃账号，调用 `scraperManager` 重新抓取，结果写入日志并累积统计。
3. 每个账号抓取之间默认 `2s` 延迟以降低限流风险。

## 4. 数据模型
- **platforms**：平台基础信息（URL、图标、限速、特性）。
- **users**：内部用户账号。
- **creator_accounts**：创作者账号主体，关联 `users` & `platforms`（联合唯一：`userId + platformId + platformUserId`）。
- **videos**：视频实体（唯一索引 `accountId + platformVideoId`）。含指标、封面、metadata、首抓时间。
- **video_metrics_history**：视频指标历史快照。
- **scrape_tasks**：未来扩展任务队列的基础表。
- **system_configs**：系统配置键值对。

## 5. 外部依赖与集成
- **ScrapeCreators API**：TikTok/Instagram/YouTube 数据来源。使用 `apiKeyService` 轮询多 Key、查询积分余额。
- **环境变量**：
  - `DATABASE_URL`、或按 `DB_*` 单独配置。
  - `SCRAPE_CREATORS_BASE_URL`、`SCRAPE_CREATORS_API_KEY`（支持逗号分隔多 Key）。
  - `ENABLE_AUTO_REFRESH`、`VIDEO_REFRESH_SCHEDULE` 控制调度。
  - `PORT`、`NODE_ENV`、`LOG_LEVEL`、`CACHE_TTL` 等。
- **依赖库**：Express、drizzle-orm/postgres-js、node-cron、node-cache、winston、helmet、cors、axios。

## 6. 约束与注意事项
- **限流**：全局默认 15 分钟 1000 次；抓取接口单独限制为每分钟 60 次。必要时可基于 API Key 或账号自定义。
- **API 配额**：ScrapeCreators API Key 有积分限制，`apiKeyService` 会尝试轮询有积分的 Key；若全部耗尽需提前预警。
- **BigInt 序列化**：数据库指标字段大量使用 `bigint`，返回前需转为 `number`；控制器中已有 `serializeBigInt` 辅助函数，开发新接口时务必保持一致。
- **错误处理**：统一使用 `errorHandler` 中间件，业务层抛出 `Error` 文本，并在 controller 中决定状态码。
- **幂等写入**：`videos`/`creator_accounts` 使用唯一索引 + `UPDATE` 逻辑确保重复抓取不会创建重复数据。
- **日志**：`winston` 输出到控制台与 `logs/` 文件。生产环境需确保日志目录可写，并配置日志轮转（可后续补齐）。
- **调度器运行**：默认关闭；需在部署环境显式开启，避免开发环境无意调用外部 API。
- **网络错误重试**：`videoHistoryListener` 内置指数退避重试。爬虫调用暂未统一重试，建议在扩展时增加容错。

## 7. 开发手册
### 7.1 准备环境
1. 安装 Node.js ≥ 18、pnpm 或 npm；PostgreSQL ≥ 13。
2. 克隆仓库并进入 `backend/`。
3. 基于 `.env.example` 创建 `.env`，配置数据库与 ScrapeCreators Key（开发阶段可暂时留空 Key，某些流程会提示）。
4. 安装依赖：`npm install`。

### 7.2 数据库操作
- 初始化：`createdb creator_monitoring`（或使用 docker-compose）。
- 迁移：
  - 生成 SQL：`npm run db:generate`（依赖 `drizzle.config.ts`）。
  - 执行迁移：`npm run db:migrate`。
- 种子数据（可选）：`npm run db:seed`。如需重置：`npm run db:reset`。

### 7.3 启动与调试
- 本地开发：`npm run dev`（使用 `tsx watch`，支持热重载）。
- 编译：`npm run build` → `npm start`。
- 类型检查 / Lint：`npm run type-check`、`npm run lint`。
- 脚本示例：`npm run script:update-videos` 手动刷新视频指标。
- 日志查看：`tail -f logs/combined.log` / `logs/error.log`。

### 7.4 新功能开发流程
1. **建模**：若需要新表或字段，修改 `schema.ts` → 运行 `npm run db:generate` 生成迁移 → 审核 SQL → `npm run db:migrate`。
2. **模块化**：在 `src/modules/<domain>/` 下新增 `controller / service / repository / routes`，通过 `index.ts` 聚合导出。
3. **路由注册**：在 `src/index.ts` 或 `src/routes/*` 注册新路由，必要时加入限流与中间件。
4. **日志与错误**：在 Service 层使用 `logger` 记录关键路径；Controller 负责返回语义化错误码。
5. **BigInt 处理**：所有返回给前端的 `bigint` 字段必须转成 `number` 或 `string`，避免 JSON 序列化失败。
6. **外部 API**：统一通过 `apiKeyService` 获取 Key；新增平台需要实现 `crawlers/<Platform>.ts` + 对应 `transformer`。
7. **事件驱动**：若需追踪数据变化，考虑复用 `TrackVideoChanges` 装饰器或新增事件。
8. **测试数据**：可在 `src/examples/` 或 `scripts/` 中添加示例调用脚本。

### 7.5 代码规范
- TypeScript 严格模式，遵循现有 ESLint/Prettier 配置。
- 文件命名使用 `kebab-case`，类/组件使用 `PascalCase`。
- Controller 仅负责校验 & Response；业务在 Service/Manager；数据访问集中在 Repository（如存在）。
- 避免在 Controller 中直接操作数据库或外部 API。
- 保持日志结构化，避免记录敏感信息（如完整 API Key）。

### 7.6 常见问题
| 问题 | 排查 |
| --- | --- |
| 启动时报数据库连接失败 | 检查 `DATABASE_URL`、PostgreSQL 端口、防火墙，并确认 `schema.ts` 迁移已执行。 |
| 抓取接口返回 500 | 检查 ScrapeCreators Key 是否配置或积分耗尽；查看 `logs/error.log`。 |
| JSON 序列化报错 `Do not know how to serialize a BigInt` | 确认返回前已调用 `Number()` 或 `serializeBigInt`。 |
| 自动刷新未执行 | 确认 `.env` 中 `ENABLE_AUTO_REFRESH=true`、`VIDEO_REFRESH_SCHEDULE` 格式合法。 |
| 限流过严 | 调整 `rateLimiter` 配置或为特定路由定制限流器。 |

## 8. 未来改进建议
- 为调度与爬虫流程增加集中式重试与失败告警（可结合 `scrape_tasks` 表）。
- 引入统一的 OpenAPI/Swagger 文档生成，便于前端与第三方集成。
- 完善单元/集成测试覆盖，尤其是抓取与数据转换逻辑。
- 为日志增加按日滚动与云端聚合（如 CloudWatch、ELK）。

---
如需进一步补充或发现文档过期，请更新本文件并在结尾新增更新记录。
