# 图片组件使用文档

本文档描述简化后的图片组件使用方法。

## 概述

新的图片组件提供:
- **简化的API**: 只需传入ID,无需处理URL逻辑
- **自动错误处理**: 自动降级到占位图
- **加载状态**: 内置加载动画
- **性能优化**: 懒加载支持

---

## 组件列表

### 1. UnifiedImage (基础组件)

通用图片组件,支持所有图片类型。

#### Props

```typescript
interface UnifiedImageProps {
  type: 'avatar' | 'thumbnail';  // 图片类型
  id: number;                     // 实体ID
  alt?: string;                   // Alt文本
  className?: string;             // 自定义样式
  width?: number;                 // 宽度
  height?: number;                // 高度
  onError?: () => void;           // 错误回调
}
```

#### 示例

```tsx
import { UnifiedImage } from '@/components/common/Image'

<UnifiedImage
  type="avatar"
  id={123}
  alt="用户头像"
  className="w-16 h-16 rounded-full"
/>
```

---

### 2. AvatarImage (推荐)

专门用于显示账号头像的组件。

#### Props

```typescript
interface AvatarImageProps {
  id: number;                // 账号ID (必需)
  alt?: string;              // Alt文本 (默认: "Avatar")
  className?: string;        // 自定义样式 (默认: "rounded-full")
  width?: number;            // 宽度
  height?: number;           // 高度
  onError?: () => void;      // 错误回调
}
```

#### 示例

```tsx
import { AvatarImage } from '@/components/common/Image'

// 基础用法
<AvatarImage id={account.id} />

// 自定义样式
<AvatarImage
  id={account.id}
  alt={account.displayName}
  className="w-10 h-10 rounded-full object-cover"
/>

// 错误处理
<AvatarImage
  id={account.id}
  onError={() => console.log('头像加载失败')}
/>
```

---

### 3. ThumbnailImage (推荐)

专门用于显示视频缩略图的组件。

#### Props

```typescript
interface ThumbnailImageProps {
  id: number;                // 视频ID (必需)
  alt?: string;              // Alt文本 (默认: "Thumbnail")
  className?: string;        // 自定义样式 (默认: "rounded-lg")
  width?: number;            // 宽度
  height?: number;           // 高度
  onError?: () => void;      // 错误回调
}
```

#### 示例

```tsx
import { ThumbnailImage } from '@/components/common/Image'

// 基础用法
<ThumbnailImage id={video.id} />

// 自定义样式
<ThumbnailImage
  id={video.id}
  alt={video.title}
  className="w-32 h-20 rounded-lg object-cover"
/>
```

---

## 完整示例

### 账号列表页面

```tsx
// app/accounts/page.tsx
import { AvatarImage } from '@/components/common/Image'

export default function AccountsPage() {
  const accounts = await fetchAccounts()

  return (
    <div className="grid grid-cols-3 gap-4">
      {accounts.map(account => (
        <div key={account.id} className="flex items-center gap-3">
          {/* 简化前: 复杂的URL处理 */}
          {/* <img src={getDisplayImageUrl(account.avatarUrl, account.localAvatarUrl)} /> */}

          {/* 简化后: 只需传入ID */}
          <AvatarImage
            id={account.id}
            alt={account.displayName}
            className="w-10 h-10 rounded-full"
          />

          <span>{account.displayName}</span>
        </div>
      ))}
    </div>
  )
}
```

### 视频列表页面

```tsx
// app/videos/page.tsx
import { ThumbnailImage, AvatarImage } from '@/components/common/Image'

export default function VideosPage() {
  const videos = await fetchVideos()

  return (
    <div className="grid grid-cols-4 gap-4">
      {videos.map(video => (
        <div key={video.id} className="space-y-2">
          {/* 视频缩略图 */}
          <div className="relative">
            <ThumbnailImage
              id={video.id}
              alt={video.title}
              className="w-full h-40 rounded-lg object-cover"
            />

            {/* 时长标签 */}
            {video.duration > 0 && (
              <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                {formatDuration(video.duration)}
              </span>
            )}
          </div>

          {/* 创作者信息 */}
          <div className="flex items-center gap-2">
            <AvatarImage
              id={video.creatorId}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm">{video.creatorName}</span>
          </div>

          <h3 className="text-sm line-clamp-2">{video.title}</h3>
        </div>
      ))}
    </div>
  )
}
```

### Dashboard 组件

