# Cloudflare 部署配置

## 构建命令配置

在 Cloudflare Pages 的项目设置中，使用以下配置：

### Build Command
```bash
cd frontend && npm ci && npm run build
```

### Deploy Command
```bash
cd frontend && npx wrangler pages deploy out
```

### 环境变量
- `NODE_VERSION`: `18`
- `NPM_VERSION`: `9`
- `NEXT_TELEMETRY_DISABLED`: `1`

## 配置说明

### 为什么使用 `npm ci` 而不是 `npm install`？

1. **一致性保证**：`npm ci` 严格按照 `package-lock.json` 安装依赖，确保构建环境一致性
2. **性能优化**：利用 npm 缓存，构建速度更快
3. **版本锁定**：避免 Cloudflare 自动升级依赖版本

### Next.js 配置优化

- **禁用 Turbopack**：避免 Cloudflare 环境下的 Turbopack bug
- **静态导出配置**：`output: 'export'` 确保完全静态化
- **图片优化**：`unoptimized: true` 适配 Cloudflare Pages

## 故障排除

### 如果遇到 Turbopack 错误
1. 确保 Next.js 版本锁定为 15.5.5
2. 使用 `--no-turbopack` 标志
3. 检查 `package-lock.json` 是否存在且正确

### 如果构建缓慢
1. 确保 `npm ci` 命令正确使用
2. 检查环境变量设置
3. 考虑使用 Cloudflare 构建缓存

## 部署流程

1. 代码推送到 main 分支
2. Cloudflare 自动触发构建
3. 使用 `npm ci` 安装依赖
4. 运行 `next build` 生成静态文件
5. 使用 wrangler 部署到 Cloudflare Pages