import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, ThumbsUp, MessageCircle } from "lucide-react"
import Image from "next/image"

interface Video {
  id: number
  title: string
  thumbnailUrl: string
  pageUrl: string | null
  viewCount: number
  likeCount: number
  commentCount: number
  creatorDisplayName: string
  platformDisplayName: string
}

interface TrendingVideosProps {
  videos: Video[]
}

export function TrendingVideos({ videos }: TrendingVideosProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
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
          🔥 热门视频
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {videos.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              暂无数据
            </div>
          ) : (
            videos.map((video, index) => (
              <div
                key={video.id}
                onClick={() => handleVideoClick(video.pageUrl)}
                className="flex gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
              >
                <div className="flex-shrink-0 relative">
                  <div className="w-24 h-16 bg-muted rounded overflow-hidden relative">
                    {video.thumbnailUrl ? (
                      <Image
                        src={video.thumbnailUrl}
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
                  </div>
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium line-clamp-2 mb-1">
                    {video.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span>{video.creatorDisplayName}</span>
                    <span>•</span>
                    <span>{video.platformDisplayName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatNumber(video.viewCount)}
                    </span>
                    {video.likeCount > 0 && (
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {formatNumber(video.likeCount)}
                      </span>
                    )}
                    {video.commentCount > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {formatNumber(video.commentCount)}
                      </span>
                    )}
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
