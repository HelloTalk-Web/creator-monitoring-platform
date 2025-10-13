import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/accounts'
  },
  {
    path: '/accounts',
    name: 'Accounts',
    component: () => import('@/views/Accounts.vue'),
    meta: {
      title: '创作者账号',
      icon: 'User'
    }
  },
  {
    path: '/accounts/:accountId/videos',
    name: 'AccountVideos',
    component: () => import('@/views/Videos.vue'),
    meta: {
      title: '视频数据分析',
      icon: 'VideoPlay'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: {
      title: '系统设置',
      icon: 'Setting'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 创作者数据监控平台`
  }
  next()
})

export default router