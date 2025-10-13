<template>
  <div class="page-container">
    <!-- 页面标题和操作 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h1>创作者账号</h1>
        <el-tag type="info">{{ accounts.length }} 个账号</el-tag>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          添加账号
        </el-button>
        <el-button @click="refreshAccounts">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="content-card">
      <el-form :model="filters" inline>
        <el-form-item label="平台">
          <el-select v-model="filters.platform" placeholder="选择平台" clearable>
            <el-option label="全部" value="" />
            <el-option label="TikTok" value="tiktok" />
            <el-option label="Instagram" value="instagram" />
            <el-option label="YouTube" value="youtube" />
            <el-option label="Facebook" value="facebook" />
            <el-option label="小红书" value="xiaohongshu" />
            <el-option label="抖音" value="douyin" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="选择状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="活跃" value="active" />
            <el-option label="暂停" value="paused" />
            <el-option label="错误" value="error" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input
            v-model="filters.search"
            placeholder="输入用户名或备注"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
    </div>

    <!-- 账号列表 -->
    <div class="content-card table-container">
      <el-table
        v-loading="loading"
        :data="filteredAccounts"
        style="width: 100%"
        empty-text="暂无账号数据"
      >
        <el-table-column width="60">
          <template #default="{ row }">
            <el-avatar :src="row.avatarUrl" :size="40">
              <el-icon><User /></el-icon>
            </el-avatar>
          </template>
        </el-table-column>

        <el-table-column label="账号信息" min-width="200">
          <template #default="{ row }">
            <div class="account-info">
              <div class="account-name">
                {{ row.displayName || row.username }}
                <el-icon v-if="row.isVerified" color="#409EFF" size="14">
                  <CircleCheck />
                </el-icon>
              </div>
              <div class="account-username">@{{ row.username }}</div>
              <div class="account-platform">
                <span :class="`platform-tag platform-tag--${row.platformName}`">
                  {{ row.platformDisplayName }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="粉丝数" prop="followerCount" sortable width="120">
          <template #default="{ row }">
            {{ formatNumber(row.followerCount) }}
          </template>
        </el-table-column>

        <el-table-column label="视频数" prop="totalVideos" sortable width="100">
          <template #default="{ row }">
            {{ row.totalVideos }}
          </template>
        </el-table-column>

        <el-table-column label="总播放量" sortable width="120">
          <template #default="{ row }">
            {{ formatNumber(row.totalViews) }}
          </template>
        </el-table-column>

        <el-table-column label="总互动量" sortable width="120">
          <template #default="{ row }">
            {{ formatNumber(row.totalLikes + row.totalComments) }}
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <span :class="`status-tag status-tag--${row.status}`">
              {{ getStatusText(row.status) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="最后更新" width="120">
          <template #default="{ row }">
            {{ formatTime(row.lastScrapedAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click="viewVideos(row)"
            >
              视频
            </el-button>
            <el-button
              type="primary"
              size="small"
              link
              @click="editAccount(row)"
            >
              编辑
            </el-button>
            <el-dropdown @command="(command) => handleAction(command, row)">
              <el-button type="primary" size="small" link>
                更多
                <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="refresh">刷新数据</el-dropdown-item>
                  <el-dropdown-item command="pause" v-if="row.status === 'active'">
                    暂停监控
                  </el-dropdown-item>
                  <el-dropdown-item command="resume" v-else>
                    恢复监控
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <span style="color: var(--el-color-danger)">删除账号</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加账号对话框 -->
    <el-dialog
      v-model="showAddDialog"
      title="添加创作者账号"
      width="500px"
      :before-close="handleCloseAddDialog"
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="addFormRules"
        label-width="100px"
      >
        <el-form-item label="主页链接" prop="profileUrl">
          <el-input
            v-model="addForm.profileUrl"
            placeholder="请输入创作者个人主页链接"
            clearable
          >
            <template #prepend>
              <el-select
                v-model="addForm.platformType"
                placeholder="平台"
                style="width: 120px"
              >
                <el-option label="TikTok" value="tiktok" />
                <el-option label="Instagram" value="instagram" />
                <el-option label="YouTube" value="youtube" />
                <el-option label="Facebook" value="facebook" />
                <el-option label="小红书" value="xiaohongshu" />
                <el-option label="抖音" value="douyin" />
              </el-select>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="备注名称" prop="displayName">
          <el-input
            v-model="addForm.displayName"
            placeholder="自定义备注名称（可选）"
            clearable
          />
        </el-form-item>
        <el-form-item label="抓取频率" prop="scrapeFrequency">
          <el-select v-model="addForm.scrapeFrequency" placeholder="选择频率">
            <el-option label="每6小时" :value="6" />
            <el-option label="每12小时" :value="12" />
            <el-option label="每24小时" :value="24" />
            <el-option label="每48小时" :value="48" />
            <el-option label="每72小时" :value="72" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddAccount" :loading="adding">
          添加账号
        </el-button>
      </template>
    </el-dialog>

    <!-- 编辑账号对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑账号"
      width="500px"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editFormRules"
        label-width="100px"
      >
        <el-form-item label="备注名称" prop="displayName">
          <el-input
            v-model="editForm.displayName"
            placeholder="自定义备注名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="抓取频率" prop="scrapeFrequency">
          <el-select v-model="editForm.scrapeFrequency" placeholder="选择频率">
            <el-option label="每6小时" :value="6" />
            <el-option label="每12小时" :value="12" />
            <el-option label="每24小时" :value="24" />
            <el-option label="每48小时" :value="48" />
            <el-option label="每72小时" :value="72" />
          </el-select>
        </el-form-item>
        <el-form-item label="账号状态" prop="status">
          <el-select v-model="editForm.status" placeholder="选择状态">
            <el-option label="活跃" value="active" />
            <el-option label="暂停" value="paused" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleEditAccount" :loading="editing">
          保存修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import type { CreatorAccount, AccountStatus, AddAccountRequest } from '@/types'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const adding = ref(false)
const editing = ref(false)
const showAddDialog = ref(false)
const showEditDialog = ref(false)

// 账号列表
const accounts = ref<CreatorAccount[]>([])

// 筛选条件
const filters = reactive({
  platform: '',
  status: '',
  search: ''
})

// 表单引用
const addFormRef = ref<FormInstance>()
const editFormRef = ref<FormInstance>()

// 添加账号表单
const addForm = reactive<AddAccountRequest>({
  profileUrl: '',
  displayName: '',
  scrapeFrequency: 24,
  platformType: ''
})

// 编辑账号表单
const editForm = reactive({
  id: 0,
  displayName: '',
  scrapeFrequency: 24,
  status: 'active' as AccountStatus
})

// 表单验证规则
const addFormRules = {
  profileUrl: [
    { required: true, message: '请输入主页链接', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL', trigger: 'blur' }
  ]
}

const editFormRules = {
  displayName: [
    { max: 50, message: '备注名称不能超过50个字符', trigger: 'blur' }
  ]
}

// 计算属性
const filteredAccounts = computed(() => {
  let result = accounts.value

  if (filters.platform) {
    result = result.filter(account => account.platform?.name === filters.platform)
  }

  if (filters.status) {
    result = result.filter(account => account.status === filters.status)
  }

  if (filters.search) {
    const search = filters.search.toLowerCase()
    result = result.filter(account =>
      account.username.toLowerCase().includes(search) ||
      (account.displayName && account.displayName.toLowerCase().includes(search))
    )
  }

  return result
})

// 工具函数
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

const formatTime = (timeStr?: string): string => {
  if (!timeStr) return '从未'
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

const getStatusText = (status: string): string => {
  const statusMap = {
    active: '活跃',
    paused: '暂停',
    deleted: '已删除',
    error: '错误'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

// 加载账号数据
const loadAccounts = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 模拟数据
    accounts.value = [
      {
        id: 1,
        userId: 1,
        platformId: 1,
        platformUserId: 'user1',
        username: 'creator_one',
        displayName: '创作者一号',
        profileUrl: 'https://www.tiktok.com/@creator_one',
        avatarUrl: '',
        bio: '这是一个创作者账号',
        followerCount: 125000,
        followingCount: 450,
        totalVideos: 156,
        isVerified: true,
        status: 'active',
        lastScrapedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        lastVideoCrawlAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        scrapeFrequency: 24,
        metadata: {},
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-13T00:00:00Z',
        platform: {
          id: 1,
          name: 'tiktok',
          displayName: 'TikTok',
          baseUrl: 'https://www.tiktok.com',
          urlPattern: '^https://(www\\.)?tiktok\\.com/@[^/]+/?',
          colorCode: '#000000',
          rateLimit: 100,
          supportedFeatures: [],
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-13T00:00:00Z'
        }
      },
      {
        id: 2,
        userId: 1,
        platformId: 2,
        platformUserId: 'user2',
        username: 'instagram_creator',
        displayName: 'Instagram达人',
        profileUrl: 'https://www.instagram.com/instagram_creator',
        avatarUrl: '',
        bio: 'Instagram内容创作者',
        followerCount: 89000,
        followingCount: 320,
        totalVideos: 89,
        isVerified: false,
        status: 'active',
        lastScrapedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        lastVideoCrawlAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        scrapeFrequency: 24,
        metadata: {},
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-13T00:00:00Z',
        platform: {
          id: 2,
          name: 'instagram',
          displayName: 'Instagram',
          baseUrl: 'https://www.instagram.com',
          urlPattern: '^https://(www\\.)?instagram\\.com/[^/]+/?',
          colorCode: '#E4405F',
          rateLimit: 100,
          supportedFeatures: [],
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-13T00:00:00Z'
        }
      }
    ]
  } catch (error) {
    console.error('加载账号失败:', error)
    ElMessage.error('加载账号数据失败')
  } finally {
    loading.value = false
  }
}

// 处理搜索
const handleSearch = () => {
  // 搜索逻辑已在计算属性中实现
}

// 刷新账号列表
const refreshAccounts = () => {
  loadAccounts()
}

// 查看视频
const viewVideos = (account: CreatorAccount) => {
  router.push(`/accounts/${account.id}/videos`)
}

// 编辑账号
const editAccount = (account: CreatorAccount) => {
  editForm.id = account.id
  editForm.displayName = account.displayName || ''
  editForm.scrapeFrequency = account.scrapeFrequency
  editForm.status = account.status
  showEditDialog.value = true
}

// 处理操作命令
const handleAction = async (command: string, account: CreatorAccount) => {
  switch (command) {
    case 'refresh':
      await refreshAccount(account)
      break
    case 'pause':
      await updateAccountStatus(account, 'paused')
      break
    case 'resume':
      await updateAccountStatus(account, 'active')
      break
    case 'delete':
      await deleteAccount(account)
      break
  }
}

// 刷新单个账号
const refreshAccount = async (account: CreatorAccount) => {
  try {
    ElMessage.info('开始刷新账号数据...')
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))
    ElMessage.success('账号数据刷新成功')
    loadAccounts()
  } catch (error) {
    ElMessage.error('刷新失败')
  }
}

// 更新账号状态
const updateAccountStatus = async (account: CreatorAccount, status: AccountStatus) => {
  try {
    const action = status === 'active' ? '恢复' : '暂停'
    await ElMessageBox.confirm(
      `确定要${action}监控账号 "${account.displayName || account.username}" 吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    account.status = status
    ElMessage.success(`账号${action}成功`)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 删除账号
const deleteAccount = async (account: CreatorAccount) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除账号 "${account.displayName || account.username}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    const index = accounts.value.findIndex(a => a.id === account.id)
    if (index > -1) {
      accounts.value.splice(index, 1)
    }

    ElMessage.success('账号删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 处理添加账号
const handleAddAccount = async () => {
  if (!addFormRef.value) return

  try {
    await addFormRef.value.validate()
    adding.value = true

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 添加新账号到列表
    const newAccount: CreatorAccount = {
      id: Date.now(),
      userId: 1,
      platformId: 1,
      platformUserId: 'new_user',
      username: addForm.profileUrl.split('/').pop() || 'new_user',
      displayName: addForm.displayName,
      profileUrl: addForm.profileUrl,
      followerCount: 0,
      followingCount: 0,
      totalVideos: 0,
      isVerified: false,
      status: 'active',
      scrapeFrequency: addForm.scrapeFrequency,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    accounts.value.unshift(newAccount)

    ElMessage.success('账号添加成功，正在抓取初始数据...')
    showAddDialog.value = false
    resetAddForm()
  } catch (error) {
    console.error('添加账号失败:', error)
  } finally {
    adding.value = false
  }
}

// 处理编辑账号
const handleEditAccount = async () => {
  if (!editFormRef.value) return

  try {
    await editFormRef.value.validate()
    editing.value = true

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 更新账号信息
    const account = accounts.value.find(a => a.id === editForm.id)
    if (account) {
      account.displayName = editForm.displayName
      account.scrapeFrequency = editForm.scrapeFrequency
      account.status = editForm.status
      account.updatedAt = new Date().toISOString()
    }

    ElMessage.success('账号信息更新成功')
    showEditDialog.value = false
  } catch (error) {
    console.error('更新账号失败:', error)
  } finally {
    editing.value = false
  }
}

// 重置添加表单
const resetAddForm = () => {
  addForm.profileUrl = ''
  addForm.displayName = ''
  addForm.scrapeFrequency = 24
  addForm.platformType = ''
  addFormRef.value?.resetFields()
}

// 关闭添加对话框
const handleCloseAddDialog = () => {
  resetAddForm()
  showAddDialog.value = false
}

// 生命周期
onMounted(() => {
  loadAccounts()
})
</script>

<style scoped>
.toolbar {
  margin-bottom: 20px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-left h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.account-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.account-username {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.account-platform {
  margin-top: 2px;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .toolbar-left,
  .toolbar-right {
    justify-content: space-between;
  }

  .el-table {
    font-size: 12px;
  }
}
</style>