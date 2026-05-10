import { createRouter, createWebHistory } from 'vue-router'
import PortalLayout from '@/layouts/PortalLayout.vue'
import EnterpriseSettingsView from '@/views/enterprise/EnterpriseSettingsView.vue'
import InviteUserView from '@/views/enterprise/InviteUserView.vue'
import PlaceholderView from '@/views/PlaceholderView.vue'
import InviteActivationView from '@/views/invite/InviteActivationView.vue'
import InviteEmailSampleView from '@/views/invite/InviteEmailSampleView.vue'
import SubAccountManagementView from '@/views/account/SubAccountManagementView.vue'
import SubAccountOverviewView from '@/views/account/SubAccountOverviewView.vue'
import FiatAccountDetailView from '@/views/account/FiatAccountDetailView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    breadcrumb?: string[]
  }
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/invite/activate',
      name: 'InviteActivate',
      component: InviteActivationView,
      meta: { title: '账号激活' },
    },
    {
      path: '/invite/email-sample',
      name: 'InviteEmailSample',
      component: InviteEmailSampleView,
      meta: { title: '邀请邮件（演示）' },
    },
    {
      path: '/',
      component: PortalLayout,
      redirect: '/settings/user-management',
      children: [
        { path: 'home', name: 'Home', component: PlaceholderView, meta: { title: '首页', breadcrumb: ['首页'] } },
        { path: 'quota/recharge', name: 'QuotaRecharge', component: PlaceholderView, meta: { title: '账户充值', breadcrumb: ['额度', '账户充值'] } },
        { path: 'quota/orders', name: 'QuotaOrders', component: PlaceholderView, meta: { title: '充值订单', breadcrumb: ['额度', '充值订单'] } },
        { path: 'quota/exchange', name: 'QuotaExchange', component: PlaceholderView, meta: { title: '兑换记录', breadcrumb: ['额度', '兑换记录'] } },
        { path: 'cards/apply', name: 'CardApply', component: PlaceholderView, meta: { title: '申请开卡', breadcrumb: ['卡片管理', '申请开卡'] } },
        { path: 'cards/tasks', name: 'CardTasks', component: PlaceholderView, meta: { title: '开卡任务', breadcrumb: ['卡片管理', '开卡任务'] } },
        { path: 'cards/list', name: 'CardList', component: PlaceholderView, meta: { title: '卡列表', breadcrumb: ['卡片管理', '卡列表'] } },
        { path: 'cards/holders', name: 'CardHolders', component: PlaceholderView, meta: { title: '持卡人管理', breadcrumb: ['卡片管理', '持卡人管理'] } },
        {
          path: 'account-mgmt/sub-account-overview',
          name: 'SubAccountOverview',
          component: SubAccountOverviewView,
          meta: {
            title: '子账户概览-本期内容',
            breadcrumb: ['账户管理-本期新增菜单', '子账户概览-本期内容'],
          },
        },
        {
          path: 'account-mgmt/sub-accounts',
          name: 'SubAccountManagement',
          component: SubAccountManagementView,
          meta: {
            title: '子账户管理-本期内容',
            breadcrumb: ['账户管理-本期新增菜单', '子账户管理-本期内容'],
          },
        },
        {
          path: 'settings/account/sub-accounts',
          redirect: { path: '/account-mgmt/sub-account-overview' },
        },
        {
          path: 'account-mgmt/fiat-detail',
          name: 'FiatAccountDetail',
          component: FiatAccountDetailView,
          meta: {
            title: '法币账户明细-本期有改动-迁移到此',
            breadcrumb: ['账户管理-本期新增菜单', '法币账户明细-本期有改动-迁移到此'],
          },
        },
        {
          path: 'account-mgmt/crypto-detail',
          name: 'CryptoAccountDetail',
          component: PlaceholderView,
          meta: {
            title: '数币账户明细-迁移到此',
            breadcrumb: ['账户管理-本期新增菜单', '数币账户明细-迁移到此'],
          },
        },
        { path: 'account/detail', redirect: { path: '/account-mgmt/fiat-detail' } },
        { path: 'transactions', name: 'Transactions', component: PlaceholderView, meta: { title: '交易详情', breadcrumb: ['交易详情'] } },
        { path: 'open-platform', name: 'OpenPlatform', component: PlaceholderView, meta: { title: '开放平台', breadcrumb: ['开放平台'] } },
        {
          path: 'settings/user-management/invite',
          name: 'InviteUser',
          component: InviteUserView,
          meta: {
            title: '邀请用户',
            breadcrumb: ['设置-本期新增', '企业管理-本期新增', '邀请用户'],
          },
        },
        {
          path: 'settings/user-management',
          name: 'EnterpriseSettings',
          component: EnterpriseSettingsView,
          meta: { title: '企业管理-本期新增', breadcrumb: ['设置-本期新增', '企业管理-本期新增'] },
        },
        { path: 'settings/account-security', name: 'AccountSecurity', component: PlaceholderView, meta: { title: '账户安全', breadcrumb: ['设置-本期新增', '账户安全'] } },
        { path: 'settings/login-password', name: 'LoginPassword', component: () => import('@/views/LoginPasswordView.vue'), meta: { title: '登录密码', breadcrumb: ['设置-本期新增', '登录密码'] } },
      ],
    },
  ],
})

