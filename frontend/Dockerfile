# 多阶段构建：构建阶段
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm ci

# 复制源代码
COPY . .

# 构建Next.js应用
RUN npm run build

# 生产阶段：使用官方nginx镜像
FROM nginx:alpine AS runner

# 安装curl用于健康检查
RUN apk add --no-cache curl

# 复制自定义nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 从构建阶段复制构建产物
COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/public /app/public

# 设置工作目录
WORKDIR /app

# 创建非root用户
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001

# 切换到非root用户
USER nginx

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]