```tsx
// components/dashboard/recent-videos.tsx
import { ThumbnailImage } from '@/components/common/Image'

export function RecentVideos({ videos }: { videos: Video[] }) {
  return (
    <div className="space-y-4">
      {videos.map(video => (
        <div key={video.id} className="flex gap-3">
          <div className="relative">
            <ThumbnailImage
              id={video.id}
              alt={video.title}
              className="w-32 h-20 rounded object-cover"
            />
          </div>

          <div className="flex-1">
            <h4 className="text-sm font-medium line-clamp-2">
              {video.title}
            </h4>
            <p className="text-xs text-muted-foreground">
              {video.creatorDisplayName} • {formatTimeAgo(video.publishedAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## 工作原理

### URL 生成

组件内部使用 `getDisplayImageUrl` 函数生成API URL:

```typescript
// lib/utils.ts
export function getDisplayImageUrl(
  type: 'avatar' | 'thumbnail',
  id: number
): string {
  const baseUrl = resolveApiBaseUrl()
  return `${baseUrl}/api/images/${type}/${id}`
}
```

### 错误处理

组件自动处理图片加载错误:

```typescript
const [hasError, setHasError] = useState(false)

<img
  src={imageUrl}
  onError={() => {
    setHasError(true)
    onError?.()
  }}
  alt={hasError ? '加载失败' : alt}
  className={cn(
    'transition-opacity duration-200',
    hasError && 'opacity-50',
    className
  )}
/>
```

### 加载状态

显示加载动画直到图片加载完成:

```typescript
const [isLoading, setIsLoading] = useState(true)

{isLoading && !hasError && (
  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
  </div>
)}
```

---

## 性能优化

### 懒加载

组件默认启用懒加载:

```typescript
<img
  loading="lazy"
  src={imageUrl}
  alt={alt}
/>
```

### 缓存策略

浏览器自动缓存已加载的图片,无需额外配置。

---

## 迁移指南

### 从旧API迁移

**旧代码** (复杂):
```tsx
import { getDisplayImageUrl } from '@/lib/utils'

<img
  src={
    getDisplayImageUrl(account.avatarUrl, account.localAvatarUrl) ??
    account.avatarUrl ??
    '/placeholder-avatar.png'
  }
  alt={account.displayName}
  className="w-10 h-10 rounded-full"
  onError={(e) => {
    e.currentTarget.src = '/placeholder-avatar.png'
  }}
/>
```

**新代码** (简单):
```tsx
import { AvatarImage } from '@/components/common/Image'

<AvatarImage
  id={account.id}
  alt={account.displayName}
  className="w-10 h-10"
/>
```

### 代码简化对比

| 指标 | 旧API | 新API | 改进 |
|------|-------|-------|------|
| **代码行数** | 10 行 | 4 行 | **-60%** |
| **参数数量** | 3-4 个 | 1-2 个 | **-67%** |
| **Null 检查** | 3 处 | 0 处 | **-100%** |
| **错误处理** | 手动 | 自动 | ✅ |
| **加载状态** | 无 | 自动 | ✅ |

---

## 常见问题

### Q: 图片不显示怎么办?

A: 检查以下几点:
1. ID 是否正确
2. 实体是否存在 (账号/视频)
3. 查看浏览器控制台是否有错误
4. 检查后端API是否正常

### Q: 如何自定义占位图?

A: 修改后端占位图路径:
```typescript
// backend/src/routes/images.ts
const PLACEHOLDER_AVATAR = '/path/to/your/avatar.svg'
const PLACEHOLDER_THUMBNAIL = '/path/to/your/thumbnail.svg'
```

### Q: 如何监听加载完成?

A: 使用 onLoad 事件:
```tsx
<UnifiedImage
  type="avatar"
  id={123}
  onLoad={() => console.log('加载完成')}
  onError={() => console.log('加载失败')}
/>
```

### Q: 支持SSR吗?

A: 是的,组件使用 'use client' 指令,支持Next.js的SSR和客户端渲染。

---

## 最佳实践

### ✅ 推荐做法

```tsx
// 1. 使用专用组件
<AvatarImage id={account.id} />
<ThumbnailImage id={video.id} />

// 2. 提供有意义的alt文本
<AvatarImage id={account.id} alt={account.displayName} />

// 3. 使用Tailwind样式
<AvatarImage id={account.id} className="w-10 h-10" />
```

### ❌ 避免做法

```tsx
// 1. 不要手动处理URL
<img src={`/api/images/avatar/${id}`} /> // ❌

// 2. 不要忽略错误处理
<img src={url} /> // ❌ 没有错误处理

// 3. 不要使用硬编码尺寸
<img src={url} width="100" height="100" /> // ❌ 使用className
```

---

## 版本历史

- **v1.0.0** (2025-10-23): 初始版本
  - UnifiedImage 组件
  - AvatarImage 组件
  - ThumbnailImage 组件
  - 自动错误处理和加载状态
