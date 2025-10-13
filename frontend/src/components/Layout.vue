<template>
  <div class="layout-container">
    <!-- 顶部导航 -->
    <el-header class="layout-header">
      <div class="header-left">
        <div class="logo">
          <el-icon size="24"><VideoPlay /></el-icon>
          <span class="logo-text">创作者监控平台</span>
        </div>
      </div>

      <div class="header-center">
        <el-menu
          :default-active="$route.path"
          mode="horizontal"
          router
          class="header-menu"
        >
          <el-menu-item index="/accounts">
            <el-icon><User /></el-icon>
            <span>创作者账号</span>
          </el-menu-item>
        </el-menu>
      </div>

      <div class="header-right">
        <!-- 通知铃铛 -->
        <el-badge :value="3" :max="99" class="notification-badge">
          <el-button type="text" @click="showNotifications">
            <el-icon size="20"><Bell /></el-icon>
          </el-button>
        </el-badge>

        <!-- 用户菜单 -->
        <el-dropdown @command="handleUserCommand">
          <div class="user-info">
            <el-avatar :size="32" :src="userInfo.avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
            <span class="username">{{ userInfo.name }}</span>
            <el-icon><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon>
                个人资料
              </el-dropdown-item>
              <el-dropdown-item command="settings">
                <el-icon><Setting /></el-icon>
                系统设置
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <!-- 主要内容区域 -->
    <el-main class="layout-main">
      <router-view />
    </el-main>

    <!-- 通知抽屉 -->
    <el-drawer
      v-model="notificationDrawer"
      title="通知中心"
      direction="rtl"
      size="400px"
    >
      <div class="notification-list">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="{ 'notification-item--unread': !notification.read }"
        >
          <div class="notification-icon">
            <el-icon :color="getNotificationColor(notification.type)">
              <component :is="getNotificationIcon(notification.type)" />
            </el-icon>
          </div>
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-desc">{{ notification.description }}</div>
            <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
          </div>
          <div class="notification-actions">
            <el-button
              v-if="!notification.read"
              type="text"
              size="small"
              @click="markAsRead(notification)"
            >
              标为已读
            </el-button>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="notification-footer">
          <el-button @click="markAllAsRead">全部标为已读</el-button>
          <el-button type="primary" @click="clearNotifications">清空通知</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

// 响应式数据
const notificationDrawer = ref(false)

// 用户信息
const userInfo = reactive({
  name: '管理员',
  avatar: ''
})

// 通知列表
const notifications = ref([
  {
    id: 1,
    type: 'success',
    title: '数据抓取完成',
    description: 'TikTok账号 @creator_one 的数据已成功更新',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    type: 'warning',
    title: 'API配额警告',
    description: '当前已使用85%的API配额，请及时升级套餐',
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    type: 'info',
    title: '新功能上线',
    description: '数据分析功能已上线，快来体验吧！',
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
])

// 工具函数
const getNotificationIcon = (type: string): string => {
  const icons = {
    success: 'CircleCheck',
    warning: 'Warning',
    error: 'CircleClose',
    info: 'InfoFilled'
  }
  return icons[type as keyof typeof icons] || 'InfoFilled'
}

const getNotificationColor = (type: string): string => {
  const colors = {
    success: '#67C23A',
    warning: '#E6A23C',
    error: '#F56C6C',
    info: '#409EFF'
  }
  return colors[type as keyof typeof colors] || '#409EFF'
}

const formatTime = (timeStr: string): string => {
  const time = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return time.toLocaleDateString()
  }
}

// 处理用户菜单命令
const handleUserCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/settings')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 处理退出登录
const handleLogout = () => {
  ElMessageBox.confirm(
    '确定要退出登录吗？',
    '确认退出',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('已退出登录')
    // TODO: 清除用户状态，跳转到登录页
    router.push('/login')
  }).catch(() => {
    // 用户取消
  })
}

// 显示通知
const showNotifications = () => {
  notificationDrawer.value = true
}

// 标为已读
const markAsRead = (notification: any) => {
  notification.read = true
  // TODO: 调用API更新通知状态
}

// 全部标为已读
const markAllAsRead = () => {
  notifications.value.forEach(notification => {
    notification.read = true
  })
  ElMessage.success('已全部标为已读')
  // TODO: 调用API批量更新通知状态
}

// 清空通知
const clearNotifications = () => {
  ElMessageBox.confirm(
    '确定要清空所有通知吗？',
    '确认清空',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    notifications.value = []
    notificationDrawer.value = false
    ElMessage.success('通知已清空')
    // TODO: 调用API清空通知
  }).catch(() => {
    // 用户取消
  })
}

// 生命周期
onMounted(() => {
  // 加载用户信息
  // TODO: 从API获取用户信息
})
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-header {
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.logo-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.header-menu {
  border-bottom: none;
  background: transparent;
}

.header-menu .el-menu-item {
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.header-menu .el-menu-item:hover {
  background-color: var(--el-fill-color-light);
}

.header-menu .el-menu-item.is-active {
  background-color: transparent;
  border-bottom-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.notification-badge {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.user-info:hover {
  background-color: var(--el-fill-color-light);
}

.username {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.layout-main {
  flex: 1;
  padding: 0;
  background-color: var(--el-bg-color-page);
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background-color: var(--el-fill-color-lighter);
  transition: background-color 0.2s ease;
}

.notification-item:hover {
  background-color: var(--el-fill-color-light);
}

.notification-item--unread {
  background-color: var(--el-color-primary-light-9);
  border-left: 3px solid var(--el-color-primary);
}

.notification-icon {
  display: flex;
  align-items: flex-start;
  padding-top: 2px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 500;
  margin-bottom: 4px;
  color: var(--el-text-color-primary);
}

.notification-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
  line-height: 1.4;
}

.notification-time {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.notification-actions {
  flex-shrink: 0;
}

.notification-footer {
  display: flex;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

@media (max-width: 768px) {
  .layout-header {
    padding: 0 12px;
  }

  .header-center {
    display: none;
  }

  .logo-text {
    display: none;
  }

  .username {
    display: none;
  }

  .layout-main {
    padding: 12px;
  }
}
</style>