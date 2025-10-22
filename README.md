# 🎬 创作者数据监控平台

一个现代化的多平台创作者数据监控系统，支持TikTok、抖音等平台的账号管理和视频数据自动抓取。

## 🐳 容器化部署

本项目已完全容器化，支持一键部署到任何支持Docker的环境。

### 🚀 快速启动

```bash
# 克隆项目
git clone <repository-url>
cd creator-monitoring-platform

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

### 🏗️ 架构概览

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (Nginx)   │    │   后端 (Node.js)  │    │  数据库 (PostgreSQL) │
│   端口: 3000     │    │   端口: 8000     │    │   端口: 5432      │
│   Next.js + 静态  │    │   Express + API    │    │   数据持久化      │
│   文件服务        │    │   业务逻辑处理     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🐋 镜像构建

```bash
# 构建自定义镜像
docker build -t creator-monitoring-backend ./backend
docker build -t creator-monitoring-frontend ./frontend

# 推送到镜像仓库
docker push creator-monitoring-backend
docker push creator-monitoring-frontend
```

一个现代化的多平台创作者数据监控系统，支持TikTok、抖音等平台的账号管理和视频数据自动抓取。

## ✨ 核心功能

- 🌐 **多平台支持** - TikTok、抖音（可扩展更多平台）
- 👤 **账号管理** - 添加、查看、删除创作者账号
- 📹 **视频监控** - 自动抓取视频数据和互动指标
- 🔍 **搜索过滤** - 支持按标题搜索视频
- 📊 **数据展示** - 清晰的卡片式视频列表和统计信息
- 🖼️ **封面预览** - 自动处理和显示视频封面图片
- 🏷️ **平台标识** - 清晰展示账号所属平台

## 🏗️ 技术栈

### 前端
- **框架**: Next.js 15 (App Router)
- **UI库**: shadcn/ui + Tailwind CSS
- **语言**: TypeScript
- **HTTP客户端**: Axios
- **图标**: Lucide React

### 后端
- **运行时**: Node.js + TypeScript
- **框架**: Express.js
- **数据库**: PostgreSQL (Drizzle ORM)
- **爬虫**: Scrape Creators API
- **日志**: Winston

## 📁 项目结构

```
creator-monitoring-platform/
├── frontend/                    # Next.js 前端应用
│   ├── app/                    # App Router 页面
│   │   ├── page.tsx           # 账号列表页
│   │   ├── videos/[accountId]/ # 视频详情页
│   │   ├── layout.tsx         # 根布局
│   │   └── globals.css        # 全局样式
│   ├── components/             # UI组件
│   │   └── ui/                # shadcn/ui组件
│   ├── lib/                   # 工具函数
│   └── next.config.ts         # Next.js配置
│
├── backend/                    # Express 后端服务
│   ├── src/
│   │   ├── modules/           # 业务模块
│   │   │   ├── platforms/    # 平台管理
│   │   │   ├── scrapers/     # 爬虫服务
│   │   │   └── videos/       # 视频管理
│   │   ├── shared/            # 共享资源
│   │   │   ├── database/     # 数据库配置
│   │   │   └── utils/        # 工具函数
│   │   ├── routes/            # API路由
│   │   └── index.ts          # 入口文件
│   └── docs/                  # API文档
│
└── database-schema.sql         # 数据库结构

```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- PostgreSQL >= 13
- npm >= 8.0.0
- Scrape Creators API Key

### 1. 克隆项目

```bash
git clone https://github.com/HelloTalk-Web/creator-monitoring-platform.git
cd creator-monitoring-platform
```

### 2. 配置数据库

```bash
# 创建数据库
createdb creator_monitoring

# 导入数据库结构
psql creator_monitoring < database-schema.sql
```

### 3. 配置后端

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入以下信息：
# - DATABASE_URL: PostgreSQL连接字符串
# - SCRAPE_CREATORS_API_KEY: Scrape Creators API密钥
# - PORT: 后端服务端口（默认8000）
```

