<template>
  <div class="page-container">
    <!-- 页面标题和操作 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h1>视频管理</h1>
        <el-tag type="info">{{ videos.length }} 个视频</el-tag>
      </div>
      <div class="toolbar-right">
        <el-button @click="refreshVideos">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="content-card">
      <el-form :model="filters" inline>
        <el-form-item label="账号">
          <el-select v-model="filters.accountId" placeholder="选择账号" clearable>
            <el-option label="全部" value="" />
            <el-option
              v-for="account in accounts"
              :key="account.id"
              :label="account.displayName || account.username"
              :value="account.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="平台">
          <el-select v-model="filters.platform" placeholder="选择平台" clearable>
            <el-option label="全部" value="" />
            <el-option label="TikTok" value="tiktok" />
            <el-option label="Instagram" value="instagram" />
            <el-option label="YouTube" value="youtube" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-select v-model="filters.sortBy" placeholder="排序方式">
            <el-option label="发布时间" value="publishedAt" />
            <el-option label="播放量" value="viewCount" />
            <el-option label="点赞数" value="likeCount" />
            <el-option label="评论数" value="commentCount" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 视频列表 -->
    <div class="content-card">
      <div class="video-grid">
        <div
          v-for="video in filteredVideos"
          :key="video.id"
          class="video-card"
          @click="viewVideoDetail(video)"
        >
          <div class="video-thumbnail">
            <img
              :src="video.thumbnailUrl || '/placeholder-image.png'"
              :alt="video.title"
              class="thumbnail-image"
            />
            <div class="video-duration" v-if="video.duration">
              {{ formatDuration(video.duration) }}
            </div>
          </div>
          <div class="video-info">
            <div class="video-title">{{ video.title }}</div>
            <div class="video-account">
              <el-avatar :size="20" :src="video.account?.avatarUrl">
                <el-icon size="12"><User /></el-icon>
              </el-avatar>
              <span>{{ video.account?.displayName || video.account?.username }}</span>
            </div>
            <div class="video-stats">
              <div class="stat-item">
                <el-icon><View /></el-icon>
                <span>{{ formatNumber(video.viewCount) }}</span>
              </div>
              <div class="stat-item">
                <el-icon><Star /></el-icon>
                <span>{{ formatNumber(video.likeCount) }}</span>
              </div>
              <div class="stat-item">
                <el-icon><ChatDotRound /></el-icon>
                <span>{{ formatNumber(video.commentCount) }}</span>
              </div>
            </div>
            <div class="video-time">
              {{ formatTime(video.publishedAt) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredVideos.length === 0" class="empty-state">
        <el-icon class="empty-state__icon"><VideoPlay /></el-icon>
        <div class="empty-state__text">暂无视频数据</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { Video, CreatorAccount } from '@/types'

// 响应式数据
const loading = ref(false)
const videos = ref<Video[]>([])
const accounts = ref<CreatorAccount[]>([])

// 筛选条件
const filters = reactive({
  accountId: '',
  platform: '',
  sortBy: 'publishedAt'
})

// 计算属性
const filteredVideos = computed(() => {
  let result = videos.value

  if (filters.accountId) {
    result = result.filter(video => video.accountId === Number(filters.accountId))
  }

  if (filters.platform) {
    result = result.filter(video => video.account?.platform?.name === filters.platform)
  }

  // 排序
  result.sort((a, b) => {
    const aValue = a[filters.sortBy as keyof Video] as number | string
    const bValue = b[filters.sortBy as keyof Video] as number | string
    return typeof aValue === 'number' ? bValue - aValue :
           new Date(bValue).getTime() - new Date(aValue).getTime()
  })

  return result
})

// 工具函数
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

const formatTime = (timeStr: string): string => {
  const time = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return time.toLocaleDateString()
  }
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 加载视频数据
const loadVideos = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 模拟数据
    videos.value = [
      {
        id: 1,
        accountId: 1,
        platformVideoId: 'video1',
        title: '这是一个非常有趣的视频标题示例',
        description: '视频描述内容...',
        videoUrl: 'https://example.com/video1',
        thumbnailUrl: 'https://picsum.photos/300/200?random=1',
        duration: 65,
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['有趣', '日常', '分享'],
        viewCount: 125000,
        likeCount: 8900,
        commentCount: 234,
        shareCount: 123,
        saveCount: 456,
        firstScrapedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        dataSource: 'api',
        metadata: {},
        account: {
          id: 1,
          username: 'creator_one',
          displayName: '创作者一号',
          platform: {
            name: 'tiktok',
            displayName: 'TikTok'
          }
        } as CreatorAccount
      },
      {
        id: 2,
        accountId: 2,
        platformVideoId: 'video2',
        title: '分享一些生活小技巧',
        description: '实用的生活技巧分享...',
        videoUrl: 'https://example.com/video2',
        thumbnailUrl: 'https://picsum.photos/300/200?random=2',
        duration: 120,
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['生活', '技巧', '教程'],
        viewCount: 89000,
        likeCount: 5600,
        commentCount: 189,
        shareCount: 89,
        saveCount: 234,
        firstScrapedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        dataSource: 'api',
        metadata: {},
        account: {
          id: 2,
          username: 'instagram_creator',
          displayName: 'Instagram达人',
          platform: {
            name: 'instagram',
            displayName: 'Instagram'
          }
        } as CreatorAccount
      }
    ]
  } catch (error) {
    console.error('加载视频失败:', error)
    ElMessage.error('加载视频数据失败')
  } finally {
    loading.value = false
  }
}

// 加载账号数据
const loadAccounts = async () => {
  try {
    // 模拟API调用
    accounts.value = [
      {
        id: 1,
        username: 'creator_one',
        displayName: '创作者一号',
        platform: {
          name: 'tiktok',
          displayName: 'TikTok'
        }
      } as CreatorAccount,
      {
        id: 2,
        username: 'instagram_creator',
        displayName: 'Instagram达人',
        platform: {
          name: 'instagram',
          displayName: 'Instagram'
        }
      } as CreatorAccount
    ]
  } catch (error) {
    console.error('加载账号失败:', error)
  }
}

// 处理搜索
const handleSearch = () => {
  // 搜索逻辑已在计算属性中实现
}

// 刷新视频
const refreshVideos = () => {
  loadVideos()
}

// 查看视频详情
const viewVideoDetail = (video: Video) => {
  ElMessage.info('视频详情功能开发中...')
  // TODO: 实现视频详情页面或弹窗
}

// 生命周期
onMounted(() => {
  loadVideos()
  loadAccounts()
})
</script>

<style scoped>
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.video-card {
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.video-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.video-thumbnail {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.video-info {
  padding: 12px;
}

.video-title {
  font-weight: 500;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.video-account {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.video-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.video-time {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

@media (max-width: 768px) {
  .video-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }

  .video-thumbnail {
    height: 120px;
  }

  .video-info {
    padding: 8px;
  }

  .video-title {
    font-size: 13px;
    margin-bottom: 6px;
  }

  .video-stats {
    gap: 8px;
  }

  .stat-item {
    font-size: 11px;
  }
}
</style>