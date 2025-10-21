"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Search, Eye, Heart, MessageCircle, Share2, ExternalLink, Flame, Calendar, ChevronDown, X, Download, RefreshCw, Info } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import axios from "axios"
import Link from "next/link"
import { getDisplayImageUrl } from "@/lib/utils"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

interface Video {
  id: number
  accountId: number
  platformVideoId: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  videoUrl: string
  pageUrl?: string
  publishedAt: string
  tags: string[]
  viewCount: number | null
  likeCount: number | null
  commentCount: number | null
  shareCount: number | null
  duration: number | null
  firstScrapedAt: string
  lastUpdatedAt: string
  // 后端返回的创作者和平台信息(平铺字段)
  creatorUsername?: string
  creatorDisplayName?: string
  platformName?: string
  platformDisplayName?: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: {
    code: string
    message: string
  }
}

interface Account {
  id: number
  username: string
  displayName: string
  avatarUrl: string | null
  platformName: string
  platformDisplayName: string
}

export default function AllVideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [appliedSearch, setAppliedSearch] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false)
  const [accountPopoverOpen, setAccountPopoverOpen] = useState(false)
  const [publishedAfter, setPublishedAfter] = useState("")
  const [publishedBefore, setPublishedBefore] = useState("")
  const [showPopularOnly, setShowPopularOnly] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all")
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [exportingFiltered, setExportingFiltered] = useState(false)
  const [exportingAll, setExportingAll] = useState(false)
  const [scrapingVideoId, setScrapingVideoId] = useState<number | null>(null)
  const [selectedVideoIds, setSelectedVideoIds] = useState<number[]>([])
  const [isBatchScraping, setIsBatchScraping] = useState(false)

  // 从视频数据中提取所有唯一标签
  const availableTags = Array.from(
    new Set([
      ...videos.flatMap(video => video.tags || []),
      ...selectedTags
    ])
  ).sort()

  // 获取账号列表
  const fetchAccounts = async () => {
    try {
      const response = await axios.get<ApiResponse<{
        accounts: Account[],
        pagination: { total: number }
      }>>(`${API_BASE_URL}/api/platforms/accounts`, {
        params: {
          page: 1,
          pageSize: 1000 // 获取所有账号用于筛选
        }
      })

      if (response.data.success) {
        setAccounts(response.data.data.accounts)
      }
    } catch (error) {
      console.error("获取账号列表失败:", error)
    }
  }

  // 获取视频列表
  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await axios.get<ApiResponse<{ videos: Video[], total: number }>>(`${API_BASE_URL}/api/v1/videos`, {
        params: {
          ...(selectedAccountId !== "all" && { accountId: selectedAccountId }),
          page,
          limit: pageSize,
          ...(appliedSearch && { title: appliedSearch }),
          ...(selectedTags.length > 0 && { tags: selectedTags.join(',') }),
          ...(publishedAfter && { publishedAfter }),
          ...(publishedBefore && { publishedBefore }),
          ...(showPopularOnly && { minViewCount: 10000 }),
          ...(selectedPlatform !== "all" && { platformName: selectedPlatform })
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
    fetchAccounts()
  }, [])

  useEffect(() => {
    fetchVideos()
  }, [page, pageSize, showPopularOnly, selectedTags, publishedAfter, publishedBefore, appliedSearch, selectedAccountId, selectedPlatform])

  // 搜索
  const handleSearch = () => {
    const normalizedQuery = searchQuery.trim()
    setPage(1)
    if (normalizedQuery === appliedSearch) {
      fetchVideos()
    } else {
      setAppliedSearch(normalizedQuery)
    }
  }

  // 导出当前筛选的视频
  const handleExportFiltered = async () => {
    try {
      setExportingFiltered(true)
      const response = await axios.get(`${API_BASE_URL}/api/v1/videos/export/filtered`, {
        params: {
          ...(selectedAccountId !== "all" && { accountId: selectedAccountId }),
          ...(appliedSearch && { title: appliedSearch }),
          ...(selectedTags.length > 0 && { tags: selectedTags.join(',') }),
          ...(publishedAfter && { publishedAfter }),
          ...(publishedBefore && { publishedBefore }),
          ...(showPopularOnly && { minViewCount: 10000 }),
          ...(selectedPlatform !== "all" && { platformName: selectedPlatform })
        },
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', '视频数据.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("导出筛选视频失败:", error)
      alert("导出失败,请稍后重试")
    } finally {
      setExportingFiltered(false)
    }
  }

  // 导出全部视频
  const handleExportAll = async () => {
    try {
      setExportingAll(true)
      const response = await axios.get(`${API_BASE_URL}/api/v1/videos/export/all`, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', '所有视频数据.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("导出全部视频失败:", error)
      alert("导出失败,请稍后重试")
    } finally {
      setExportingAll(false)
    }
  }

  // 重新抓取单个视频数据
  const handleScrapeVideo = async (video: Video) => {
    try {
      setScrapingVideoId(video.id)
      const videoUrl = video.pageUrl || video.videoUrl

      const response = await axios.post<ApiResponse<{ videoId: string, updated: boolean, message: string }>>(
        `${API_BASE_URL}/api/scrape/update-video`,
        { url: videoUrl }
      )

      if (response.data.success) {
        await fetchVideos()
        alert(`视频数据已更新: ${response.data.data.message}`)
      } else {
        alert(`更新失败: ${response.data.error?.message || '未知错误'}`)
      }
    } catch (error: any) {
      console.error("抓取视频失败:", error)
      const errorMessage = error.response?.data?.error?.message || error.message || '未知错误'
      alert(`抓取视频失败: ${errorMessage}`)
    } finally {
      setScrapingVideoId(null)
    }
  }

  // 批量抓取选中的视频
  const handleBatchScrape = async () => {
    if (selectedVideoIds.length === 0) {
      alert('请先选择要抓取的视频')
      return
    }

    if (!confirm(`确定要批量抓取 ${selectedVideoIds.length} 个视频吗？`)) {
      return
    }

    setIsBatchScraping(true)
    let successCount = 0
    let failCount = 0

    for (const videoId of selectedVideoIds) {
      const video = videos.find(v => v.id === videoId)
      if (!video) continue

      try {
        const videoUrl = video.pageUrl || video.videoUrl
        const response = await axios.post<ApiResponse<{ videoId: string, updated: boolean, message: string }>>(
          `${API_BASE_URL}/api/scrape/update-video`,
          { url: videoUrl }
        )

        if (response.data.success) {
          successCount++
        } else {
          failCount++
        }
      } catch (error) {
        console.error(`视频 ${video.title} 抓取失败:`, error)
        failCount++
      }

      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setIsBatchScraping(false)
    setSelectedVideoIds([])
    alert(`批量抓取完成！\n成功: ${successCount} 个\n失败: ${failCount} 个`)
    await fetchVideos()
  }

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedVideoIds.length === videos.length) {
      setSelectedVideoIds([])
    } else {
      setSelectedVideoIds(videos.map(v => v.id))
    }
  }

  // 切换单个视频选择
  const handleToggleVideo = (videoId: number) => {
    setSelectedVideoIds(prev =>
      prev.includes(videoId)
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    )
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

  // 判断是否为热门视频（播放量 >10k）
  const isPopularVideo = (viewCount: number | null) => {
    return viewCount && viewCount > 10000
  }

  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = total === 0 ? 0 : Math.min(page * pageSize, total)

  // 获取唯一平台列表
  const uniquePlatforms = Array.from(new Set(accounts.map(a => a.platformName)))

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>视频管理</CardTitle>
          <CardDescription>查看和管理所有平台的视频数据</CardDescription>
        </CardHeader>
      </Card>

      {/* 搜索和筛选 */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-6 pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full items-stretch gap-2 md:flex-1">
              <Input
                placeholder="输入标题关键词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} variant="secondary" className="gap-2">
                <Search className="h-4 w-4" />
                搜索
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={showPopularOnly ? "default" : "outline"}
                size="sm"
                className="whitespace-nowrap gap-2"
                onClick={() => {
                  setShowPopularOnly(!showPopularOnly)
                  setPage(1)
                }}
              >
                <Flame className="h-4 w-4" />
                {showPopularOnly ? "显示全部" : "只看热门"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPublishedAfter("")
                  setPublishedBefore("")
                  setSelectedTags([])
                  setSearchQuery("")
                  setAppliedSearch("")
                  setShowPopularOnly(false)
                  setSelectedAccountId("all")
                  setSelectedPlatform("all")
                  setTagPopoverOpen(false)
                  setAccountPopoverOpen(false)
                  setPage(1)
                }}
              >
                清除筛选
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                平台 / 账号
              </span>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <Select
                  value={selectedPlatform}
                  onValueChange={(value) => {
                    setSelectedPlatform(value)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="sm:w-[160px]">
                    <SelectValue placeholder="选择平台" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部平台</SelectItem>
                    {uniquePlatforms.map(platform => (
                      <SelectItem key={platform} value={platform}>
                        {accounts.find(a => a.platformName === platform)?.platformDisplayName || platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover open={accountPopoverOpen} onOpenChange={setAccountPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={accountPopoverOpen}
                      className="w-full justify-between font-normal sm:w-[220px]"
                    >
                      <span className="truncate">
                        {selectedAccountId === "all"
                          ? "全部账号"
                          : accounts.find(account => account.id.toString() === selectedAccountId)?.displayName || "选择账号"}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="搜索账号..." />
                      <CommandList>
                        <CommandEmpty>未找到账号</CommandEmpty>
                        <CommandGroup heading="账号">
                          <CommandItem
                            value="全部账号"
                            onSelect={() => {
                              setSelectedAccountId("all")
                              setPage(1)
                              setAccountPopoverOpen(false)
                            }}
                          >
                            全部账号
                          </CommandItem>
                          {accounts.map((account) => (
                            <CommandItem
                              key={account.id}
                              value={account.displayName}
                              onSelect={() => {
                                setSelectedAccountId(account.id.toString())
                                setPage(1)
                                setAccountPopoverOpen(false)
                              }}
                            >
                              {account.displayName}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                标签
              </span>
              <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={tagPopoverOpen}
                    className="w-full justify-between h-10 font-normal"
                  >
                    <span className="truncate">
                      {selectedTags.length > 0 ? `已选 ${selectedTags.length} 个标签` : "选择标签..."}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="搜索标签..." />
                    <CommandList>
                      <CommandEmpty>未找到标签</CommandEmpty>
                      <CommandGroup>
                        {availableTags.map((tag) => {
                          const isSelected = selectedTags.includes(tag)
                          return (
                            <CommandItem
                              key={tag}
                              value={tag}
                              onSelect={() => {
                                setSelectedTags((prev) =>
                                  isSelected
                                    ? prev.filter((t) => t !== tag)
                                    : [...prev, tag]
                                )
                                setPage(1)
                              }}
                            >
                              <Checkbox checked={isSelected} className="mr-2" />
                              <span>#{tag}</span>
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs pl-2 pr-1 py-0.5">
                      #{tag}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1 hover:bg-transparent"
                        onClick={() => {
                          setSelectedTags((prev) => prev.filter((t) => t !== tag))
                          setPage(1)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                发布日期范围
              </span>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <Input
                  type="date"
                  value={publishedAfter}
                  onChange={(e) => {
                    setPublishedAfter(e.target.value)
                    setPage(1)
                  }}
                />
                <span className="text-center text-sm text-muted-foreground md:w-12">至</span>
                <Input
                  type="date"
                  value={publishedBefore}
                  onChange={(e) => {
                    setPublishedBefore(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">批量操作:</span>
              <Button
                variant="default"
                size="sm"
                onClick={handleBatchScrape}
                disabled={isBatchScraping || selectedVideoIds.length === 0}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isBatchScraping ? 'animate-spin' : ''}`} />
                {isBatchScraping ? "抓取中..." : `批量抓取${selectedVideoIds.length > 0 ? ` (${selectedVideoIds.length})` : ''}`}
              </Button>
            </div>

            <div className="h-4 w-px bg-border" />

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">导出数据:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportFiltered}
                disabled={exportingFiltered || exportingAll}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {exportingFiltered ? "导出中..." : "导出当前筛选"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAll}
                disabled={exportingFiltered || exportingAll}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {exportingAll ? "导出中..." : "导出全部"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 视频列表 */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">加载中...</div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">暂无视频数据</div>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] pl-6">
                        <Checkbox
                          checked={selectedVideoIds.length === videos.length && videos.length > 0}
                          onCheckedChange={handleSelectAll}
                          aria-label="全选"
                        />
                      </TableHead>
                      <TableHead className="w-[100px]">封面</TableHead>
                      <TableHead className="w-[180px]">账号</TableHead>
                      <TableHead className="w-[240px]">标题</TableHead>
                      <TableHead className="w-[120px]">发布时间</TableHead>
                      <TableHead className="w-[90px] text-center">播放</TableHead>
                      <TableHead className="w-[80px] text-center">点赞</TableHead>
                      <TableHead className="w-[80px] text-center">评论</TableHead>
                      <TableHead className="w-[80px] text-center">分享</TableHead>
                      <TableHead className="w-[160px]">标签</TableHead>
                      <TableHead className="w-[100px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {videos.map((video) => {
                      const isPopular = isPopularVideo(video.viewCount)

                      return (
                        <TableRow
                          key={video.id}
                          className="odd:bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          <TableCell className="w-[50px] pl-6">
                            <Checkbox
                              checked={selectedVideoIds.includes(video.id)}
                              onCheckedChange={() => handleToggleVideo(video.id)}
                              aria-label={`选择 ${video.title || '视频'}`}
                            />
                          </TableCell>

                          <TableCell className="w-[100px]">
                            <div className="relative w-16 h-24 bg-muted rounded overflow-hidden shrink-0">
                              {video.thumbnailUrl ? (
                                <img
                                  src={getDisplayImageUrl(video.thumbnailUrl) ?? video.thumbnailUrl}
                                  alt={video.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none"
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                  无封面
                                </div>
                              )}
                              {isPopular && (
                                <div className="absolute top-1 right-1 rounded-full bg-background/80 p-1">
                                  <Flame className="h-3 w-3 text-orange-500" />
                                </div>
                              )}
                              {video.duration && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 py-0.5 text-center">
                                  {formatDuration(video.duration)}
                                </div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="w-[180px] align-top">
                            <Link href={`/videos/${video.accountId}`} className="block hover:underline">
                              <div className="flex items-start gap-2">
                                <div className="min-w-0 space-y-1">
                                  <div className="font-medium truncate">{video.creatorDisplayName || video.creatorUsername || "-"}</div>
                                  {video.platformDisplayName && (
                                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                                      {video.platformDisplayName}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Link>
                          </TableCell>

                          <TableCell className="w-[240px] align-top">
                            <div className="flex items-start gap-2">
                              <div className="relative flex-1 group" tabIndex={0}>
                                <span className="font-medium whitespace-normal break-all line-clamp-3">
                                  {video.title}
                                </span>
                                <div
                                  className="absolute left-0 top-full z-20 mt-1 hidden w-[30rem] rounded-md border bg-popover p-3 text-sm text-popover-foreground shadow-lg whitespace-normal break-all group-hover:block group-focus-within:block cursor-text"
                                  role="tooltip"
                                >
                                  {video.title}
                                </div>
                              </div>
                              {isPopular && <Flame className="h-4 w-4 text-orange-500 shrink-0" />}
                            </div>
                            {video.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                {video.description}
                              </p>
                            )}
                          </TableCell>

                          <TableCell className="w-[120px]">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                              <Calendar className="h-3 w-3" />
                              {new Date(video.publishedAt).toLocaleDateString("zh-CN", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit"
                              })}
                            </div>
                          </TableCell>

                          <TableCell className="w-[90px]">
                            <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                              <span className={isPopular ? "font-semibold" : ""}>
                                {formatNumber(video.viewCount)}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="w-[80px]">
                            <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                              <Heart className="h-4 w-4 text-muted-foreground" />
                              {formatNumber(video.likeCount)}
                            </div>
                          </TableCell>

                          <TableCell className="w-[80px]">
                            <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                              <MessageCircle className="h-4 w-4 text-muted-foreground" />
                              {formatNumber(video.commentCount)}
                            </div>
                          </TableCell>

                          <TableCell className="w-[80px]">
                            <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                              <Share2 className="h-4 w-4 text-muted-foreground" />
                              {formatNumber(video.shareCount)}
                            </div>
                          </TableCell>

                          <TableCell className="w-[160px] align-top">
                            {video.tags && video.tags.length > 0 ? (
                              <div className="relative flex flex-wrap gap-1 group">
                                {video.tags.slice(0, 2).map((tag, index) => (
                                  <Badge
                                    key={`${tag}-${index}`}
                                    variant="secondary"
                                    className="text-xs px-2 py-0 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                    onClick={() => {
                                      if (!selectedTags.includes(tag)) {
                                        setSelectedTags((prev) => [...prev, tag])
                                        setPage(1)
                                      }
                                    }}
                                  >
                                    #{tag}
                                  </Badge>
                                ))}
                                {video.tags.length > 2 && (
                                  <Badge variant="outline" className="text-xs px-2 py-0">
                                    +{video.tags.length - 2}
                                  </Badge>
                                )}
                                <div
                                  className="absolute left-0 top-full z-20 mt-1 hidden w-[26rem] rounded-md border bg-popover p-2 shadow-lg group-hover:flex group-focus-within:flex flex-wrap gap-1 cursor-default"
                                  role="tooltip"
                                >
                                  {video.tags.map((tag, index) => (
                                    <Badge
                                      key={`tooltip-${tag}-${index}`}
                                      variant="secondary"
                                      className="text-xs px-2 py-0 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                      onClick={() => {
                                        if (!selectedTags.includes(tag)) {
                                          setSelectedTags((prev) => [...prev, tag])
                                          setPage(1)
                                        }
                                      }}
                                    >
                                      #{tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          <TableCell className="w-[100px]">
                            <div className="flex flex-col gap-1">
                              <a
                                href={video.pageUrl || video.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="outline" size="sm" className="w-full gap-2">
                                  <ExternalLink className="h-3 w-3" />
                                  查看
                                </Button>
                              </a>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleScrapeVideo(video)}
                                disabled={scrapingVideoId === video.id}
                                className="w-full gap-2"
                              >
                                <RefreshCw className={`h-3 w-3 ${scrapingVideoId === video.id ? "animate-spin" : ""}`} />
                                {scrapingVideoId === video.id ? "抓取中..." : "抓取"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* 分页 */}
          {total > 0 && (
            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-muted-foreground">
                显示第 {rangeStart} - {rangeEnd} 条 · 共 {total} 条
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">每页:</span>
                {[10, 20, 50, 100].map((size) => (
                  <Button
                    key={size}
                    variant={pageSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setPageSize(size)
                      setPage(1)
                    }}
                  >
                    {size}
                  </Button>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    上一页
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    第 {page} / {totalPages} 页
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= totalPages}
                  >
                    下一页
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