### 4. 配置前端

```bash
cd ../frontend

# 安装依赖
npm install

# 配置环境变量（可选）
# 创建 .env.local 文件设置前端端口等
```

### 5. 启动服务

```bash
# 终端1: 启动后端（端口8000）
cd backend
npm run dev

# 终端2: 启动前端（端口3001）
cd frontend
npm run dev
```

访问 http://localhost:3001 查看应用。

## 📖 使用说明

### 添加创作者账号

1. 点击首页的"添加账号"按钮
2. 输入创作者主页URL（支持TikTok、抖音等平台）
3. 系统会自动识别平台并抓取账号信息和视频数据
4. 抓取完成后，账号会显示在列表中

### 查看视频

1. 在账号列表中点击"查看视频"按钮
2. 进入视频详情页，可以看到：
   - 视频封面（自动处理HEIC格式）
   - 视频标题和描述
   - 互动数据（播放量、点赞数、评论数、分享数）
   - 发布时间和时长
3. 支持搜索视频标题
4. 支持分页浏览

### 搜索和筛选

- 首页支持按账号名称搜索
- 视频页支持按标题搜索
- 所有数据支持分页加载

## 🔌 API接口

### 平台管理

- `GET /api/platforms/accounts` - 获取账号列表
- `GET /api/platforms/accounts?accountId={id}` - 获取指定账号信息
- `DELETE /api/platforms/accounts/:id` - 删除账号

### 视频管理

- `GET /api/v1/videos` - 获取视频列表
  - 参数: `accountId`, `page`, `pageSize`, `title`

### 爬虫服务

- `POST /api/scrape/complete` - 完整抓取（账号+视频）
  - Body: `{ "url": "creator_profile_url" }`

详细API文档请查看 `backend/docs/API.md`

## 🛠️ 技术亮点

### 前端

- 使用Next.js 15的App Router实现服务端渲染
- shadcn/ui组件库提供优雅的UI体验
- TypeScript严格类型检查保证代码质量
- 响应式设计适配各种屏幕尺寸

### 后端

- 模块化架构，清晰的分层设计
- Drizzle ORM提供类型安全的数据库操作
- BigInt序列化处理，避免JSON序列化错误
- 智能图片格式处理（HEIC转JPEG）
- 完善的错误处理和日志记录

### 数据处理

- 自动从metadata提取最优图片格式
- BigInt类型安全转换为Number
- 前后端字段名完全对齐
- 支持增量数据更新

## 📊 项目状态

### ✅ 已完成功能

- [x] 项目架构设计和实现
- [x] 数据库设计和迁移
- [x] Next.js前端框架搭建
- [x] Express后端API服务
- [x] 账号管理（添加、列表、删除）
- [x] TikTok数据抓取集成
- [x] 视频数据展示和分页
- [x] 搜索和过滤功能
- [x] 平台标识显示
- [x] 图片格式兼容处理

### 🚧 开发中

- [ ] 自动定时刷新机制
- [ ] 数据趋势分析
- [ ] 更多平台支持（YouTube、Instagram等）

### 📋 计划功能

- [ ] 用户认证系统
- [ ] 数据导出功能
- [ ] 高级分析和图表
- [ ] 实时数据同步
- [ ] 批量操作

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📝 开发规范

### 提交信息规范

- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具链相关

### 代码规范

- 使用TypeScript严格模式
- 遵循ESLint配置
- 组件命名使用PascalCase
- 文件命名使用kebab-case
- API路由使用RESTful设计

## 📄 许可证

本项目采用 MIT 许可证。

## 👥 项目团队

- **项目维护者**: 阿祖 (Cen-Yaozu)
- **组织**: HelloTalk-Web
- **项目性质**: 公司内部项目
- **项目链接**: [https://github.com/HelloTalk-Web/creator-monitoring-platform](https://github.com/HelloTalk-Web/creator-monitoring-platform)

---

💼 HelloTalk 内部项目 | 创作者数据监控平台
