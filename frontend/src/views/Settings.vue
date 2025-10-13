<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>系统设置</h1>
      <p>管理应用配置和个人偏好</p>
    </div>

    <el-row :gutter="20">
      <!-- 左侧导航 -->
      <el-col :span="6">
        <div class="content-card">
          <el-menu
            :default-active="activeTab"
            @select="handleMenuSelect"
            class="settings-menu"
          >
            <el-menu-item index="general">
              <el-icon><Setting /></el-icon>
              <span>常规设置</span>
            </el-menu-item>
            <el-menu-item index="scrape">
              <el-icon><Download /></el-icon>
              <span>抓取配置</span>
            </el-menu-item>
            <el-menu-item index="notifications">
              <el-icon><Bell /></el-icon>
              <span>通知设置</span>
            </el-menu-item>
            <el-menu-item index="account">
              <el-icon><User /></el-icon>
              <span>账号信息</span>
            </el-menu-item>
            <el-menu-item index="system">
              <el-icon><Monitor /></el-icon>
              <span>系统信息</span>
            </el-menu-item>
          </el-menu>
        </div>
      </el-col>

      <!-- 右侧内容 -->
      <el-col :span="18">
        <!-- 常规设置 -->
        <div v-show="activeTab === 'general'" class="content-card">
          <h3>常规设置</h3>
          <el-form :model="generalSettings" label-width="120px">
            <el-form-item label="语言">
              <el-select v-model="generalSettings.language">
                <el-option label="简体中文" value="zh-CN" />
                <el-option label="English" value="en-US" />
              </el-select>
            </el-form-item>
            <el-form-item label="主题">
              <el-radio-group v-model="generalSettings.theme">
                <el-radio label="light">浅色</el-radio>
                <el-radio label="dark">深色</el-radio>
                <el-radio label="auto">跟随系统</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="时区">
              <el-select v-model="generalSettings.timezone">
                <el-option label="北京时间 (UTC+8)" value="Asia/Shanghai" />
                <el-option label="东京时间 (UTC+9)" value="Asia/Tokyo" />
                <el-option label="洛杉矶时间 (UTC-8)" value="America/Los_Angeles" />
              </el-select>
            </el-form-item>
            <el-form-item label="数据刷新">
              <el-input-number
                v-model="generalSettings.refreshInterval"
                :min="30"
                :max="300"
                :step="30"
              />
              <span style="margin-left: 8px; color: var(--el-text-color-secondary)">
                秒
              </span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveGeneralSettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 抓取配置 -->
        <div v-show="activeTab === 'scrape'" class="content-card">
          <h3>抓取配置</h3>
          <el-form :model="scrapeSettings" label-width="120px">
            <el-form-item label="默认频率">
              <el-select v-model="scrapeSettings.defaultFrequency">
                <el-option label="每6小时" :value="6" />
                <el-option label="每12小时" :value="12" />
                <el-option label="每24小时" :value="24" />
                <el-option label="每48小时" :value="48" />
              </el-select>
            </el-form-item>
            <el-form-item label="并发限制">
              <el-input-number
                v-model="scrapeSettings.maxConcurrent"
                :min="1"
                :max="10"
              />
              <span style="margin-left: 8px; color: var(--el-text-color-secondary)">
                个任务
              </span>
            </el-form-item>
            <el-form-item label="重试次数">
              <el-input-number
                v-model="scrapeSettings.retryCount"
                :min="0"
                :max="5"
              />
            </el-form-item>
            <el-form-item label="超时时间">
              <el-input-number
                v-model="scrapeSettings.timeout"
                :min="10"
                :max="300"
                :step="10"
              />
              <span style="margin-left: 8px; color: var(--el-text-color-secondary)">
                秒
              </span>
            </el-form-item>
            <el-form-item label="启用自动抓取">
              <el-switch v-model="scrapeSettings.autoScrape" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveScrapeSettings">保存设置</el-button>
              <el-button @click="testScrapeConfig">测试连接</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 通知设置 -->
        <div v-show="activeTab === 'notifications'" class="content-card">
          <h3>通知设置</h3>
          <el-form :model="notificationSettings" label-width="120px">
            <el-form-item label="邮件通知">
              <el-switch v-model="notificationSettings.email.enabled" />
            </el-form-item>
            <el-form-item label="接收邮箱" v-if="notificationSettings.email.enabled">
              <el-input v-model="notificationSettings.email.address" placeholder="输入邮箱地址" />
            </el-form-item>
            <el-form-item label="浏览器通知">
              <el-switch v-model="notificationSettings.browser.enabled" />
            </el-form-item>

            <el-divider />

            <h4>通知事件</h4>
            <el-form-item label="抓取完成">
              <el-switch v-model="notificationSettings.events.scrapeCompleted" />
            </el-form-item>
            <el-form-item label="抓取失败">
              <el-switch v-model="notificationSettings.events.scrapeFailed" />
            </el-form-item>
            <el-form-item label="数据异常">
              <el-switch v-model="notificationSettings.events.dataAnomaly" />
            </el-form-item>
            <el-form-item label="配额警告">
              <el-switch v-model="notificationSettings.events.quotaWarning" />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="saveNotificationSettings">保存设置</el-button>
              <el-button @click="testNotification">测试通知</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 账号信息 -->
        <div v-show="activeTab === 'account'" class="content-card">
          <h3>账号信息</h3>
          <div class="account-info">
            <div class="account-avatar">
              <el-avatar :size="80" :src="userInfo.avatarUrl">
                <el-icon size="40"><User /></el-icon>
              </el-avatar>
              <el-button type="text" style="margin-top: 8px">更换头像</el-button>
            </div>
            <div class="account-details">
              <el-form :model="userInfo" label-width="80px">
                <el-form-item label="用户名">
                  <el-input v-model="userInfo.username" />
                </el-form-item>
                <el-form-item label="邮箱">
                  <el-input v-model="userInfo.email" />
                </el-form-item>
                <el-form-item label="套餐">
                  <el-tag :type="getPlanType(userInfo.planType)">
                    {{ getPlanText(userInfo.planType) }}
                  </el-tag>
                  <el-button type="text" style="margin-left: 8px">升级套餐</el-button>
                </el-form-item>
                <el-form-item label="API配额">
                  <el-progress
                    :percentage="(userInfo.apiUsed / userInfo.apiQuota) * 100"
                    :color="getQuotaColor(userInfo.apiUsed, userInfo.apiQuota)"
                  />
                  <div style="margin-top: 4px; font-size: 12px; color: var(--el-text-color-secondary)">
                    {{ userInfo.apiUsed }} / {{ userInfo.apiQuota }}
                  </div>
                </el-form-item>
              </el-form>
            </div>
          </div>

          <el-divider />

          <div class="account-actions">
            <el-button type="primary" @click="saveUserInfo">保存修改</el-button>
            <el-button @click="changePassword">修改密码</el-button>
            <el-button type="danger" @click="confirmDeleteAccount">删除账号</el-button>
          </div>
        </div>

        <!-- 系统信息 -->
        <div v-show="activeTab === 'system'" class="content-card">
          <h3>系统信息</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="应用版本">
              v1.0.0-alpha
            </el-descriptions-item>
            <el-descriptions-item label="构建时间">
              2024-01-13 10:30:00
            </el-descriptions-item>
            <el-descriptions-item label="运行环境">
              {{ systemInfo.environment }}
            </el-descriptions-item>
            <el-descriptions-item label="浏览器">
              {{ systemInfo.browser }}
            </el-descriptions-item>
            <el-descriptions-item label="API状态">
              <el-tag :type="systemInfo.apiStatus === 'online' ? 'success' : 'danger'">
                {{ systemInfo.apiStatus === 'online' ? '在线' : '离线' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="数据库状态">
              <el-tag :type="systemInfo.dbStatus === 'connected' ? 'success' : 'danger'">
                {{ systemInfo.dbStatus === 'connected' ? '已连接' : '未连接' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <el-divider />

          <h4>系统操作</h4>
          <div class="system-actions">
            <el-button @click="clearCache">清除缓存</el-button>
            <el-button @click="exportData">导出数据</el-button>
            <el-button @click="checkUpdates">检查更新</el-button>
            <el-button type="danger" @click="resetSystem">重置系统</el-button>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const activeTab = ref('general')

// 常规设置
const generalSettings = reactive({
  language: 'zh-CN',
  theme: 'light',
  timezone: 'Asia/Shanghai',
  refreshInterval: 60
})

// 抓取设置
const scrapeSettings = reactive({
  defaultFrequency: 24,
  maxConcurrent: 3,
  retryCount: 3,
  timeout: 60,
  autoScrape: true
})

// 通知设置
const notificationSettings = reactive({
  email: {
    enabled: false,
    address: ''
  },
  browser: {
    enabled: true
  },
  events: {
    scrapeCompleted: true,
    scrapeFailed: true,
    dataAnomaly: true,
    quotaWarning: true
  }
})

// 用户信息
const userInfo = reactive({
  username: 'admin',
  email: 'admin@example.com',
  planType: 'pro',
  apiQuota: 10000,
  apiUsed: 2580,
  avatarUrl: ''
})

// 系统信息
const systemInfo = reactive({
  environment: 'development',
  browser: navigator.userAgent,
  apiStatus: 'online',
  dbStatus: 'connected'
})

// 工具函数
const getPlanType = (plan: string): string => {
  const types = {
    free: '',
    pro: 'success',
    enterprise: 'warning'
  }
  return types[plan as keyof typeof types] || ''
}

const getPlanText = (plan: string): string => {
  const texts = {
    free: '免费版',
    pro: '专业版',
    enterprise: '企业版'
  }
  return texts[plan as keyof typeof texts] || plan
}

const getQuotaColor = (used: number, quota: number): string => {
  const percentage = (used / quota) * 100
  if (percentage > 80) return '#F56C6C'
  if (percentage > 60) return '#E6A23C'
  return '#67C23A'
}

// 菜单选择处理
const handleMenuSelect = (key: string) => {
  activeTab.value = key
}

// 保存常规设置
const saveGeneralSettings = () => {
  ElMessage.success('常规设置已保存')
  // TODO: 调用API保存设置
}

// 保存抓取设置
const saveScrapeSettings = () => {
  ElMessage.success('抓取配置已保存')
  // TODO: 调用API保存设置
}

// 测试抓取配置
const testScrapeConfig = async () => {
  try {
    ElMessage.info('正在测试连接...')
    // 模拟测试
    await new Promise(resolve => setTimeout(resolve, 2000))
    ElMessage.success('连接测试成功')
  } catch (error) {
    ElMessage.error('连接测试失败')
  }
}

// 保存通知设置
const saveNotificationSettings = () => {
  ElMessage.success('通知设置已保存')
  // TODO: 调用API保存设置
}

// 测试通知
const testNotification = () => {
  if (notificationSettings.browser.enabled) {
    ElMessage.success('浏览器通知测试成功')
  }
  if (notificationSettings.email.enabled && notificationSettings.email.address) {
    ElMessage.info('邮件通知已发送，请查收')
  }
}

// 保存用户信息
const saveUserInfo = () => {
  ElMessage.success('用户信息已更新')
  // TODO: 调用API保存用户信息
}

// 修改密码
const changePassword = () => {
  ElMessageBox.prompt('请输入新密码', '修改密码', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputType: 'password'
  }).then(() => {
    ElMessage.success('密码修改成功')
  }).catch(() => {
    // 用户取消
  })
}

// 确认删除账号
const confirmDeleteAccount = () => {
  ElMessageBox.confirm(
    '确定要删除账号吗？此操作不可恢复，所有数据将被永久删除。',
    '确认删除',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('账号删除成功')
    // TODO: 调用API删除账号
  }).catch(() => {
    // 用户取消
  })
}

// 清除缓存
const clearCache = () => {
  ElMessage.success('缓存已清除')
  localStorage.clear()
  sessionStorage.clear()
}

// 导出数据
const exportData = () => {
  ElMessage.info('正在准备导出数据...')
  // TODO: 实现数据导出功能
}

// 检查更新
const checkUpdates = () => {
  ElMessage.info('正在检查更新...')
  // TODO: 实现更新检查功能
}

// 重置系统
const resetSystem = () => {
  ElMessageBox.confirm(
    '确定要重置系统吗？所有设置和数据将被重置为初始状态。',
    '确认重置',
    {
      confirmButtonText: '重置',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('系统重置成功')
    // TODO: 实现系统重置功能
  }).catch(() => {
    // 用户取消
  })
}

// 生命周期
onMounted(() => {
  // 加载用户设置
  // TODO: 从API加载用户设置
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

.settings-menu {
  border: none;
}

.settings-menu .el-menu-item {
  border-radius: 6px;
  margin-bottom: 4px;
}

.settings-menu .el-menu-item.is-active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.content-card h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.account-info {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.account-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.account-details {
  flex: 1;
}

.account-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.system-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .account-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .account-actions,
  .system-actions {
    justify-content: center;
  }
}
</style>