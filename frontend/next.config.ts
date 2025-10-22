import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // 🔧 Cloudflare Pages 配置
  output: 'export',
  trailingSlash: true,
  distDir: 'out',

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

  // 🔧 API 代理配置
  async rewrites() {
    // 🔧 使用自定义域名
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ||
                      "https://api.meshowcase.xyz"

    return [
      {
        source: "/api/:path*",
        destination: `${apiBaseUrl}/api/:path*`
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
