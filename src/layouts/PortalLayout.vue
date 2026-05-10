<script setup lang="ts">
import { h, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { MenuProps } from 'ant-design-vue'
import {
  HomeOutlined,
  CreditCardOutlined,
  WalletOutlined,
  SettingOutlined,
  GlobalOutlined,
  UserOutlined,
  BankOutlined,
  TransactionOutlined,
  DownOutlined,
  PieChartOutlined,
} from '@ant-design/icons-vue'

// ─── 部门切换（F20 当前部门上下文） ───
const deptOptions = [
  { label: '华北营销', value: 'dep-a' },
  { label: '华南投放', value: 'dep-b' },
  { label: '华东运营', value: 'dep-c' },
]
const currentDeptId = ref('dep-a')

const route = useRoute()
const router = useRouter()
const collapsed = ref(false)
const selectedKeys = ref<string[]>([normalizeSelected(route.path)])
const openKeys = ref(['quota', 'cards', 'account-mgmt', 'settings'])

function normalizeSelected(path: string) {
  const key = path.startsWith('/') ? path.slice(1) : path
  if (key === 'settings/user-management/invite' || key.startsWith('settings/user-management/'))
    return 'settings/user-management'
  if (key.startsWith('account-mgmt/')) return key
  return key
}

watch(
  () => route.path,
  (p) => {
    selectedKeys.value = [normalizeSelected(p)]
  },
)

const menuItems: MenuProps['items'] = [
  { key: 'home', icon: () => h(HomeOutlined), label: '首页' },
  {
    key: 'account-mgmt/sub-account-overview',
    icon: () => h(PieChartOutlined),
    label: '子账户概览-本期内容',
  },
  {
    key: 'quota',
    icon: () => h(WalletOutlined),
    label: '额度',
    children: [
      { key: 'quota/recharge', label: '账户充值' },
      { key: 'quota/orders', label: '充值订单' },
      { key: 'quota/exchange', label: '兑换记录' },
    ],
  },
  {
    key: 'cards',
    icon: () => h(CreditCardOutlined),
    label: '卡片管理',
    children: [
      { key: 'cards/apply', label: '申请开卡' },
      { key: 'cards/tasks', label: '开卡任务' },
      { key: 'cards/list', label: '卡列表' },
      { key: 'cards/holders', label: '持卡人管理' },
    ],
  },
  {
    key: 'account-mgmt',
    icon: () => h(BankOutlined),
    label: '账户管理-本期新增菜单',
    children: [
      { key: 'account-mgmt/sub-accounts', label: '子账户管理-本期内容' },
      { key: 'account-mgmt/fiat-detail', label: '法币账户明细-本期有改动-迁移到此' },
      { key: 'account-mgmt/crypto-detail', label: '数币账户明细-迁移到此' },
    ],
  },
  { key: 'transactions', icon: () => h(TransactionOutlined), label: '交易详情' },
  {
    key: 'settings',
    icon: () => h(SettingOutlined),
    label: '设置-本期新增',
    children: [
      { key: 'settings/user-management', label: '企业管理-本期新增' },
      { key: 'settings/account-security', label: '账户安全' },
      { key: 'settings/login-password', label: '登录密码' },
    ],
  },
  { key: 'open-platform', icon: () => h(GlobalOutlined), label: '开放平台' },
]

function onMenuClick({ key }: { key: string }) {
  if (!key.includes('/') && key !== 'home') return
  const path = key === 'home' ? '/home' : `/${key}`
  router.push(path)
}
</script>

<template>
  <a-layout class="portal-root">
    <!-- 顶部一体化渐变导航栏 -->
    <a-layout-header class="portal-top-header">
      <!-- 左：品牌 Logo -->
      <div class="portal-top-left">
        <span class="portal-brand">MarsWallet</span>
      </div>

      <!-- 中：公告文字 -->
      <div class="portal-top-center">
        <span class="portal-notice-dot" />
        <span class="portal-notice-text">
          新服务上线 · 已支持 Facebook、Google Ads 广告投流服务，助力产客量效迅速增长
        </span>
      </div>

      <!-- 右：部门切换 + 用户头像 -->
      <div class="portal-top-right">
        <a-select
          v-model:value="currentDeptId"
          :options="deptOptions"
          size="small"
          class="portal-dept-select"
          :bordered="false"
          :suffix-icon="h(DownOutlined)"
        />
        <div class="portal-avatar">
          <UserOutlined />
        </div>
      </div>
    </a-layout-header>


    <a-layout class="portal-inner">
      <a-layout-sider
        v-model:collapsed="collapsed"
        class="portal-sider"
        width="220"
        collapsible
        theme="dark"
      >
        <a-menu
          v-model:open-keys="openKeys"
          v-model:selected-keys="selectedKeys"
          mode="inline"
          theme="dark"
          :items="menuItems"
          @click="onMenuClick"
        />
      </a-layout-sider>

      <a-layout-content class="portal-content-wrap">
        <div class="portal-content-inner">
          <router-view />
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped lang="less">
.portal-root {
  min-height: 100vh;
  background: #f0f2f5;
}

// ─── 顶部渐变导航栏（单条，对标截图） ───
.portal-top-header {
  display: flex;
  align-items: center;
  height: 52px;
  padding: 0 20px;
  background: linear-gradient(90deg, #6a5acd 0%, #7c6cdf 40%, #9b8cfa 100%);
  line-height: 52px;
}

.portal-top-left {
  flex-shrink: 0;
  margin-right: 24px;
}

.portal-brand {
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.01em;
}

.portal-top-center {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.portal-notice-dot {
  flex-shrink: 0;
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ffe58f;
}

.portal-notice-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.92);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.portal-top-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 16px;
}

// 部门切换下拉（白色文字，透明背景）
.portal-dept-select {
  min-width: 110px;

  :deep(.ant-select-selector) {
    background: rgba(255, 255, 255, 0.15) !important;
    border: 1px solid rgba(255, 255, 255, 0.3) !important;
    border-radius: 4px !important;
    color: #fff !important;
    font-size: 13px !important;
  }

  :deep(.ant-select-selection-item) {
    color: #fff !important;
  }

  :deep(.ant-select-arrow) {
    color: rgba(255, 255, 255, 0.7) !important;
  }
}

// 用户头像圆圈
.portal-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.35);

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.portal-inner {
  min-height: calc(100vh - 52px);
}

.portal-sider {
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);
}

.portal-content-wrap {
  padding: 16px 20px 24px;
}

.portal-content-inner {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
