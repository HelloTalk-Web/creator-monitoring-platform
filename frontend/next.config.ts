import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  distDir: 'out',

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

  // Environment variables
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.meshowcase.xyz',
    NEXT_PUBLIC_DEPLOYMENT_ENV: process.env.NEXT_PUBLIC_DEPLOYMENT_ENV || 'production'
  }
}

export default nextConfig