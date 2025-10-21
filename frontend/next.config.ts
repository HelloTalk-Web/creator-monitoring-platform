import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
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
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*"
      }
    ]
  }
}

export default nextConfig
