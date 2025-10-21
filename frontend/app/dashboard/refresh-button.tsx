"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

/**
 * 刷新按钮组件 (客户端组件)
 *
 * 用于在 SSR 页面中提供刷新功能
 */
export function RefreshButton() {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    // 刷新当前页面(重新获取服务端数据)
    router.refresh()
    // 延迟恢复按钮状态
    setTimeout(() => setRefreshing(false), 1000)
  }

  return (
    <Button
      onClick={handleRefresh}
      disabled={refreshing}
      variant="outline"
      size="sm"
    >
      <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
      刷新数据
    </Button>
  )
}
