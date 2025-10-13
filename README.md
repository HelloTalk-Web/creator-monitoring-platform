# 🎬 创作者数据监控平台

## 📋 项目概览

一个现代化的创作者数据监控平台，支持多平台账号管理和数据自动更新。

### 🎯 核心功能

- **多平台支持**: TikTok、Instagram、YouTube、Facebook、小红书、抖音
- **账号管理**: 添加、编辑、删除创作者账号
- **数据抓取**: 自动抓取视频数据和互动指标
- **数据可视化**: 趋势图表和统计分析
- **定时更新**: 自动定期更新数据

### 🏗️ 技术架构

```
┌─────────────────────────────────────────┐
│           前端层 (Vue3)                 │
│  - TypeScript + Element Plus            │
│  - Pinia (状态管理)                     │
│  - Vue Router (路由)                    │
├─────────────────────────────────────────┤
│           API层 (Express)               │
│  - RESTful API                          │
│  - 中间件体系                           │
│  - 错误处理                             │
├─────────────────────────────────────────┤
│           数据服务层                     │
│  - 账号服务                             │
│  - 抓取服务                             │
│  - 数据服务                             │
│  - 调度服务                             │
├─────────────────────────────────────────┤
│           外部API层                      │
│  - Scrape Creators API                  │
│  - 限流和重试机制                       │
├─────────────────────────────────────────┤
│           数据存储层                     │
│  - PostgreSQL (主数据库)                 │
│  - Redis (缓存)                         │
└─────────────────────────────────────────┘
```

## 📁 项目结构

```
creator-monitoring-platform/
├── frontend/                 # 前端应用
│   ├── src/
│   │   ├── components/      # Vue组件
│   │   ├── views/          # 页面视图
│   │   ├── services/       # API服务
│   │   ├── types/          # TypeScript类型
│   │   ├── utils/          # 工具函数
│   │   ├── stores/         # Pinia状态管理
│   │   └── assets/         # 静态资源
│   └── public/             # 公共资源
├── backend/                 # 后端API服务
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── services/       # 业务逻辑
│   │   ├── models/         # 数据模型
│   │   ├── middleware/     # 中间件
│   │   ├── utils/          # 工具函数
│   │   ├── routes/         # 路由定义
│   │   ├── config/         # 配置文件
│   │   └── types/          # TypeScript类型
│   └── tests/              # 测试文件
├── database/               # 数据库相关
│   ├── migrations/         # 数据库迁移
│   ├── seeds/              # 种子数据
│   └── scripts/            # 数据库脚本
├── docs/                   # 项目文档
│   ├── api/               # API文档
│   ├── architecture/      # 架构文档
│   └── deployment/        # 部署文档
└── scripts/               # 脚本文件
    ├── dev/               # 开发脚本
    ├── prod/              # 生产脚本
    └── deploy/            # 部署脚本
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- PostgreSQL >= 13
- Redis >= 6.0
- npm >= 8.0.0

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd creator-monitoring-platform
```

2. **安装依赖**
```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

3. **配置数据库**
```bash
# 创建数据库
createdb creator_monitoring_platform

# 运行数据库迁移
cd ../database
psql creator_monitoring_platform < schema.sql
```

4. **配置环境变量**
```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 编辑配置文件
vim backend/.env
```

5. **启动服务**
```bash
# 启动后端服务
cd backend
npm run dev

# 启动前端服务
cd ../frontend
npm run dev
```

## 📊 MVP功能清单

### Phase 1: MVP (2-3周)

#### ✅ 已完成
- [x] 项目架构设计
- [x] 数据库设计
- [x] 项目结构搭建

#### 🚧 进行中
- [ ] 前端项目框架搭建

#### 📋 待开发
- [ ] 后端API服务搭建
- [ ] 创作者账号管理功能
  - [ ] 添加账号（URL解析）
  - [ ] 账号列表展示
  - [ ] 编辑备注名称
  - [ ] 删除账号
- [ ] TikTok + Instagram 数据抓取
  - [ ] 集成Scrape Creators API
  - [ ] 视频数据抓取
  - [ ] 数据存储
- [ ] 基础数据展示
  - [ ] 视频列表
  - [ ] 基础统计
- [ ] 手动刷新机制

### Phase 2: 增强版本 (3-4周)

- [ ] 多平台支持扩展
- [ ] 自动定时抓取
- [ ] 基础数据可视化
- [ ] 用户认证系统

### Phase 3: 完整版本 (4-6周)

- [ ] 高级分析功能
- [ ] 实时数据同步
- [ ] 导出功能
- [ ] 性能优化

## 🔧 开发规范

### 前端规范
- 使用 Vue 3 Composition API
- TypeScript 严格模式
- ESLint + Prettier 代码规范
- 组件命名：PascalCase
- 文件命名：kebab-case

### 后端规范
- RESTful API 设计
- 统一错误处理
- 数据验证
- 接口文档自动生成
- 单元测试覆盖率 >= 80%

### Git规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 代码重构
- test: 测试相关

## 📝 API文档

API文档将自动生成在 `docs/api/` 目录下。

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

- 项目维护者: Sean
- 邮箱: sean@deepractice.ai
- 项目链接: [https://github.com/your-username/creator-monitoring-platform](https://github.com/your-username/creator-monitoring-platform)

---

⚡ 让AI触手可及 | Powered by deepractice.ai