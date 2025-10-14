# 创作者监控平台 API 文档

## 📋 目录

- [爬虫接口](#爬虫接口)
  - [URL解析](#url解析)
  - [添加账号](#添加账号)
  - [批量抓取](#批量抓取)
- [创作者账号接口](#创作者账号接口)
  - [账号列表](#账号列表)
  - [账号详情](#账号详情)
  - [更新账号](#更新账号)
  - [删除账号](#删除账号)
- [视频数据接口](#视频数据接口)
  - [视频列表](#视频列表)
  - [视频详情](#视频详情)
  - [视频搜索](#视频搜索)
  - [视频统计](#视频统计)

---

## 🔧 爬虫接口

### URL解析
解析URL并识别平台和用户信息

**接口地址**：`POST /api/scrape/parse-url`

**请求参数**：
```json
{
  "url": "https://www.tiktok.com/@dansukiii"
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "platform": "tiktok",
    "identifier": "dansukiii",
    "type": "profile",
    "isValid": true
  }
}
```

**支持的平台**：
- TikTok: `https://www.tiktok.com/@username`
- Instagram: `https://www.instagram.com/username/` (待实现)
- YouTube: `https://www.youtube.com/@username` (待实现)

---

### 添加账号
根据URL自动识别平台并抓取创作者信息和视频数据

**接口地址**：`POST /api/scrape/complete`

**请求参数**：
```json
{
  "url": "https://www.tiktok.com/@dansukiii",
  "userId": 1  // 可选，用户ID
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "账号创建并完整抓取成功",
  "data": {
    "accountId": 123,
    "isNew": true,
    "platformId": 1,
    "profile": {
      "username": "dansukiii",
      "displayName": "用户显示名",
      "followerCount": 1500000,
      "followingCount": 500,
      "totalVideos": 25,
      "isVerified": true,
      "avatarUrl": "头像URL",
      "bio": "个人简介",
      "profileUrl": "https://www.tiktok.com/@dansukiii"
    },
    "videosCount": 25
  }
}
```

---

### 批量抓取
批量添加多个创作者账号

**接口地址**：`POST /api/scrape/batch`

**请求参数**：
```json
{
  "urls": [
    "https://www.tiktok.com/@user1",
    "https://www.tiktok.com/@user2"
  ],
  "userId": 1
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "批量抓取任务已启动",
  "data": {
    "urlsCount": 2
  }
}
```

---

## 👤 创作者账号接口

### 账号列表
获取创作者账号列表，支持多种筛选和排序条件

**接口地址**：`GET /api/platforms/accounts`

**查询参数**：
- `platform` - 按平台过滤：`tiktok`, `instagram`, `youtube`
- `username` - 按用户名模糊搜索
- `userId` - 按用户ID过滤
- `page` - 页码（默认1）
- `limit` - 每页数量（默认10）
- `sortBy` - 排序字段：`updatedAt`, `followerCount`, `username`, `createdAt`
- `sortOrder` - 排序方向：`desc`, `asc`

**请求示例**：
```
GET /api/platforms/accounts?platform=tiktok&sortBy=followerCount&sortOrder=desc&limit=20
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": 123,
        "username": "dansukiii",
        "displayName": "用户显示名",
        "followerCount": 1500000,
        "followingCount": 500,
        "totalVideos": 25,
        "isVerified": true,
        "avatarUrl": "头像URL",
        "bio": "个人简介",
        "profileUrl": "https://www.tiktok.com/@dansukiii",
        "platformName": "tiktok",
        "platformDisplayName": "TikTok",
        "platformColor": "#000000",
        "lastScrapedAt": "2025-01-14T10:00:00Z",
        "createdAt": "2025-01-14T09:00:00Z",
        "updatedAt": "2025-01-14T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### 账号详情
获取单个创作者账号的详细信息

**接口地址**：`GET /api/platforms/accounts/:id`

**路径参数**：
- `id` - 账号ID

**响应示例**：
```json
{
  "success": true,
  "data": {
    "account": {
      "id": 123,
      "username": "dansukiii",
      "displayName": "用户显示名",
      "followerCount": 1500000,
      "followingCount": 500,
      "totalVideos": 25,
      "isVerified": true,
      "avatarUrl": "头像URL",
      "bio": "个人简介",
      "profileUrl": "https://www.tiktok.com/@dansukiii",
      "platformName": "tiktok",
      "platformDisplayName": "TikTok",
      "platformColor": "#000000",
      "lastScrapedAt": "2025-01-14T10:00:00Z",
      "metadata": {
        // 完整的原始抓取数据
        "user": { /* ... */ },
        "stats": { /* ... */ }
      }
    }
  }
}
```

---

### 更新账号
更新创作者账号信息

**接口地址**：`PUT /api/platforms/accounts/:id`

**请求参数**：
```json
{
  "displayName": "新的显示名",
  "bio": "新的个人简介",
  "scrapeFrequency": 24
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "创作者账号更新成功"
}
```

---

### 删除账号
删除创作者账号及其所有相关数据

**接口地址**：`DELETE /api/platforms/accounts/:id`

**响应示例**：
```json
{
  "success": true,
  "message": "创作者账号删除成功"
}
```

---

## 🎥 视频数据接口

### 视频列表
获取视频列表，支持多种筛选条件

**接口地址**：`GET /api/videos`

**查询参数**：
- `accountId` - 按账号ID过滤
- `title` - 按标题模糊搜索
- `publishedAfter` - 发布时间起始（ISO 8601）
- `publishedBefore` - 发布时间结束（ISO 8601）
- `minViewCount` - 最小观看数
- `maxViewCount` - 最大观看数
- `sortBy` - 排序字段：`publishedAt`, `viewCount`, `likeCount`
- `sortOrder` - 排序方向：`desc`, `asc`
- `page` - 页码（默认1）
- `limit` - 每页数量（默认20）

**请求示例**：
```
GET /api/videos?accountId=123&sortBy=viewCount&sortOrder=desc&limit=10
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "videos": [
      {
        "id": 456,
        "platformVideoId": "video123",
        "title": "视频标题",
        "description": "视频描述",
        "viewCount": 1000000,
        "likeCount": 50000,
        "commentCount": 1000,
        "shareCount": 500,
        "publishedAt": "2025-01-13T15:30:00Z",
        "duration": 60,
        "videoUrl": "视频文件URL",
        "thumbnailUrl": "缩略图URL",
        "accountId": 123,
        "firstScrapedAt": "2025-01-14T10:00:00Z",
        "lastUpdatedAt": "2025-01-14T10:00:00Z",
        "metadata": {
          // 完整的原始抓取数据
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

---

### 视频详情
获取单个视频的详细信息

**接口地址**：`GET /api/videos/:id`

**响应示例**：
```json
{
  "success": true,
  "data": {
    "video": {
      "id": 456,
      "platformVideoId": "video123",
      "title": "视频标题",
      "description": "视频描述",
      "viewCount": 1000000,
      "likeCount": 50000,
      "commentCount": 1000,
      "shareCount": 500,
      "publishedAt": "2025-01-13T15:30:00Z",
      "duration": 60,
      "videoUrl": "视频文件URL",
      "thumbnailUrl": "缩略图URL",
      "accountId": 123,
      "metadata": {
        // 完整的原始抓取数据
      }
    }
  }
}
```

---

### 视频搜索
按关键词搜索视频

**接口地址**：`GET /api/videos/search`

**查询参数**：
- `q` - 搜索关键词（必需）
- `accountId` - 按账号ID过滤
- `page` - 页码（默认1）
- `limit` - 每页数量（默认20）

**请求示例**：
```
GET /api/videos/search?q=美食&accountId=123
```

---

### 视频统计
获取视频统计信息

**接口地址**：`GET /api/videos/stats/summary`

**查询参数**：
- `accountId` - 按账号ID过滤（可选）

**响应示例**：
```json
{
  "success": true,
  "data": {
    "totalVideos": 25,
    "totalViews": 10000000,
    "totalLikes": 500000,
    "totalComments": 10000,
    "totalShares": 5000,
    "avgViews": 400000,
    "avgLikes": 20000,
    "avgComments": 400,
    "avgShares": 200,
    "mostViewedVideo": {
      "id": 456,
      "title": "最热门视频",
      "viewCount": 2000000
    },
    "mostLikedVideo": {
      "id": 457,
      "title": "最受欢迎视频",
      "likeCount": 100000
    }
  }
}
```

---

## 🚦 错误响应

所有接口在出错时都会返回统一的错误格式：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

**常见错误码**：
- `VALIDATION_ERROR` - 请求参数验证失败
- `ACCOUNT_NOT_FOUND` - 账号不存在
- `VIDEO_NOT_FOUND` - 视频不存在
- `PLATFORM_NOT_FOUND` - 平台不存在
- `INTERNAL_ERROR` - 服务器内部错误
- `INVALID_URL` - 无效的URL格式
- `RATE_LIMIT_EXCEEDED` - 请求频率超限

---

## 🔒 认证

所有API接口都需要在请求头中包含API密钥：

```
x-api-key: your-api-key-here
```

---

## 📊 数据格式说明

### 数值类型
- `followerCount`, `viewCount`, `likeCount` 等大数值使用字符串格式返回，避免JavaScript精度丢失
- 日期时间使用ISO 8601格式：`2025-01-14T10:00:00Z`

### 元数据字段
- `metadata` 字段包含完整的原始抓取数据
- 前端可以根据需要提取特定的原始数据字段进行分析

### 分页信息
- 所有列表接口都支持分页
- `totalPages` 向上取整计算总页数