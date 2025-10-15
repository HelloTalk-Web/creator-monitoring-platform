# 后端架构设计说明

## 📐 模块职责划分

### 1. **Scrapers 模块** (爬虫模块)
**路径**: `src/modules/scrapers/`
**职责**: 数据抓取和存储

#### 核心组件:
- **Crawlers** (`crawlers/`): 平台适配器
  - `ICrawler`: 爬虫接口定义
  - `TikTok.ts`: TikTok平台适配器
  - 其他平台适配器...

- **Manager** (`manager/scraper.manager.ts`): 业务逻辑层
  - `scrapeAndStoreCreatorAccount()`: 抓取并存储创作者账号和视频
  - `updateVideoByUrl()`: 更新单个视频数据
  - 直接操作数据库(内置仓储层)

- **Controller** (`controller/scraper.controller.ts`): HTTP请求处理
  - `parseUrl()`: 解析URL
  - `scrapeProfile()`: 抓取用户资料
  - `scrapeVideos()`: 抓取视频列表
  - `scrapeComplete()`: 抓取完整信息
  - `updateVideo()`: 更新视频数据

#### API端点:
```
POST /api/scrape/parse-url      - 解析URL识别平台
POST /api/scrape/profile         - 抓取用户资料
POST /api/scrape/videos          - 抓取视频列表
POST /api/scrape/complete        - 抓取完整信息(推荐)
POST /api/scrape/update-video    - 更新单个视频
POST /api/scrape/batch           - 批量抓取(TODO)
```

---

### 2. **Platforms 模块** (平台管理模块)
**路径**: `src/modules/platforms/`
**职责**: 纯CRUD操作，不触发爬虫

#### 核心组件:
- **Repository** (`repository/platform.repository.ts`): 数据访问层
  - 数据库CRUD操作

- **Manager** (`managers/platform.manager.ts`): 业务逻辑层
  - `createOrUpdateCreatorAccount()`: 纯CRUD操作
  - **不包含爬虫逻辑**

- **Service** (`service/platform.service.ts`): 服务层
  - 复杂查询和业务逻辑

- **Controller** (`controller/platform.controller.ts`): HTTP请求处理
  - `getCreatorAccounts()`: 获取账号列表
  - `getCreatorAccount()`: 获取账号详情
  - `updateCreatorAccount()`: 更新账号信息
  - `deleteCreatorAccount()`: 删除账号

#### API端点:
```
GET    /api/platforms/accounts        - 获取账号列表
GET    /api/platforms/accounts/:id    - 获取账号详情
PUT    /api/platforms/accounts/:id    - 更新账号(纯CRUD)
DELETE /api/platforms/accounts/:id    - 删除账号
```

---

## 🔄 数据流设计

### 添加新账号流程

```
┌─────────┐        ┌──────────────┐        ┌─────────────────┐
│         │  URL   │              │        │                 │
│ 前端UI  │───────>│ Scraper API  │───────>│ ScraperManager  │
│         │        │  /complete   │        │                 │
└─────────┘        └──────────────┘        └────────┬────────┘
                                                     │
                                                     ▼
                                          ┌────────────────────┐
                                          │  1. 解析URL识别平台 │
                                          └──────────┬─────────┘
                                                     │
                                                     ▼
                                          ┌────────────────────┐
                                          │  2. 调用平台爬虫    │
                                          │     获取用户数据    │
                                          └──────────┬─────────┘
                                                     │
                                                     ▼
                                          ┌────────────────────┐
                                          │  3. 调用平台爬虫    │
                                          │     获取视频数据    │
                                          └──────────┬─────────┘
                                                     │
                                                     ▼
                                          ┌────────────────────┐
                                          │  4. 直接写入数据库  │
                                          │     - creator_accounts│
                                          │     - videos        │
                                          └────────────────────┘
```

### 更新视频数据流程

```
┌─────────┐        ┌──────────────┐        ┌─────────────────┐
│         │ 视频URL │              │        │                 │
│ 前端UI  │───────>│ Scraper API  │───────>│ ScraperManager  │
│         │        │ /update-video│        │                 │
└─────────┘        └──────────────┘        └────────┬────────┘
                                                     │
                                                     ▼
                                          ┌────────────────────┐
                                          │ 1. 解析视频URL获取ID│
                                          └──────────┬─────────┘
                                                     │
                                                     ▼
                                          ┌────────────────────┐
                                          │ 2. 查询数据库确认   │
                                          │    视频是否存在     │
                                          └──────────┬─────────┘
                                                     │
                                                     ▼
                                          ┌────────────────────┐
                                          │ 3. 调用平台爬虫     │
                                          │    获取最新数据     │
                                          └──────────┬─────────┘
                                                     │
                                                     ▼
                                          ┌────────────────────┐
                                          │ 4. 更新数据库记录   │
                                          └────────────────────┘
```

