import axios from "axios"
import { StatCard } from "@/components/dashboard/stat-card"
import { TrendingVideos } from "@/components/dashboard/trending-videos"
import { RecentVideos } from "@/components/dashboard/recent-videos"
import { PlatformDistribution } from "@/components/dashboard/platform-distribution"
import { Users, Video, Eye, ThumbsUp } from "lucide-react"
import { RefreshButton } from "./refresh-button"
import { resolveApiBaseUrl } from "@/lib/utils"

const API_BASE_URL = resolveApiBaseUrl()

interface DashboardStats {
  totalAccounts: number
  totalVideos: number
  totalViews: number
  totalLikes: number
}

interface PlatformStats {
  platformName: string
  count: number
  color: string
}

interface VideoData {
  id: number
  title: string
  thumbnailUrl: string
  viewCount: number
  likeCount: number
  commentCount: number
  publishedAt: string
  duration: number
  creatorDisplayName: string
  platformDisplayName: string
  pageUrl: string | null // 修复为string | null类型
}

/**
 * 获取 Dashboard 数据 (服务端)
 */
async function getDashboardData() {
  try {
    // 使用并行请求获取所有数据
    const [statsResponse, trendingResponse, recentResponse] = await Promise.all([
      axios.get(`${API_BASE_URL}/api/dashboard/stats`),
      axios.get(`${API_BASE_URL}/api/dashboard/trending-videos`, {
        params: { limit: 5 }
      }),
      axios.get(`${API_BASE_URL}/api/dashboard/recent-videos`, {
        params: { limit: 5 }
      })
    ])

    return {
      stats: statsResponse.data.data.stats as DashboardStats,
      platforms: statsResponse.data.data.platforms as PlatformStats[],
      trendingVideos: trendingResponse.data.data.videos as VideoData[] || [],
      recentVideos: recentResponse.data.data.videos as VideoData[] || []
    }
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error)
    // 返回默认数据
    return {
      stats: {
        totalAccounts: 0,
        totalVideos: 0,
        totalViews: 0,
        totalLikes: 0
      },
      platforms: [],
      trendingVideos: [],
      recentVideos: []
    }
  }
}

/**
 * Dashboard 页面 (SSR)
 *
 * 改为服务端渲染,使得:
 * 1. AI 爬虫能够获取完整的 HTML
 * 2. 通过 middleware 自动转换为 Markdown
 * 3. SEO 友好
 */
export default async function DashboardPage() {
  // 在服务端获取数据
  const { stats, platforms, trendingVideos, recentVideos } = await getDashboardData()

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toLocaleString()
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">数据看板</h1>
          <p className="text-muted-foreground mt-1">实时监控创作者数据和视频表现</p>
        </div>
        <RefreshButton />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="总账号数"
          value={formatNumber(stats.totalAccounts)}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="总视频数"
          value={formatNumber(stats.totalVideos)}
          icon={<Video className="w-5 h-5" />}
        />
        <StatCard
          title="总播放量"
          value={formatNumber(stats.totalViews)}
          icon={<Eye className="w-5 h-5" />}
        />
        <StatCard
          title="总点赞数"
          value={formatNumber(stats.totalLikes)}
          icon={<ThumbsUp className="w-5 h-5" />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_1.85fr] 2xl:grid-cols-[1.05fr_1.95fr]">
        <div className="space-y-4">
          <PlatformDistribution platforms={platforms} />
          <RecentVideos videos={recentVideos} />
        </div>

        <TrendingVideos videos={trendingVideos} />
      </div>
    </div>
  )
}
