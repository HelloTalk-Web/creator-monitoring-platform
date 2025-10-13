<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>数据看板</h1>
      <p>实时监控您的创作者数据表现</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card__title">监控账号</div>
        <div class="stat-card__value">{{ stats.accountCount }}</div>
        <div class="stat-card__trend">
          <el-icon><TrendCharts /></el-icon>
          <span>活跃账号 {{ stats.activeAccounts }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card__title">视频总数</div>
        <div class="stat-card__value">{{ formatNumber(stats.totalVideos) }}</div>
        <div class="stat-card__trend">
          <el-icon><VideoPlay /></el-icon>
          <span>最近30天新增 {{ stats.newVideos30Days }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card__title">总播放量</div>
        <div class="stat-card__value">{{ formatNumber(stats.totalViews) }}</div>
        <div class="stat-card__trend">
          <el-icon><View /></el-icon>
          <span>较昨日 {{ stats.viewsGrowth }}%</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card__title">总互动量</div>
        <div class="stat-card__value">{{ formatNumber(stats.totalEngagement) }}</div>
        <div class="stat-card__trend">
          <el-icon><Star /></el-icon>
          <span>点赞 {{ stats.totalLikes }} | 评论 {{ stats.totalComments }}</span>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <el-row :gutter="20">
      <el-col :span="16">
        <div class="content-card">
          <div class="card-header">
            <h3>数据趋势</h3>
            <el-radio-group v-model="trendPeriod" size="small">
              <el-radio-button label="7">7天</el-radio-button>
              <el-radio-button label="30">30天</el-radio-button>
              <el-radio-button label="90">90天</el-radio-button>
            </el-radio-group>
          </div>
          <div class="chart-container">
            <v-chart class="chart" :option="trendChartOption" />
          </div>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="content-card">
          <div class="card-header">
            <h3>平台分布</h3>
          </div>
          <div class="chart-container">
            <v-chart class="chart" :option="platformChartOption" />
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 最近活动 -->
    <div class="content-card">
      <div class="card-header">
        <h3>最近活动</h3>
        <el-button type="text" @click="$router.push('/accounts')">
          查看全部
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="activity-list">
        <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
          <div class="activity-icon">
            <el-icon :color="getPlatformColor(activity.platform)">
              <component :is="getPlatformIcon(activity.platform)" />
            </el-icon>
          </div>
          <div class="activity-content">
            <div class="activity-title">{{ activity.title }}</div>
            <div class="activity-desc">{{ activity.description }}</div>
            <div class="activity-time">{{ formatTime(activity.createdAt) }}</div>
          </div>
          <div class="activity-status">
            <el-tag :type="getStatusType(activity.status)" size="small">
              {{ activity.statusText }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

// 注册ECharts组件
use([
  CanvasRenderer,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

// 响应式数据
const trendPeriod = ref('30')

// 统计数据
const stats = reactive({
  accountCount: 0,
  activeAccounts: 0,
  totalVideos: 0,
  newVideos30Days: 0,
  totalViews: 0,
  viewsGrowth: 0,
  totalEngagement: 0,
  totalLikes: 0,
  totalComments: 0
})

// 趋势图配置
const trendChartOption = ref({
  title: {
    text: '视频发布趋势',
    left: 'center',
    textStyle: {
      fontSize: 14,
      fontWeight: 'normal'
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross'
    }
  },
  legend: {
    data: ['新增视频', '总播放量'],
    bottom: 0
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '10%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: []
  },
  yAxis: [
    {
      type: 'value',
      name: '视频数量',
      position: 'left'
    },
    {
      type: 'value',
      name: '播放量',
      position: 'right'
    }
  ],
  series: [
    {
      name: '新增视频',
      type: 'line',
      yAxisIndex: 0,
      data: [],
      smooth: true,
      itemStyle: {
        color: '#409EFF'
      }
    },
    {
      name: '总播放量',
      type: 'line',
      yAxisIndex: 1,
      data: [],
      smooth: true,
      itemStyle: {
        color: '#67C23A'
      }
    }
  ]
})

// 平台分布图配置
const platformChartOption = ref({
  title: {
    text: '账号平台分布',
    left: 'center',
    textStyle: {
      fontSize: 14,
      fontWeight: 'normal'
    }
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  series: [
    {
      name: '账号数量',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '18',
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: []
    }
  ]
})

// 最近活动
const recentActivities = ref([
  {
    id: 1,
    title: 'TikTok账号数据更新',
    description: '@username 新增3个视频，总播放量12.5万',
    platform: 'tiktok',
    status: 'completed',
    statusText: '已完成',
    createdAt: '2024-01-13T10:30:00Z'
  },
  {
    id: 2,
    title: 'Instagram账号抓取',
    description: '@creator 开始初始数据抓取',
    platform: 'instagram',
    status: 'running',
    statusText: '进行中',
    createdAt: '2024-01-13T09:15:00Z'
  },
  {
    id: 3,
    title: 'YouTube数据分析',
    description: 'channel_id 热门视频数据分析完成',
    platform: 'youtube',
    status: 'completed',
    statusText: '已完成',
    createdAt: '2024-01-13T08:45:00Z'
  }
])

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
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (hours < 1) {
    return '刚刚'
  } else if (hours < 24) {
    return `${hours}小时前`
  } else {
    const days = Math.floor(hours / 24)
    return `${days}天前`
  }
}

const getPlatformColor = (platform: string): string => {
  const colors = {
    tiktok: '#000000',
    instagram: '#E4405F',
    youtube: '#FF0000',
    facebook: '#1877F2',
    xiaohongshu: '#FE2C55',
    douyin: '#000000'
  }
  return colors[platform as keyof typeof colors] || '#409EFF'
}

const getPlatformIcon = (platform: string): string => {
  const icons = {
    tiktok: 'VideoPlay',
    instagram: 'Picture',
    youtube: 'VideoCamera',
    facebook: 'ChatDotRound',
    xiaohongshu: 'Star',
    douyin: 'VideoPlay'
  }
  return icons[platform as keyof typeof icons] || 'VideoPlay'
}

const getStatusType = (status: string): string => {
  const types = {
    completed: 'success',
    running: 'warning',
    failed: 'danger',
    pending: 'info'
  }
  return types[status as keyof typeof types] || 'info'
}

// 加载仪表板数据
const loadDashboardData = async () => {
  try {
    // 模拟数据加载
    stats.accountCount = 12
    stats.activeAccounts = 8
    stats.totalVideos = 1856
    stats.newVideos30Days = 124
    stats.totalViews = 2580000
    stats.viewsGrowth = 15.2
    stats.totalEngagement = 185000
    stats.totalLikes = 125000
    stats.totalComments = 60000

    // 更新图表数据
    updateChartData()
  } catch (error) {
    console.error('加载仪表板数据失败:', error)
  }
}

// 更新图表数据
const updateChartData = () => {
  // 生成模拟数据
  const dates = []
  const videoData = []
  const viewData = []

  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push(date.toLocaleDateString())
    videoData.push(Math.floor(Math.random() * 10) + 2)
    viewData.push(Math.floor(Math.random() * 50000) + 10000)
  }

  trendChartOption.value.xAxis.data = dates
  trendChartOption.value.series[0].data = videoData
  trendChartOption.value.series[1].data = viewData

  // 平台分布数据
  platformChartOption.value.series[0].data = [
    { value: 4, name: 'TikTok' },
    { value: 3, name: 'Instagram' },
    { value: 3, name: 'YouTube' },
    { value: 2, name: 'Facebook' }
  ]
}

// 生命周期
onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.page-header p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.chart-container {
  height: 300px;
}

.chart {
  height: 100%;
  width: 100%;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 6px;
}

.activity-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--el-fill-color);
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-weight: 500;
  margin-bottom: 4px;
  color: var(--el-text-color-primary);
}

.activity-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.activity-time {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.activity-status {
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .chart-container {
    height: 250px;
  }

  .activity-item {
    flex-direction: column;
    text-align: center;
  }

  .activity-icon {
    margin: 0 auto;
  }
}
</style>