# Next.js + Cloudflare Pages CI/CD 部署完整指南

## 🎯 问题解决过程

### 原始问题
- Cloudflare Pages 部署时出现 Turbopack 错误：`Invariant: Expected to inject all injections, found // INJECT:pages`
- Next.js 版本不一致：本地 15.5.5，云端自动升级到 16.0.0

### 解决方案

#### 1. 依赖版本一致性保证
**问题根因**：Cloudflare 使用 `npx next build` 会自动安装最新版本

**解决方案**：
```bash
# ❌ 错误：会安装最新版本
cd frontend && npx next build

# ✅ 正确：使用锁文件确保版本一致
cd frontend && npm ci && npm run build
```

#### 2. Next.js 配置优化
**问题**：`experimental.turbo` 废弃警告

**解决方案**：
```typescript
// ❌ 旧版本语法（已废弃）
experimental: {
  turbo: {
    rules: {},
  },
}

// ✅ 新版本语法
turbopack: {
  rules: {},
},
```

#### 3. Wrangler 配置
**问题**：`Must specify a project name` 错误

**解决方案**：创建 `frontend/wrangler.toml`
```toml
name = "creator-monitoring-platform"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[pages]
build_output_dir = "out"
```

## 📋 最终配置

### Cloudflare Pages 配置
```
Build command: cd frontend && npm ci && npm run build
Deploy command: echo "Deployment completed successfully"
```

**注意**：Deploy command 使用占位符，因为 Cloudflare Pages 会自动部署 Build command 生成的静态文件。

### 项目结构
```
frontend/
├── package.json          # 锁定 Next.js 15.5.5
├── package-lock.json     # 确保依赖版本一致性
├── wrangler.toml         # Wrangler 部署配置
├── next.config.ts        # Next.js 配置
└── app/                  # Next.js App Router
```

### 关键配置文件

**frontend/package.json**:
```json
{
  "dependencies": {
    "next": "15.5.5",
    "react": "19.1.0",
    "react-dom": "19.1.0"
  }
}
```

**frontend/next.config.ts**:
```typescript
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  distDir: 'out',

  // Turbopack 配置（新版本语法）
  turbopack: {
    rules: {},
  },

  // 确保静态导出的配置优化
  poweredByHeader: false,
  generateEtags: false,
}
```

## 🚀 最佳实践总结

### 1. 依赖管理原则
- ✅ 始终锁定关键依赖版本（Next.js、React）
- ✅ 在 CI/CD 中使用 `npm ci` 而不是 `npm install`
- ✅ 定期更新 `package-lock.json`

### 2. 配置管理原则
- ✅ 避免在云平台使用 `npx` 安装特定版本
- ✅ 保持配置文件的最新语法
- ✅ 为每个平台创建专用配置文件

### 3. 错误排查方法
- ✅ 仔细分析构建日志，区分警告和错误
- ✅ API 连接错误不影响静态导出（有错误处理）
- ✅ 关注版本差异导致的工具链不兼容

### 4. 部署流程设计
- ✅ Build 和 Deploy 命令职责分离
- ✅ 避免重复构建和资源浪费
- ✅ 确保本地和云端环境一致性

## 📊 性能数据

### 构建时间对比
- **优化前**：重复构建，总时间 ~40s
- **优化后**：单次构建，总时间 ~25s

### 构建结果
- ✅ 所有页面成功生成静态文件
- ✅ 代码分割和优化正常
- ✅ 图片配置适配 Cloudflare Pages

## ⚠️ 常见陷阱

### 1. 版本升级陷阱
- 云平台可能自动升级依赖到最新版本
- 新版本可能存在兼容性问题
- 解决：显式锁定版本，使用锁文件

### 2. 配置语法陷阱
- Next.js 配置语法会随版本变化
- 废弃配置可能导致警告或错误
- 解决：定期检查官方文档更新

### 3. 工具链配置陷阱
- 不同平台的配置要求可能不同
- 配置文件格式和字段可能变化
- 解决：为每个平台维护专用配置

## 🎓 学到的关键经验

1. **一致性是金**：本地开发环境与云端部署环境必须保持一致
2. **锁文件是银**：`package-lock.json` 是防止版本漂移的关键
3. **配置分离是铜**：不同平台使用不同的配置策略
4. **日志分析是基础**：准确理解错误日志是解决问题的前提

这个经验可以应用到所有类似的 CI/CD 部署场景中。