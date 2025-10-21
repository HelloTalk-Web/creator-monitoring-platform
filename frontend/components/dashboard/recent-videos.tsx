"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"
import Image from "next/image"
import { getDisplayImageUrl } from "@/lib/utils"

interface Video {
  id: number
  title: string
  thumbnailUrl: string
  pageUrl: string | null
  publishedAt: string
  creatorDisplayName: string
  platformDisplayName: string
  duration: number
}

interface RecentVideosProps {
  videos: Video[]
}

export function RecentVideos({ videos }: RecentVideosProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return '刚刚'
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}分钟前`
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}小时前`
    } else if (diffInSeconds < 2592000) {
      return `${Math.floor(diffInSeconds / 86400)}天前`
    } else {
      return date.toLocaleDateString('zh-CN')
    }
  }

  const handleVideoClick = (pageUrl: string | null) => {
    if (pageUrl) {
      window.open(pageUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          最新视频
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {videos.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              暂无数据
            </div>
          ) : (
            videos.map((video) => (
              <div
                key={video.id}
                onClick={() => handleVideoClick(video.pageUrl)}
                className="flex gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
              >
                <div className="flex-shrink-0 relative">
                  <div className="w-32 h-20 bg-muted rounded overflow-hidden relative">
                    {video.thumbnailUrl ? (
                      <Image
                        src={getDisplayImageUrl(video.thumbnailUrl) ?? video.thumbnailUrl}
                        alt={video.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        无封面
                      </div>
                    )}
                    {video.duration > 0 && (
                      <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
                        {formatDuration(video.duration)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium line-clamp-2 break-all mb-1">
                    {video.title}
                  </h4>
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>{video.creatorDisplayName}</span>
                      <span>•</span>
                      <span>{video.platformDisplayName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(video.publishedAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
