import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart } from "lucide-react"

interface PlatformStats {
  platformName: string
  count: number
  color: string
}

interface PlatformDistributionProps {
  platforms: PlatformStats[]
}

export function PlatformDistribution({ platforms }: PlatformDistributionProps) {
  const total = platforms.reduce((sum, p) => sum + p.count, 0)

  const platformColors: Record<string, string> = {
    tiktok: "#000000",
    douyin: "#000000",
    youtube: "#FF0000",
    instagram: "#E4405F",
    twitter: "#1DA1F2",
    facebook: "#1877F2"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="w-5 h-5" />
          平台分布
        </CardTitle>
      </CardHeader>
      <CardContent>
        {platforms.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            暂无数据
          </div>
        ) : (
          <div className="space-y-4">
            {/* 简单的条形图 */}
            <div className="space-y-3">
              {platforms.map((platform) => {
                const percentage = Math.round((platform.count / total) * 100)
                const color = platformColors[platform.platformName.toLowerCase()] || "#6B7280"

                return (
                  <div key={platform.platformName}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize">
                        {platform.platformName}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {platform.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full transition-all duration-500 ease-out rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: color
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 总计 */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">总计</span>
                <span className="text-lg font-bold">{total}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
