<template>
  <div class="page-container">
    <!-- 返回按钮和标题 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button @click="goBack" text>
          <el-icon><ArrowLeft /></el-icon>
          返回账号列表
        </el-button>
      </div>
    </div>

    <!-- 账号信息卡片 -->
    <div v-if="account" class="content-card account-header">
      <div class="account-header-content">
        <el-avatar :src="account.avatarUrl" :size="80">
          <el-icon><User /></el-icon>
        </el-avatar>
        <div class="account-info">
          <div class="account-name">
            {{ account.displayName || account.username }}
            <el-icon v-if="account.isVerified" color="#409EFF" size="18">
              <CircleCheck />
            </el-icon>
          </div>
          <div class="account-username">@{{ account.username }}</div>
          <div class="account-platform">
            <span :class="`platform-tag platform-tag--${account.platformName}`">
              {{ account.platformDisplayName }}
            </span>
          </div>
        </div>
      </div>

      <div class="account-stats">
        <div class="stat-item">
          <div class="stat-value">{{ formatNumber(account.followerCount) }}</div>
          <div class="stat-label">粉丝数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ account.totalVideos }}</div>
          <div class="stat-label">视频数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ formatNumber(totalViews) }}</div>
          <div class="stat-label">总播放量</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ formatNumber(totalEngagements) }}</div>
          <div class="stat-label">总互动量</div>
        </div>
      </div>

      <div class="account-actions">
        <el-button type="primary" @click="refreshAccountData" :loading="refreshing">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button @click="openAccountUrl" v-if="account.profileUrl">
          <el-icon><Link /></el-icon>
          访问主页
        </el-button>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <div class="content-card">
      <el-form :model="filters" inline>
        <el-form-item label="排序">
          <el-select v-model="filters.sortBy" @change="loadVideos">
            <el-option label="发布时间" value="publishedAt" />
            <el-option label="播放量" value="viewCount" />
            <el-option label="点赞数" value="likeCount" />
            <el-option label="评论数" value="commentCount" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索视频标题"
            clearable
            @clear="loadVideos"
            @keyup.enter="loadVideos"
          >
            <template #append>
              <el-button :icon="Search" @click="loadVideos" />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button @click="loadVideos">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 视频列表 -->
    <div class="content-card">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>

      <!-- 视频表格 -->
      <el-table
        v-else-if="videos.length > 0"
        :data="videos"
        stripe
        style="width: 100%"
      >
        <el-table-column label="视频信息" min-width="300">
          <template #default="{ row }">
            <div class="video-info-cell">
              <img
                :src="row.thumbnailUrl || '/placeholder.png'"
                :alt="row.title"
                class="video-thumbnail-small"
              />
              <div class="video-details">
                <div class="video-title-text">{{ row.title }}</div>
                <div class="video-meta">
                  <span class="video-date">{{ formatDate(row.publishedAt) }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="浏览量" width="120" sortable>
          <template #default="{ row }">
            <div class="stat-cell">
              <el-icon><View /></el-icon>
              {{ formatNumber(row.viewCount) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="点赞数" width="120" sortable>
          <template #default="{ row }">
            <div class="stat-cell">
              <el-icon><Star /></el-icon>
              {{ formatNumber(row.likeCount) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="评论数" width="120" sortable>
          <template #default="{ row }">
            <div class="stat-cell">
              <el-icon><ChatDotRound /></el-icon>
              {{ formatNumber(row.commentCount) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="互动率" width="100">
          <template #default="{ row }">
            {{ calculateEngagementRate(row) }}%
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewVideoDetail(row)">
              查看详情
            </el-button>
            <el-button link type="primary" @click="openVideoUrl(row)">
              打开视频
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <el-icon class="empty-state__icon"><VideoPlay /></el-icon>
        <div class="empty-state__text">暂无视频数据</div>
        <div class="empty-state__hint">该账号还没有抓取到视频数据</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const route = useRoute()

// 响应式数据
const account = ref<any>(null)
const loading = ref(false)
const refreshing = ref(false)
const videos = ref<any[]>([])

// 筛选条件
const filters = reactive({
  sortBy: 'publishedAt',
  keyword: ''
})

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

// 计算属性
const totalViews = computed(() => {
  return videos.value.reduce((sum, video) => sum + (video.viewCount || 0), 0)
})

const totalEngagements = computed(() => {
  return videos.value.reduce((sum, video) =>
    sum + (video.likeCount || 0) + (video.commentCount || 0) + (video.shareCount || 0), 0
  )
})

// 返回账号列表
const goBack = () => {
  router.push('/accounts')
}

// 加载账号信息
const loadAccount = async () => {
  const accountId = route.params.accountId
  try {
    const response = await axios.get(`${API_BASE_URL}/accounts/${accountId}`)
    account.value = {
      ...response.data,
      platformName: response.data.platform?.name,
      platformDisplayName: response.data.platform?.displayName
    }
  } catch (error: any) {
    console.error('加载账号信息失败:', error)
    ElMessage.error('加载账号信息失败')
    // 如果账号不存在，返回列表页
    router.push('/accounts')
  }
}

// 加载视频列表
const loadVideos = async () => {
  const accountId = route.params.accountId
  loading.value = true
  try {
    const params: any = {
      accountId: accountId,
      sortBy: filters.sortBy,
      sortOrder: 'desc'
    }

    if (filters.keyword) {
      params.keyword = filters.keyword
    }

    const response = await axios.get(`${API_BASE_URL}/videos`, { params })

    // 转换数据格式
    videos.value = response.data.map((video: any) => ({
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      videoUrl: video.videoUrl,
      publishedAt: video.publishedAt,
      viewCount: parseInt(video.viewCount) || 0,
      likeCount: parseInt(video.likeCount) || 0,
      commentCount: parseInt(video.commentCount) || 0,
      shareCount: parseInt(video.shareCount) || 0
    }))
  } catch (error: any) {
    console.error('加载视频失败:', error)
    ElMessage.error('加载视频数据失败')
  } finally {
    loading.value = false
  }
}

// 刷新账号数据
const refreshAccountData = async () => {
  refreshing.value = true
  try {
    ElMessage.info('开始刷新账号数据...')
    const accountId = route.params.accountId
    await axios.post(`${API_BASE_URL}/accounts/${accountId}/refresh`)
    ElMessage.success('刷新任务已启动，请稍后查看')
    // 重新加载数据
    await loadAccount()
    await loadVideos()
  } catch (error: any) {
    console.error('刷新失败:', error)
    ElMessage.error('刷新失败: ' + (error.response?.data?.message || error.message))
  } finally {
    refreshing.value = false
  }
}

// 打开账号主页
const openAccountUrl = () => {
  if (account.value?.profileUrl) {
    window.open(account.value.profileUrl, '_blank')
  }
}

// 工具函数
const formatNumber = (num: number): string => {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + '亿'
  }
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toLocaleString()
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const calculateEngagementRate = (video: any): string => {
  if (video.viewCount === 0) return '0.0'
  const engagement = ((video.likeCount + video.commentCount + video.shareCount) / video.viewCount) * 100
  return engagement.toFixed(2)
}

const viewVideoDetail = (video: any) => {
  ElMessageBox.alert(
    `<p><strong>标题:</strong> ${video.title}</p>
     <p><strong>描述:</strong> ${video.description || '无'}</p>
     <p><strong>播放量:</strong> ${formatNumber(video.viewCount)}</p>
     <p><strong>点赞数:</strong> ${formatNumber(video.likeCount)}</p>
     <p><strong>评论数:</strong> ${formatNumber(video.commentCount)}</p>
     <p><strong>分享数:</strong> ${formatNumber(video.shareCount)}</p>`,
    '视频详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  )
}

const openVideoUrl = (video: any) => {
  window.open(video.videoUrl, '_blank')
}

// 生命周期
onMounted(async () => {
  await loadAccount()
  await loadVideos()
})
</script>

<style scoped>
.account-header {
  padding: 24px;
}

.account-header-content {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 24px;
}

.account-info {
  flex: 1;
}

.account-name {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.account-username {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.account-platform {
  margin-top: 8px;
}

.account-stats {
  display: flex;
  gap: 48px;
  padding: 20px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  margin-bottom: 24px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--el-color-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.account-actions {
  display: flex;
  gap: 12px;
}

.video-info-cell {
  display: flex;
  gap: 12px;
  align-items: center;
}

.video-thumbnail-small {
  width: 120px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.video-details {
  flex: 1;
  min-width: 0;
}

.video-title-text {
  font-weight: 500;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

.video-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.video-date {
  color: var(--el-text-color-placeholder);
}

.stat-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--el-text-color-secondary);
}

.loading-state .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--el-text-color-secondary);
}

.empty-state__icon {
  font-size: 64px;
  color: var(--el-text-color-placeholder);
  margin-bottom: 16px;
}

.empty-state__text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.empty-state__hint {
  font-size: 14px;
  color: var(--el-text-color-placeholder);
}

@media (max-width: 768px) {
  .account-header-content {
    flex-direction: column;
    text-align: center;
  }

  .account-stats {
    flex-wrap: wrap;
    gap: 20px;
  }

  .stat-item {
    flex: 1;
    min-width: 120px;
  }
}
</style>
