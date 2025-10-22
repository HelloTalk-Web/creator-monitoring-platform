#!/bin/bash

echo "🚀 开始构建前端应用..."

# 进入前端目录
cd frontend

# 安装依赖
npm install

# 构建应用
npm run build

echo "✅ 构建完成！"
echo "📁 输出目录: frontend/out"

# 返回根目录
cd ..