---

## ⚠️ 重要设计原则

### 职责分离
1. **Scrapers模块** - 数据获取层
   - 负责**如何获取数据**（技术关注点）
   - 调用外部API
   - 解析和转换数据格式
   - 存储原始数据

2. **Platforms模块** - 业务管理层
   - 负责**如何使用数据**（业务关注点）
   - 查询和展示
   - 业务逻辑处理
   - 数据管理（删除、更新等）

3. **为什么不合并？**
   - ✅ **单一职责**: 每个模块聚焦自己的领域
   - ✅ **可扩展性**: Platforms未来可能需要标签、分组、导出等业务功能
   - ✅ **可维护性**: 业务变更不影响爬虫，爬虫变更不影响业务
   - ✅ **依赖方向**: Scrapers可以依赖Platforms的数据模型，反之不行

### 为什么这样设计？

#### ❌ 错误的设计（之前的方式）:
```typescript
// platformController.createOrUpdateCreatorAccount
async createOrUpdateCreatorAccount(req, res) {
  // 问题：一个"创建/更新"接口内部触发了爬虫
  const crawler = await getPlatformCrawler(platform)
  const data = await crawler.getUserInfo()  // 触发外部API调用
  // ...存储数据
}
```

**问题**:
- 接口名称误导（看起来是CRUD，实际是爬虫）
- 职责不清晰
- 不可预测的性能影响
- 模块间耦合严重

#### ✅ 正确的设计（当前方式）:

```typescript
// scraperController.scrapeComplete
async scrapeComplete(req, res) {
  // 清晰：这是一个爬虫接口，会触发数据抓取
  const result = await scraperManager.scrapeAndStoreCreatorAccount({
    url: req.body.url
  })
  // 返回抓取结果
}

// platformManager.createOrUpdateCreatorAccount
async createOrUpdateCreatorAccount(params) {
  // 清晰：纯CRUD操作，不触发爬虫
  // 只接受已处理的数据，直接存储到数据库
  await db.insert(creatorAccounts).values(params)
}
```

**优势**:
- 职责清晰：爬虫就是爬虫，CRUD就是CRUD
- 接口语义明确
- 模块解耦
- 易于测试和维护

---

## 📝 API使用建议

### 前端开发者
- **添加新账号**: 使用 `POST /api/scrape/complete`
- **更新视频数据**: 使用 `POST /api/scrape/update-video`
- **查询账号列表**: 使用 `GET /api/platforms/accounts`
- **删除账号**: 使用 `DELETE /api/platforms/accounts/:id`

### 后端开发者
- 数据抓取相关功能 → 在 `scrapers` 模块实现
- 纯数据查询和管理 → 在 `platforms` 模块实现
- 新增爬虫适配器 → 实现 `ICrawler` 接口

---

## 🔍 代码示例

### 前端：添加账号
```typescript
// ✅ 正确：调用爬虫接口
const response = await axios.post("/api/scrape/complete", {
  url: "https://www.tiktok.com/@username"
})

// ❌ 错误：不要调用平台CRUD接口期望触发爬虫
const response = await axios.post("/api/platforms/accounts", {
  platform: "tiktok",
  identifier: "username"
})
```

### 后端：实现新平台爬虫
```typescript
// 1. 创建平台适配器
export class InstagramAdapter implements ICrawler {
  async getUserInfo(url: string): Promise<any> {
    // 调用Instagram API
  }

  async getUserVideos(url: string): Promise<any[]> {
    // 调用Instagram API
  }

  async getVideoInfo(videoUrl: string): Promise<any> {
    // 调用Instagram API
  }
}

// 2. 注册到 crawlers/index.ts
export function getPlatformCrawler(platform: string): ICrawler {
  switch (platform) {
    case 'tiktok':
      return new TikTokAdapter()
    case 'instagram':
      return new InstagramAdapter()  // 新增
    // ...
  }
}
```

---

## 📚 相关文件

### 核心文件
- `src/modules/scrapers/manager/scraper.manager.ts` - 爬虫业务逻辑
- `src/modules/scrapers/controller/scraper.controller.ts` - 爬虫API端点
- `src/modules/scrapers/crawlers/TikTok.ts` - TikTok适配器
- `src/modules/platforms/managers/platform.manager.ts` - 平台CRUD逻辑
- `src/modules/platforms/controller/platform.controller.ts` - 平台API端点

### 测试文件
- `test-update-video.ts` - 视频更新接口测试
- `test-tiktok-video-api.ts` - TikTok API测试

---

## 🎯 总结

**核心思想**:
- 爬虫模块 = 数据获取 + 存储
- 平台模块 = 数据管理（查询、更新、删除）
- 职责清晰，边界明确，易于维护和扩展
