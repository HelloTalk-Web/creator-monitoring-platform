"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Trash2, Video } from "lucide-react"
import axios from "axios"
import Link from "next/link"

interface Account {
  id: number
  profileUrl: string  // 后端字段名
  platformId: number
  displayName: string  // 后端字段名: displayName
  avatarUrl: string | null
  bio: string | null  // 后端字段名: bio
  followerCount: number | null  // 后端字段名: followerCount (单数)
  totalVideos: number  // 后端字段名: totalVideos
  lastScrapedAt: string  // 后端字段名: lastScrapedAt
  createdAt: string
  updatedAt: string
  platformName: string  // 后端字段名: platformName (如: tiktok, douyin)
  platformDisplayName: string  // 后端字段名: platformDisplayName (如: TikTok, 抖音)
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: {
    code: string
    message: string
  }
}

export default function HomePage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newAccountUrl, setNewAccountUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [totalCredits, setTotalCredits] = useState<number | null>(null)

  // 获取账号列表
  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const response = await axios.get<ApiResponse<{ accounts: Account[], total: number }>>("/api/platforms/accounts", {
        params: {
          page: 1,
          pageSize: 100,
          ...(searchQuery && { displayName: searchQuery })
        }
      })

      if (response.data.success) {
        setAccounts(response.data.data.accounts)
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
      const response = await axios.post<ApiResponse<{ accountId: number, videoCount: number }>>("/api/scrape/complete", {
        url: newAccountUrl
      })

      if (response.data.success) {
        setDialogOpen(false)
        setNewAccountUrl("")
        fetchAccounts() // 刷新列表
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
      const response = await axios.delete<ApiResponse<null>>(`/api/platforms/accounts/${id}`)

      if (response.data.success) {
        fetchAccounts() // 刷新列表
      }
    } catch (error) {
      console.error("删除账号失败:", error)
      alert("删除账号失败")
    }
  }

  // 获取积分余额
  const fetchCreditBalance = async () => {
    try {
      const response = await axios.get<ApiResponse<{ totalCredits: number, keysCount: number }>>("/api/scrape/credit-balance")
      if (response.data.success) {
        setTotalCredits(response.data.data.totalCredits)
      }
    } catch (error) {
      console.error("获取积分余额失败:", error)
    }
  }

  // 初始加载
  useEffect(() => {
    fetchAccounts()
    fetchCreditBalance()
  }, [])

  // 搜索
  const handleSearch = () => {
    fetchAccounts()
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* 积分余额显示 */}
      {totalCredits !== null && (
        <div className="mb-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">剩余积分</div>
                  <div className="text-2xl font-bold">{totalCredits.toLocaleString()}</div>
                </div>
                <Badge variant="outline" className="text-sm">
                  API 积分
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>创作者账号管理</CardTitle>
              <CardDescription>管理平台创作者账号和视频数据</CardDescription>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  添加账号
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>添加新账号</DialogTitle>
                  <DialogDescription>
                    输入创作者主页URL,系统将自动抓取账号信息和视频数据
                  </DialogDescription>
                </DialogHeader>
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
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleAddAccount} disabled={submitting}>
                    {submitting ? "添加中..." : "确认添加"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {/* 搜索栏 */}
          <div className="flex gap-2 mb-6">
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

          {/* 账号列表 */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无账号数据,点击"添加账号"开始添加
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => (
                <Card key={account.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {account.avatarUrl && (
                          <img
                            src={account.avatarUrl}
                            alt={account.displayName}
                            className="w-12 h-12 rounded-full"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{account.displayName}</CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {account.platformDisplayName}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs mt-1">
                            ID: {account.id}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {account.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {account.bio}
                        </p>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        {account.followerCount && (
                          <Badge variant="secondary">
                            粉丝: {account.followerCount.toLocaleString()}
                          </Badge>
                        )}
                        <Badge variant="secondary">
                          视频: {account.totalVideos}
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        最后同步: {new Date(account.lastScrapedAt).toLocaleString()}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Link href={`/videos/${account.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Video className="mr-2 h-4 w-4" />
                            查看作品数据
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAccount(account.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
