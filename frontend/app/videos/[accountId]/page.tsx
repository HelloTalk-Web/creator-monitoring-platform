"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Eye, Heart, MessageCircle, Share2, ExternalLink } from "lucide-react"
import axios from "axios"
import Link from "next/link"
import { useParams } from "next/navigation"

interface Video {
  id: number
  accountId: number
  platformVideoId: string  // 后端字段名
  title: string
  description: string | null
  thumbnailUrl: string | null  // 后端字段名: thumbnailUrl
  videoUrl: string
  publishedAt: string
  tags: string[]  // 标签数组
  viewCount: number | null  // 后端字段名: viewCount
  likeCount: number | null  // 后端字段名: likeCount
  commentCount: number | null  // 后端字段名: commentCount
  shareCount: number | null  // 后端字段名: shareCount
  duration: number | null
  firstScrapedAt: string  // 后端字段名
  lastUpdatedAt: string  // 后端字段名
}

interface Account {
  id: number
  displayName: string  // 后端字段名: displayName
  avatarUrl: string | null
  followerCount: number | null  // 后端字段名: followerCount (单数)
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: {
    code: string
    message: string
  }
}

export default function VideosPage() {
  const params = useParams()
  const accountId = params.accountId as string

  const [account, setAccount] = useState<Account | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [tagQuery, setTagQuery] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 12

  // 获取账号信息
  const fetchAccount = async () => {
    try {
      const response = await axios.get<ApiResponse<{ accounts: Account[] }>>("/api/platforms/accounts", {
        params: { accountId }
      })

      if (response.data.success && response.data.data.accounts.length > 0) {
        setAccount(response.data.data.accounts[0])
      }
    } catch (error) {
      console.error("获取账号信息失败:", error)
    }
  }

  // 获取视频列表
  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await axios.get<ApiResponse<{ videos: Video[], total: number }>>("/api/v1/videos", {
        params: {
          accountId,
          page,
          pageSize,
          ...(searchQuery && { title: searchQuery }),
          ...(tagQuery && { tag: tagQuery })
        }
      })

      if (response.data.success) {
        setVideos(response.data.data.videos)
        setTotal(response.data.data.total)
      }
    } catch (error) {
      console.error("获取视频列表失败:", error)
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    fetchAccount()
  }, [accountId])

  useEffect(() => {
    fetchVideos()
  }, [accountId, page])

  // 搜索
  const handleSearch = () => {
    setPage(1)
    fetchVideos()
  }

  // 格式化数字
  const formatNumber = (num: number | null) => {
    if (!num) return "0"
    if (num >= 10000) return `${(num / 10000).toFixed(1)}万`
    return num.toLocaleString()
  }

  // 格式化时长
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* 返回按钮和账号信息 */}
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回账号列表
          </Button>
        </Link>

        {account && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                {account.avatarUrl && (
                  <img
                    src={account.avatarUrl}
                    alt={account.displayName}
                    className="w-16 h-16 rounded-full"
                  />
                )}
                <div>
                  <CardTitle>{account.displayName}</CardTitle>
                  <CardDescription>
                    {account.followerCount && `粉丝: ${formatNumber(account.followerCount)} · `}
                    视频总数: {total}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* 搜索和筛选 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="搜索视频标题..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="按标签搜索（如：language, japanese）..."
                  value={tagQuery}
                  onChange={(e) => setTagQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 视频列表 */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">加载中...</div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          暂无视频数据
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((video) => (
              <Card key={video.id} className="overflow-hidden">
                <div className="relative aspect-[9/16] bg-muted">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // 如果图片加载失败,隐藏图片
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      无封面
                    </div>
                  )}
                  {video.duration && (
                    <Badge className="absolute bottom-2 right-2" variant="secondary">
                      {formatDuration(video.duration)}
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4">
                  <h3 className="font-medium text-sm line-clamp-2 mb-2 min-h-[40px]">
                    {video.title}
                  </h3>

                  {video.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {video.description}
                    </p>
                  )}

                  {/* 标签显示 */}
                  {video.tags && video.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {video.tags.slice(0, 3).map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs px-2 py-0 cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          onClick={() => {
                            setTagQuery(tag)
                            setPage(1)
                            setTimeout(() => fetchVideos(), 0)
                          }}
                        >
                          #{tag}
                        </Badge>
                      ))}
                      {video.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs px-2 py-0">
                          +{video.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {formatNumber(video.viewCount)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {formatNumber(video.likeCount)}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {formatNumber(video.commentCount)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Share2 className="h-3 w-3" />
                      {formatNumber(video.shareCount)}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mb-3">
                    发布: {new Date(video.publishedAt).toLocaleDateString()}
                  </div>

                  <a
                    href={video.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="mr-2 h-3 w-3" />
                      查看原视频
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 分页 */}
          {total > pageSize && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </Button>

              <div className="text-sm text-muted-foreground">
                第 {page} 页 / 共 {Math.ceil(total / pageSize)} 页
              </div>

              <Button
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / pageSize)}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
