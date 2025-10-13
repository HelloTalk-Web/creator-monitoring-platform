<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>数据分析</h1>
      <p>深入分析创作者数据和表现趋势</p>
    </div>

    <!-- 时间范围选择 -->
    <div class="content-card">
      <div class="time-range-selector">
        <el-radio-group v-model="timeRange" size="large">
          <el-radio-button label="7">近7天</el-radio-button>
          <el-radio-button label="30">近30天</el-radio-button>
          <el-radio-button label="90">近90天</el-radio-button>
          <el-radio-button label="custom">自定义</el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-if="timeRange === 'custom'"
          v-model="customDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="large"
        />
      </div>
    </div>

    <!-- 概览统计 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card__title">总播放量</div>
        <div class="stat-card__value">{{ formatNumber(stats.totalViews) }}</div>
        <div class="stat-card__trend stat-card__trend--up">
          <el-icon><TrendCharts /></el-icon>
          <span>+{{ stats.viewsGrowth }}%</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card__title">平均互动率</div>
        <div class="stat-card__value">{{ stats.avgEngagementRate }}%</div>
        <div class="stat-card__trend stat-card__trend--up">
          <el-icon><TrendCharts /></el-icon>
          <span>+{{ stats.engagementGrowth }}%</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card__title">新增视频</div>
        <div class="stat-card__value">{{ stats.newVideos }}</div>
        <div class="stat-card__trend stat-card__trend--down">
          <el-icon><TrendCharts /></el-icon>
          <span>-{{ stats.videosGrowth }}%</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card__title">活跃账号</div>
        <div class="stat-card__value">{{ stats.activeAccounts }}</div>
        <div class="stat-card__trend">
          <el-icon><User /></el-icon>
          <span>总计 {{ stats.totalAccounts }}</span>
        </div>
      </div>
    </div>

    <!-- 图表分析 -->
    <el-row :gutter="20">
      <el-col :span="16">
        <div class="content-card">
          <div class="card-header">
            <h3>表现趋势</h3>
            <el-select v-model="trendMetric" size="small">
              <el-option label="播放量" value="views" />
              <el-option label="点赞数" value="likes" />
              <el-option label="评论数" value="comments" />
              <el-option label="分享数" value="shares" />
            </el-select>
          </div>
          <div class="chart-container">
            <v-chart class="chart" :option="trendChartOption" />
          </div>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="content-card">
          <div class="card-header">
            <h3>平台表现对比</h3>
          </div>
          <div class="chart-container">
            <v-chart class="chart" :option="platformComparisonOption" />
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 热门内容 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <div class="content-card">
          <div class="card-header">
            <h3>热门视频</h3>
            <el-button type="text" @click="viewAllVideos">查看全部</el-button>
          </div>
          <div class="hot-videos">
            <div v-for="(video, index) in hotVideos" :key="video.id" class="hot-video-item">
              <div class="video-rank">{{ index + 1 }}</div>
              <div class="video-thumbnail">
                <img :src="video.thumbnailUrl" :alt="video.title" />
              </div>
              <div class="video-info">
                <div class="video-title">{{ video.title }}</div>
                <div class="video-account">{{ video.accountName }}</div>
                <div class="video-stats">
                  <span><el-icon><View /></el-icon> {{ formatNumber(video.viewCount) }}</span>
                  <span><el-icon><Star /></el-icon> {{ formatNumber(video.likeCount) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :span="12">
        <div class="content-card">
          <div class="card-header">
            <h3>成长最快账号</h3>
            <el-button type="text" @click="viewAllAccounts">查看全部</el-button>
          </div>
          <div class="growing-accounts">
            <div v-for="(account, index) in growingAccounts" :key="account.id" class="account-item">
              <div class="account-rank">{{ index + 1 }}</div>
              <div class="account-avatar">
                <el-avatar :src="account.avatarUrl">
                  <el-icon><User /></el-icon>
                </el-avatar>
              </div>
              <div class="account-info">
                <div class="account-name">{{ account.displayName }}</div>
                <div class="account-platform">{{ account.platform }}</div>
                <div class="growth-stats">
                  <span class="growth-positive">
                    <el-icon><TrendCharts /></el-icon>
                    粉丝 +{{ formatNumber(account.followerGrowth) }}
                  </span>
                  <span class="growth-positive">
                    <el-icon><View /></el-icon>
                    播放 +{{ formatNumber(account.viewsGrowth) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, RadarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  RadarComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

// 注册ECharts组件
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  RadarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  RadarComponent
])

// 响应式数据
const timeRange = ref('30')
const customDateRange = ref<[Date, Date] | null>(null)
const trendMetric = ref('views')

// 统计数据
const stats = reactive({
  totalViews: 2580000,
  viewsGrowth: 15.2,
  avgEngagementRate: 8.5,
  engagementGrowth: 2.3,
  newVideos: 124,
  videosGrowth: 5.1,
  activeAccounts: 8,
  totalAccounts: 12
})

// 趋势图配置
const trendChartOption = ref({
  title: {
    text: '播放量趋势',
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
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: []
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '播放量',
      type: 'line',
      smooth: true,
      data: [],
      itemStyle: {
        color: '#409EFF'
      },
      areaStyle: {
        opacity: 0.3
      }
    }
  ]
})

// 平台对比图配置
const platformComparisonOption = ref({
  title: {
    text: '平台数据对比',
    left: 'center',
    textStyle: {
      fontSize: 14,
      fontWeight: 'normal'
    }
  },
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['播放量', '互动率'],
    bottom: 0
  },
  radar: {
    indicator: [
      { name: 'TikTok', max: 100 },
      { name: 'Instagram', max: 100 },
      { name: 'YouTube', max: 100 },
      { name: 'Facebook', max: 100 }
    ]
  },
  series: [
    {
      name: '数据表现',
      type: 'radar',
      data: [
        {
          value: [80, 70, 90, 60],
          name: '播放量',
          itemStyle: {
            color: '#409EFF'
          }
        },
        {
          value: [85, 75, 70, 65],
          name: '互动率',
          itemStyle: {
            color: '#67C23A'
          }
        }
      ]
    }
  ]
})

