"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ArrowLeft, Search, Eye, Heart, MessageCircle, Share2, ExternalLink, Flame, Calendar, ChevronDown, X } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  username: string
  displayName: string
  avatarUrl: string | null
  profileUrl: string | null
  bio: string | null
  followerCount: number | null
  followingCount: number | null
  totalVideos: number | null
  platformName: string | null
  platformDisplayName: string | null
  platformColor: string | null
  lastScrapedAt: string | null
  lastVideoCrawlAt?: string | null
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
  const [appliedSearch, setAppliedSearch] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false)
  const [publishedAfter, setPublishedAfter] = useState("")
  const [publishedBefore, setPublishedBefore] = useState("")
  const [showPopularOnly, setShowPopularOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // 从视频数据中提取所有唯一标签
  const availableTags = Array.from(
    new Set([
      ...videos.flatMap(video => video.tags || []),
      ...selectedTags
    ])
  ).sort()

  // 获取账号信息
  const fetchAccount = async () => {
    try {
      const response = await axios.get<ApiResponse<{ account: Account }>>(
        `/api/platforms/accounts/${accountId}`
      )

      if (response.data.success && response.data.data.account) {
        setAccount(response.data.data.account)
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
          limit: pageSize,
          ...(appliedSearch && { title: appliedSearch }),
          ...(selectedTags.length > 0 && { tags: selectedTags.join(',') }),
          ...(publishedAfter && { publishedAfter }),
          ...(publishedBefore && { publishedBefore }),
          ...(showPopularOnly && { minViewCount: 10000 })
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
  }, [accountId, page, pageSize, showPopularOnly, selectedTags, publishedAfter, publishedBefore, appliedSearch])

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

  const formatDateTime = (value: string | null) => {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  // 判断是否为热门视频（播放量 >10k）
  const isPopularVideo = (viewCount: number | null) => {
    return viewCount && viewCount > 10000
  }

  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = total === 0 ? 0 : Math.min(page * pageSize, total)

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
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  {account.avatarUrl && (
                    <img
                      src={account.avatarUrl}
                      alt={account.displayName}
                      className="w-16 h-16 rounded-full border border-border object-cover"
                    />
                  )}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>{account.displayName}</CardTitle>
                      {account.platformDisplayName && (
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={account.platformColor ? { backgroundColor: account.platformColor, color: "#fff" } : undefined}
                        >
                          {account.platformDisplayName}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      {account.username && <span>@{account.username}</span>}
                      {account.followerCount != null && (
                        <span>粉丝 {formatNumber(account.followerCount)}</span>
                      )}
                      {account.followingCount != null && account.followingCount > 0 && (
                        <span>关注 {formatNumber(account.followingCount)}</span>
                      )}
                      {account.totalVideos != null && (
                        <span>作品 {formatNumber(account.totalVideos)}</span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>最后同步：{formatDateTime(account.lastScrapedAt)}</div>
                  {account.profileUrl && (
                    <Link
                      href={account.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      查看平台主页
                    </Link>
                  )}
                </div>
              </div>
              {account.bio && (
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {account.bio}
                </p>
              )}
            </CardHeader>
          </Card>
        )}
      </div>

      {/* 搜索和筛选 */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4">
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
                onClick={() => {
                  setShowPopularOnly(!showPopularOnly)
                  setPage(1)
                }}
                className="whitespace-nowrap"
              >
                <Flame className="h-4 w-4 mr-1" />
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
                  setTagPopoverOpen(false)
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
                      {selectedTags.length > 0
                        ? `已选 ${selectedTags.length} 个标签`
                        : "选择标签..."}
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
                              <Checkbox
                                checked={isSelected}
                                className="mr-2"
                              />
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
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs pl-2 pr-1 py-0.5"
                    >
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
            <div className="flex flex-col gap-2 md:col-span-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                发布时间范围
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
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px] pl-6">封面</TableHead>
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
                        {/* 封面 */}
                        <TableCell className="w-[100px] pl-6">
                          <div className="relative w-16 h-24 bg-muted rounded overflow-hidden shrink-0">
                            {video.thumbnailUrl ? (
                              <img
                                src={video.thumbnailUrl}
                                alt={video.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                无封面
                              </div>
                            )}
                            {isPopular && (
                              <div className="absolute top-1 right-1 rounded-full bg-background/80 p-1 shadow-sm">
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

                        {/* 标题 */}
                        <TableCell className="w-[240px] align-top">
                          <div className="flex items-start gap-2">
                            <div className="relative flex-1 group" tabIndex={0}>
                              <span className="font-medium whitespace-normal break-words line-clamp-3">
                                {video.title}
                              </span>
                              <div
                                className="absolute left-0 top-full z-20 mt-1 hidden w-[30rem] rounded-md border bg-popover p-3 text-sm text-popover-foreground shadow-lg whitespace-normal break-words group-hover:block group-focus-within:block cursor-text"
                                role="tooltip"
                              >
                                {video.title}
                              </div>
                            </div>
                            {isPopular && (
                              <Flame className="h-4 w-4 text-orange-500 shrink-0" />
                            )}
                          </div>
                          {video.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                              {video.description}
                            </p>
                          )}
                        </TableCell>

                        {/* 发布时间 */}
                        <TableCell className="w-[120px]">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                            <Calendar className="h-3 w-3" />
                            {new Date(video.publishedAt).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                          </div>
                        </TableCell>

                        {/* 播放量 */}
                        <TableCell className="w-[90px]">
                          <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <span className={isPopular ? "font-semibold" : ""}>
                              {formatNumber(video.viewCount)}
                            </span>
                          </div>
                        </TableCell>

                        {/* 点赞 */}
                        <TableCell className="w-[80px]">
                          <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                            <Heart className="h-4 w-4 text-muted-foreground" />
                            {formatNumber(video.likeCount)}
                          </div>
                        </TableCell>

                        {/* 评论 */}
                        <TableCell className="w-[80px]">
                          <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                            <MessageCircle className="h-4 w-4 text-muted-foreground" />
                            {formatNumber(video.commentCount)}
                          </div>
                        </TableCell>

                        {/* 分享 */}
                        <TableCell className="w-[80px]">
                          <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                            <Share2 className="h-4 w-4 text-muted-foreground" />
                            {formatNumber(video.shareCount)}
                          </div>
                        </TableCell>

                        {/* 标签 */}
                        <TableCell className="w-[160px] align-top">
                          {video.tags && video.tags.length > 0 ? (
                            <div className="relative group" tabIndex={0}>
                              <div className="flex flex-wrap gap-1">
                                {video.tags.slice(0, 2).map((tag, index) => (
                                  <Badge
                                    key={`${tag}-${index}`}
                                    variant="secondary"
                                    className="text-xs px-2 py-0 cursor-pointer hover:bg-primary hover:text-primary-foreground"
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
                              </div>
                              <div
                                className="absolute left-0 top-full z-20 mt-1 hidden w-[26rem] rounded-md border bg-popover p-2 shadow-lg group-hover:flex group-focus-within:flex flex-wrap gap-1 cursor-default"
                                role="tooltip"
                              >
                                {video.tags.map((tag, index) => (
                                  <Badge
                                    key={`tooltip-${tag}-${index}`}
                                    variant="secondary"
                                    className="text-xs px-2 py-0 cursor-pointer hover:bg-primary hover:text-primary-foreground"
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

                        {/* 操作 */}
                        <TableCell className="w-[100px]">
                          <a
                            href={video.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              <ExternalLink className="mr-1 h-3 w-3" />
                              查看
                            </Button>
                          </a>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* 分页和数据统计 */}
          {total > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                <div>
                  显示第 {rangeStart} - {rangeEnd} 条 · 共 {total} 条
                </div>
                <div className="flex items-center gap-2">
                  <span>每页显示:</span>
                  <div className="flex gap-1">
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
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col items-center gap-3 md:flex-row md:justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    上一页
                  </Button>

                  <div className="text-sm text-muted-foreground">
                    第 {page} 页 / 共 {totalPages} 页
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
