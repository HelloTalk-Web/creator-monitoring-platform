import type { NextConfig } from "next"
import path from "path"

const nextConfig: NextConfig = {
  // 🔧 Cloudflare Pages 配置 - 启用静态导出
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  // 🔧 修复workspace root警告
  outputFileTracingRoot: path.join(__dirname, ".."),

  images: {
    unoptimized: true, // Cloudflare 自动优化图片
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.fna.fbcdn.net"
      },
      {
        protocol: "https",
        hostname: "*.cdninstagram.com"
      },
      {
        protocol: "https",
        hostname: "*.ggpht.com"
      },
      {
        protocol: "https",
        hostname: "*.workers.dev" // Cloudflare Workers
      }
    ]
  },

  
  // 🔧 环境变量
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.meshowcase.xyz',
    NEXT_PUBLIC_DEPLOYMENT_ENV: process.env.NEXT_PUBLIC_DEPLOYMENT_ENV || 'production'
  }
}

export default nextConfig