// 热门视频
const hotVideos = ref([
  {
    id: 1,
    title: '超实用的生活技巧分享',
    accountName: '创作者一号',
    thumbnailUrl: 'https://picsum.photos/80/60?random=1',
    viewCount: 125000,
    likeCount: 8900
  },
  {
    id: 2,
    title: '美食制作教程',
    accountName: '美食达人',
    thumbnailUrl: 'https://picsum.photos/80/60?random=2',
    viewCount: 98000,
    likeCount: 7600
  },
  {
    id: 3,
    title: '旅行记录vlog',
    accountName: '旅行者',
    thumbnailUrl: 'https://picsum.photos/80/60?random=3',
    viewCount: 87000,
    likeCount: 6500
  }
])

// 成长最快账号
const growingAccounts = ref([
  {
    id: 1,
    displayName: '创作者一号',
    platform: 'TikTok',
    avatarUrl: '',
    followerGrowth: 12500,
    viewsGrowth: 258000
  },
  {
    id: 2,
    displayName: 'Instagram达人',
    platform: 'Instagram',
    avatarUrl: '',
    followerGrowth: 8900,
    viewsGrowth: 156000
  },
  {
    id: 3,
    displayName: 'YouTube频道',
    platform: 'YouTube',
    avatarUrl: '',
    followerGrowth: 6700,
    viewsGrowth: 134000
  }
])

// 工具函数
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

// 更新图表数据
const updateChartData = () => {
  const days = timeRange.value === 'custom' && customDateRange.value
    ? Math.ceil((customDateRange.value[1].getTime() - customDateRange.value[0].getTime()) / (1000 * 60 * 60 * 24))
    : Number(timeRange.value)

  const dates = []
  const data = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push(date.toLocaleDateString())

    // 模拟数据
    data.push(Math.floor(Math.random() * 100000) + 50000)
  }

  trendChartOption.value.xAxis.data = dates
  trendChartOption.value.series[0].data = data
}

// 监听时间范围变化
watch([timeRange, customDateRange], () => {
  updateChartData()
})

// 监听指标变化
watch(trendMetric, (newMetric) => {
  const metricMap = {
    views: '播放量',
    likes: '点赞数',
    comments: '评论数',
    shares: '分享数'
  }

  trendChartOption.value.title.text = `${metricMap[newMetric as keyof typeof metricMap]}趋势`
  trendChartOption.value.series[0].name = metricMap[newMetric as keyof typeof metricMap]

  // 更新数据
  updateChartData()
})

// 查看全部视频
const viewAllVideos = () => {
  // TODO: 跳转到视频页面
  console.log('查看全部视频')
}

// 查看全部账号
const viewAllAccounts = () => {
  // TODO: 跳转到账号页面
  console.log('查看全部账号')
}

// 生命周期
onMounted(() => {
  updateChartData()
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

.time-range-selector {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
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

.hot-videos {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hot-video-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.hot-video-item:hover {
  background-color: var(--el-fill-color-lighter);
}

.video-rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.video-thumbnail {
  width: 60px;
  height: 45px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-info {
  flex: 1;
  min-width: 0;
}

.video-title {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-account {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.video-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.video-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.growing-accounts {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.account-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.account-item:hover {
  background-color: var(--el-fill-color-lighter);
}

.account-rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.account-avatar {
  flex-shrink: 0;
}

.account-info {
  flex: 1;
  min-width: 0;
}

.account-name {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
}

.account-platform {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.growth-stats {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
}

.growth-positive {
  color: var(--el-color-success);
  display: flex;
  align-items: center;
  gap: 4px;
}

@media (max-width: 768px) {
  .time-range-selector {
    flex-direction: column;
    align-items: stretch;
  }

  .chart-container {
    height: 250px;
  }

  .hot-video-item,
  .account-item {
    padding: 12px;
  }

  .video-thumbnail {
    width: 50px;
    height: 38px;
  }

  .growth-stats {
    font-size: 11px;
  }
}
</style>