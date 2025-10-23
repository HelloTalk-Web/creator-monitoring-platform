'use client'

import { useState } from 'react'
import { getDisplayImageUrl } from '@/lib/utils'

interface UnifiedImageProps {
  type: 'avatar' | 'thumbnail'
  id: number
  alt?: string
  className?: string
  width?: number
  height?: number
  onError?: () => void
}

/**
 * 统一图片组件
 *
 * 功能:
 * - 自动调用统一图片API (/api/images/:type/:id)
 * - 处理加载错误并显示占位图
 * - 支持自定义样式和尺寸
 *
 * 使用示例:
 * ```tsx
 * <UnifiedImage type="avatar" id={account.id} alt={account.username} />
 * <UnifiedImage type="thumbnail" id={video.id} alt={video.title} />
 * ```
 */
export function UnifiedImage({
  type,
  id,
  alt = '',
  className = '',
  width,
  height,
  onError
}: UnifiedImageProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 获取统一图片URL
  const imageUrl = getDisplayImageUrl(type, id)

  // 占位图URL (如果图片加载失败,后端会自动返回占位图,但这里也提供一个fallback)
  const placeholderUrl = type === 'avatar'
    ? '/placeholder-avatar.svg'
    : '/placeholder-video.svg'

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
    onError?.()
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  return (
    <img
      src={hasError ? placeholderUrl : imageUrl}
      alt={alt}
      className={`${className} ${isLoading ? 'opacity-50' : 'opacity-100'} transition-opacity duration-300`}
      width={width}
      height={height}
      onError={handleError}
      onLoad={handleLoad}
      loading="lazy"
    />
  )
}

/**
 * Avatar 图片组件 (语法糖)
 */
export function AvatarImage({
  id,
  alt = 'Avatar',
  className = 'rounded-full',
  ...props
}: Omit<UnifiedImageProps, 'type'>) {
  return <UnifiedImage type="avatar" id={id} alt={alt} className={className} {...props} />
}

/**
 * 缩略图组件 (语法糖)
 */
export function ThumbnailImage({
  id,
  alt = 'Thumbnail',
  className = 'rounded-lg',
  ...props
}: Omit<UnifiedImageProps, 'type'>) {
  return <UnifiedImage type="thumbnail" id={id} alt={alt} className={className} {...props} />
}
