import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  distDir: 'out',

  // Turbopack 配置（新版本语法）
  turbopack: {
    rules: {},
  },

  // Images configuration for Cloudflare
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.fna.fbcdn.net'
      },
      {
        protocol: 'https',
        hostname: '*.cdninstagram.com'
      },
      {
        protocol: 'https',
        hostname: '*.ggpht.com'
      },
      {
        protocol: 'https',
        hostname: '*.workers.dev'
      }
    ]
  },

  // 确保静态导出的配置优化
  poweredByHeader: false,
  generateEtags: false,

  // Environment variables
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.meshowcase.xyz',
    NEXT_PUBLIC_DEPLOYMENT_ENV: process.env.NEXT_PUBLIC_DEPLOYMENT_ENV || 'production'
  }
}

export default nextConfig