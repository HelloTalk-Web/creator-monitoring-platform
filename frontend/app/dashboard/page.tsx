"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { StatCard } from "@/components/dashboard/stat-card"
import { TrendingVideos } from "@/components/dashboard/trending-videos"
import { RecentVideos } from "@/components/dashboard/recent-videos"
import { PlatformDistribution } from "@/components/dashboard/platform-distribution"
import { Users, Video, Eye, ThumbsUp, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

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
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    totalAccounts: 0,
    totalVideos: 0,
    totalViews: 0,
    totalLikes: 0
  })
  const [platforms, setPlatforms] = useState<PlatformStats[]>([])
  const [trendingVideos, setTrendingVideos] = useState<VideoData[]>([])
  const [recentVideos, setRecentVideos] = useState<VideoData[]>([])

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true)

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

      // 设置统计数据
      const statsData = statsResponse.data.data
      setStats(statsData.stats)
      setPlatforms(statsData.platforms)

      // 设置热门视频
      setTrendingVideos(trendingResponse.data.data.videos || [])

      // 设置最新视频
      setRecentVideos(recentResponse.data.data.videos || [])

      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
      setLoading(false)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toLocaleString()
  }

  const renderContent = () => (
    <>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">数据看板</h1>
          <p className="text-muted-foreground mt-1">实时监控创作者数据和视频表现</p>
        </div>
        <Button
          onClick={fetchDashboardData}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          刷新数据
        </Button>
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
    </>
  )

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[1600px] items-center justify-center px-6 py-8">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
      {renderContent()}
    </div>
  )
}
