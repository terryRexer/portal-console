<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PortalPageTitle from '@/components/PortalPageTitle.vue'
import PositionsTab from '@/views/enterprise/PositionsTab.vue'
import DepartmentsTab from '@/views/enterprise/DepartmentsTab.vue'
import UserManagementTab from '@/views/enterprise/UserManagementTab.vue'

const route = useRoute()
const router = useRouter()

type TabKey = 'positions' | 'departments' | 'users'

const activeTab = ref<TabKey>('users')

function normalizeTab(q: unknown): TabKey {
  if (q === 'departments' || q === 'users' || q === 'positions') return q
  return 'users'
}

watch(
  () => route.query.tab,
  (t) => {
    activeTab.value = normalizeTab(t)
  },
  { immediate: true },
)

watch(activeTab, (t) => {
  router.replace({ path: route.path, query: { ...route.query, tab: t } })
})
</script>

<template>
  <div class="portal-page-card enterprise-settings">
    <a-breadcrumb class="portal-page-crumb">
      <a-breadcrumb-item>设置-本期新增</a-breadcrumb-item>
      <a-breadcrumb-item>企业管理-本期新增</a-breadcrumb-item>
    </a-breadcrumb>

    <PortalPageTitle>企业管理-本期新增</PortalPageTitle>
    <p class="portal-page-sub">
      需求演示：F3 用户 · F1 岗位与权限 · F2 部门管理（路由 /settings/user-management）
    </p>

    <a-tabs v-model:active-key="activeTab" size="large" class="enterprise-tabs">
      <a-tab-pane key="users" tab="用户" />
      <a-tab-pane key="positions" tab="岗位" />
      <a-tab-pane key="departments" tab="部门" />
    </a-tabs>

    <div class="enterprise-tab-panel">
      <UserManagementTab v-if="activeTab === 'users'" />
      <PositionsTab v-else-if="activeTab === 'positions'" />
      <DepartmentsTab v-else />
    </div>
  </div>
</template>

<style scoped lang="less">
.enterprise-tabs {
  margin-bottom: 8px;

  :deep(.ant-tabs-nav) {
    margin-bottom: 0;
  }
}

.enterprise-tab-panel {
  padding-top: 16px;
}
</style>
