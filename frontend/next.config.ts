import type { NextConfig } from "next"
import path from "path"

const nextConfig: NextConfig = {
  // Cloudflare Pages configuration - enable static export
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  // Fix workspace root warning
  outputFileTracingRoot: path.join(__dirname, ".."),

  images: {
    unoptimized: true, // Cloudflare auto-optimizes images
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

  // Environment variables
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.meshowcase.xyz',
    NEXT_PUBLIC_DEPLOYMENT_ENV: process.env.NEXT_PUBLIC_DEPLOYMENT_ENV || 'production'
  }
}

export default nextConfig
