"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Trash2, Video, Upload, ChevronLeft, ChevronRight } from "lucide-react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { resolveApiBaseUrl } from "@/lib/utils"
import { AvatarImage } from "@/components/common/Image"

interface Account {
  id: number
  profileUrl: string
  platformId: number
  displayName: string
  avatarUrl: string | null
  localAvatarUrl: string | null
  bio: string | null
  followerCount: number | null
  totalVideos: number
  lastScrapedAt: string
  createdAt: string
  updatedAt: string
  platformName: string
  platformDisplayName: string
}

interface Platform {
  id: number
  name: string
  displayName: string
  baseUrl: string
  urlPattern: string
  colorCode: string
  iconUrl: string | null
  rateLimit: number
  supportedFeatures: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: {
    code: string
    message: string
  }
}

const VIDEO_LIMIT_OPTIONS = [10, 20, 30, 50, 100, 200, 300, 500]
const API_BASE_URL = resolveApiBaseUrl()

export default function HomePage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [platformFilter, setPlatformFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newAccountUrl, setNewAccountUrl] = useState("")
  const [videoLimit, setVideoLimit] = useState<string>("auto")
  const [submitting, setSubmitting] = useState(false)
  const [totalCredits, setTotalCredits] = useState<number | null>(null)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [platformsLoading, setPlatformsLoading] = useState(true)

  // 批量导入相关状态
  const [batchUrls, setBatchUrls] = useState("")

  // 防抖相关ref
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const [batchResults, setBatchResults] = useState<Array<{ url: string; success: boolean; message: string }>>([])
  const [batchProcessing, setBatchProcessing] = useState(false)

  // 计算总页数
  const totalPages = Math.ceil(total / pageSize)

  // 获取平台列表
  const fetchPlatforms = async () => {
    try {
      setPlatformsLoading(true)
      const response = await axios.get<ApiResponse<Platform[]>>(`${API_BASE_URL}/api/platforms`)

      if (response.data.success) {
        setPlatforms(response.data.data)
      }
    } catch (error) {
      console.error("获取平台列表失败:", error)
    } finally {
      setPlatformsLoading(false)
    }
  }

  // 防抖版本的获取账号列表
  const fetchAccountsDebounced = useCallback(() => {
    const key = `fetchAccounts-${currentPage}-${platformFilter}-${searchQuery}`

    // 清除之前的定时器
    const prevTimer = debounceTimers.current.get(key)
    if (prevTimer) {
      clearTimeout(prevTimer)
    }

    // 设置新的防抖定时器
    const timer = setTimeout(async () => {
      try {
        setLoading(true)
        const response = await axios.get<ApiResponse<{
          accounts: Account[],
          pagination: { total: number, page: number, limit: number, totalPages: number }
        }>>(`${API_BASE_URL}/api/platforms/accounts`, {
          params: {
            page: currentPage,
            pageSize: pageSize,
            ...(searchQuery && { displayName: searchQuery }),
            ...(platformFilter !== "all" && { platformName: platformFilter })
          }
        })

        if (response.data.success) {
          setAccounts(response.data.data.accounts)
          setTotal(response.data.data.pagination.total)
        }
      } catch (error) {
        console.error("获取账号列表失败:", error)
      } finally {
        setLoading(false)
      }

      // 清理定时器引用
      debounceTimers.current.delete(key)
    }, 300) // 300ms防抖延迟

    debounceTimers.current.set(key, timer)
  }, [currentPage, platformFilter, searchQuery, pageSize])

  // 原始版本（供立即调用使用）
  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const response = await axios.get<ApiResponse<{
        accounts: Account[],
        pagination: { total: number, page: number, limit: number, totalPages: number }
      }>>(`${API_BASE_URL}/api/platforms/accounts`, {
        params: {
          page: currentPage,
          pageSize: pageSize,
          ...(searchQuery && { displayName: searchQuery }),
          ...(platformFilter !== "all" && { platformName: platformFilter })
        }
      })

      if (response.data.success) {
        setAccounts(response.data.data.accounts)
        setTotal(response.data.data.pagination.total)
      }
    } catch (error) {
      console.error("获取账号列表失败:", error)
    } finally {
      setLoading(false)
    }
  }

  // 添加新账号
  const handleAddAccount = async () => {
    if (!newAccountUrl.trim()) return

    try {
      setSubmitting(true)
      const limitValue = videoLimit === "auto" ? undefined : Number(videoLimit)
      const payload: Record<string, unknown> = { url: newAccountUrl }
      if (limitValue !== undefined && !Number.isNaN(limitValue)) {
        payload.videoLimit = limitValue
      }

      const response = await axios.post<ApiResponse<{ accountId: number, videosCount: number }>>(
        `${API_BASE_URL}/api/scrape/complete`,
        payload
      )

      if (response.data.success) {
        setDialogOpen(false)
        setNewAccountUrl("")
        fetchAccounts()
      }
    } catch (error) {
      console.error("添加账号失败:", error)
      alert("添加账号失败,请检查URL是否正确")
    } finally {
      setSubmitting(false)
    }
  }

  // 删除账号
  const handleDeleteAccount = async (id: number) => {
    if (!confirm("确定要删除这个账号吗?")) return

    try {
      const response = await axios.delete<ApiResponse<null>>(`${API_BASE_URL}/api/platforms/accounts/${id}`)

      if (response.data.success) {
        fetchAccounts()
      }
    } catch (error) {
      console.error("删除账号失败:", error)
      alert("删除账号失败")
    }
  }

  // 获取积分余额
  const fetchCreditBalance = async () => {
    try {
      const response = await axios.get<ApiResponse<{ totalCredits: number, keysCount: number }>>(`${API_BASE_URL}/api/scrape/credit-balance`)
      if (response.data.success) {
        setTotalCredits(response.data.data.totalCredits)
      }
    } catch (error) {
      console.error("获取积分余额失败:", error)
    }
  }

  // 初始加载平台列表
  useEffect(() => {
    fetchPlatforms()
  }, [])

  // 初始加载和依赖变化时重新加载
  useEffect(() => {
    fetchAccountsDebounced()
  }, [currentPage, platformFilter, fetchAccountsDebounced])

  useEffect(() => {
    fetchCreditBalance()
  }, [])

  // 搜索
  const handleSearch = () => {
    setCurrentPage(1)
    fetchAccountsDebounced()
  }

  // 批量导入账号
  const handleBatchImport = async () => {
    if (!batchUrls.trim()) return

    const urls = batchUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0)

    if (urls.length === 0) {
      alert("请输入至少一个URL")
      return
    }

    setBatchProcessing(true)
    setBatchResults([])

    const results: Array<{ url: string; success: boolean; message: string }> = []
    const limitValue = videoLimit === "auto" ? undefined : Number(videoLimit)

    for (const url of urls) {
      try {
        const payload: Record<string, unknown> = { url }
        if (limitValue !== undefined && !Number.isNaN(limitValue)) {
          payload.videoLimit = limitValue
        }

        const response = await axios.post<ApiResponse<{ accountId: number, videosCount: number }>>(
        `${API_BASE_URL}/api/scrape/complete`,
          payload
        )

        if (response.data.success) {
          results.push({
            url,
            success: true,
            message: `成功添加,导入了 ${response.data.data.videosCount || 0} 个视频`
          })
        } else {
          results.push({
            url,
            success: false,
            message: response.data.error?.message || "添加失败"
          })
        }
      } catch (error: any) {
        results.push({
          url,
          success: false,
          message: error.response?.data?.error?.message || error.message || "添加失败"
        })
      }

      setBatchResults([...results])
    }

    setBatchProcessing(false)
    fetchAccounts()
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <div>
                  <CardTitle>创作者账号管理</CardTitle>
                  <CardDescription>管理平台创作者账号和视频数据</CardDescription>
                </div>
                {totalCredits !== null && (
                  <div className="flex items-center gap-2 ml-6">
                    <div className="text-sm text-muted-foreground">剩余积分:</div>
                    <div className="text-lg font-semibold">{totalCredits.toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  添加账号
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>添加新账号</DialogTitle>
                  <DialogDescription>
                    输入创作者主页URL,系统将自动抓取账号信息和视频数据
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="single" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="single">单个添加</TabsTrigger>
                    <TabsTrigger value="batch">批量导入</TabsTrigger>
                  </TabsList>

                  <TabsContent value="single">
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="url">账号URL</Label>
                        <Input
                          id="url"
                          placeholder="https://www.douyin.com/user/..."
                          value={newAccountUrl}
                          onChange={(e) => setNewAccountUrl(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="video-limit">抓取视频数量</Label>
                        <Select value={videoLimit} onValueChange={setVideoLimit}>
                          <SelectTrigger id="video-limit" className="w-[200px]">
                            <SelectValue placeholder="选择抓取数量" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">自动 (最多 100 条)</SelectItem>
                            {VIDEO_LIMIT_OPTIONS.map((option) => (
                              <SelectItem key={option} value={String(option)}>
                                前 {option} 条视频
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          系统将同步 {videoLimit === "auto" ? "最近最多 100 条视频" : `最近的 ${videoLimit} 条视频`} 数据
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleAddAccount} disabled={submitting}>
                        {submitting ? "添加中..." : "确认添加"}
                      </Button>
                    </DialogFooter>
                  </TabsContent>

                  <TabsContent value="batch">
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="batch-urls">批量URL (每行一个)</Label>
                        <Textarea
                          id="batch-urls"
                          placeholder="https://www.douyin.com/user/xxx&#10;https://www.youtube.com/@xxx&#10;https://www.tiktok.com/@xxx"
                          value={batchUrls}
                          onChange={(e) => setBatchUrls(e.target.value)}
                          className="min-h-[200px] font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          支持 TikTok、YouTube、抖音等平台URL,每行一个
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="batch-video-limit">抓取视频数量</Label>
                        <Select value={videoLimit} onValueChange={setVideoLimit}>
                          <SelectTrigger id="batch-video-limit" className="w-[200px]">
                            <SelectValue placeholder="选择抓取数量" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">自动 (最多 100 条)</SelectItem>
                            {VIDEO_LIMIT_OPTIONS.map((option) => (
                              <SelectItem key={option} value={String(option)}>
                                前 {option} 条视频
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          批量导入时，每个账号将同步 {videoLimit === "auto" ? "最近最多 100 条视频" : `最近的 ${videoLimit} 条视频`}
                        </p>
                      </div>

                      {batchResults.length > 0 && (
                        <div className="grid gap-2 max-h-[300px] overflow-y-auto border rounded-md p-3">
                          <div className="text-sm font-medium mb-2">
                            导入结果 ({batchResults.filter(r => r.success).length}/{batchResults.length} 成功)
                          </div>
                          {batchResults.map((result, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              {result.success ? (
                                <Badge variant="default" className="shrink-0">成功</Badge>
                              ) : (
                                <Badge variant="destructive" className="shrink-0">失败</Badge>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="truncate text-muted-foreground">{result.url}</div>
                                <div className="text-xs mt-1">{result.message}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setDialogOpen(false)
                        setBatchUrls("")
                        setBatchResults([])
                      }}>
                        关闭
                      </Button>
                      <Button onClick={handleBatchImport} disabled={batchProcessing}>
                        {batchProcessing ? (
                          <span className="flex items-center gap-2">
                            <Upload className="h-4 w-4 animate-spin" />
                            导入中... ({batchResults.length})
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            开始导入
                          </span>
                        )}
                      </Button>
                    </DialogFooter>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {/* 筛选栏 */}
          <div className="flex gap-2 mb-6">
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择平台" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部平台</SelectItem>
                {!platformsLoading && platforms.map((platform) => (
                  <SelectItem key={platform.id} value={platform.name}>
                    {platform.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1">
              <Input
                placeholder="搜索账号名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* 账号表格 */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无账号数据,点击"添加账号"开始添加
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">ID</TableHead>
                      <TableHead className="w-[250px]">账号信息</TableHead>
                      <TableHead className="w-[100px]">平台</TableHead>
                      <TableHead className="w-[120px]">粉丝数</TableHead>
                      <TableHead className="w-[100px]">视频数</TableHead>
                      <TableHead className="w-[180px]">最后同步</TableHead>
                      <TableHead className="w-[150px] text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <AvatarImage
                              id={account.id}
                              alt={account.displayName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{account.displayName}</div>
                              {account.bio && (
                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {account.bio}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{account.platformDisplayName}</Badge>
                        </TableCell>
                        <TableCell>
                          {account.followerCount ? account.followerCount.toLocaleString() : "-"}
                        </TableCell>
                        <TableCell>{account.totalVideos}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(account.lastScrapedAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/videos/?accountId=${account.id}`)}
                            >
                              <Video className="mr-1 h-4 w-4" />
                              查看该账号视频数据
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAccount(account.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 分页控件 */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  共 {total} 条记录,第 {currentPage} / {totalPages} 页
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )

  // 清理防抖定时器
  useEffect(() => {
    return () => {
      // 组件卸载时清除所有定时器
      debounceTimers.current.forEach(timer => clearTimeout(timer))
      debounceTimers.current.clear()
    }
  }, [])
}
