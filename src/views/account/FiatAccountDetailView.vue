<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { ExportOutlined } from '@ant-design/icons-vue'
import { Tag, message } from 'ant-design-vue'
import type { TableColumnsType } from 'ant-design-vue'
import PortalPageTitle from '@/components/PortalPageTitle.vue'
import { departments } from '@/state/enterpriseSettings'
import { DEMO_AUDIT_USER } from '@/constants/demoAudit'

// ──────────────────────────────────────────────
// 类型
// ──────────────────────────────────────────────
type FlowType = '额度调整' | '手续费' | '汇兑' | '手工调账' | '卡充值' | '共享账户充值' | '资金划入' | '资金划出'

interface FlowRow {
  id: string
  createdAt: string
  orderId: string
  department: string   // 归属部门
  type: FlowType
  amount: number       // 正数=收入，负数=支出
  balanceAfter: number
  operator: string
}

// ──────────────────────────────────────────────
// Mock 数据
// ──────────────────────────────────────────────
const allRows = ref<FlowRow[]>([
  { id: 'f1',  createdAt: '2026-05-10 11:35:22', orderId: '260510000000033098', department: '华北营销',  type: '额度调整',     amount: -70,   balanceAfter: 71.64,   operator: DEMO_AUDIT_USER },
  { id: 'f2',  createdAt: '2026-05-10 11:33:33', orderId: '260510000000009003', department: '华北营销',  type: '手续费',       amount: -0.3,  balanceAfter: 141.64,  operator: DEMO_AUDIT_USER },
  { id: 'f3',  createdAt: '2026-05-10 11:33:33', orderId: '260510000000009003', department: '总部',       type: '汇兑',         amount: 160,   balanceAfter: 141.84,  operator: DEMO_AUDIT_USER },
  { id: 'f4',  createdAt: '2026-05-09 16:46:06', orderId: '260509000000032046', department: '华东运营',  type: '手续费',       amount: -0.5,  balanceAfter: 41.94,   operator: DEMO_AUDIT_USER },
  { id: 'f5',  createdAt: '2026-05-09 16:46:06', orderId: '260509000000032046', department: '华东运营',  type: '额度调整',     amount: -15,   balanceAfter: 42.44,   operator: DEMO_AUDIT_USER },
  { id: 'f6',  createdAt: '2026-05-09 14:03:21', orderId: '260509000000033052', department: '华北营销',  type: '额度调整',     amount: -22,   balanceAfter: 57.44,   operator: DEMO_AUDIT_USER },
  { id: 'f7',  createdAt: '2026-05-08 20:30:41', orderId: '260508000000032094', department: '总部',       type: '额度调整',     amount: 5,     balanceAfter: 79.44,   operator: DEMO_AUDIT_USER },
  { id: 'f8',  createdAt: '2026-05-08 20:45:40', orderId: '260508000000033003', department: '华东运营',  type: '手续费',       amount: -0.5,  balanceAfter: 74.44,   operator: DEMO_AUDIT_USER },
  { id: 'f9',  createdAt: '2026-05-08 20:45:40', orderId: '260508000000033003', department: '华南研发',  type: '额度调整',     amount: -5,    balanceAfter: 74.94,   operator: DEMO_AUDIT_USER },
  { id: 'f10', createdAt: '2026-05-07 16:37:03', orderId: '260507000000031003', department: '华南研发',  type: '额度调整',     amount: 1,     balanceAfter: 79.94,   operator: DEMO_AUDIT_USER },
  { id: 'f11', createdAt: '2026-05-07 09:20:18', orderId: 'SAI20260507092018',  department: '华北营销',  type: '资金划入',     amount: 2000,  balanceAfter: 32000,   operator: DEMO_AUDIT_USER },
  { id: 'f12', createdAt: '2026-05-06 16:18:06', orderId: 'SAF20260506161806',  department: '华东运营',  type: '手续费',       amount: -111.5,balanceAfter: 18888.5, operator: DEMO_AUDIT_USER },
  { id: 'f13', createdAt: '2026-05-05 16:08:02', orderId: 'SAR20260505160802',  department: '华南研发',  type: '共享账户充值', amount: -1500, balanceAfter: 12500,   operator: DEMO_AUDIT_USER },
  { id: 'f14', createdAt: '2026-05-04 11:00:00', orderId: 'SAC20260504110000',  department: '华北营销',  type: '卡充值',       amount: -500,  balanceAfter: 9800,    operator: DEMO_AUDIT_USER },
  { id: 'f15', createdAt: '2026-05-03 09:10:00', orderId: 'SAO20260503091000',  department: '总部',       type: '资金划出',     amount: -200,  balanceAfter: 15000,   operator: DEMO_AUDIT_USER },
])

// ──────────────────────────────────────────────
// 筛选条件
// ──────────────────────────────────────────────
const queryType = ref<FlowType | undefined>(undefined)
const queryDept = ref<string | undefined>(undefined)
const queryDateStart = ref<string>('2026-05-04')
const queryDateEnd = ref<string>('2026-05-11')
const appliedType = ref<FlowType | undefined>(undefined)
const appliedDept = ref<string | undefined>(undefined)

const typeOptions: { label: string; value: FlowType }[] = [
  { label: '额度调整', value: '额度调整' },
  { label: '手续费',   value: '手续费' },
  { label: '汇兑',     value: '汇兑' },
  { label: '手工调账', value: '手工调账' },
  { label: '卡充值',   value: '卡充值' },
  { label: '共享账户充值', value: '共享账户充值' },
  { label: '资金划入', value: '资金划入' },
  { label: '资金划出', value: '资金划出' },
]

const deptOptions = computed(() => {
  const hqOpt = { label: '总部', value: '总部' }
  const customOpts = departments.value
    .filter((d) => !d.isHQ)
    .map((d) => ({ label: d.name, value: d.name }))
  return [hqOpt, ...customOpts]
})

function handleSearch() {
  appliedType.value = queryType.value
  appliedDept.value = queryDept.value
}

function handleReset() {
  queryType.value = undefined
  queryDept.value = undefined
  appliedType.value = undefined
  appliedDept.value = undefined
}

const displayRows = computed(() => {
  let rows = [...allRows.value]
  if (appliedType.value) rows = rows.filter((r) => r.type === appliedType.value)
  if (appliedDept.value) rows = rows.filter((r) => r.department === appliedDept.value)
  return rows
})

// ──────────────────────────────────────────────
// 格式化
// ──────────────────────────────────────────────
function formatMoney(n: number) {
  const abs = Math.abs(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${n < 0 ? '-' : '+'}${abs} USD`
}

function formatBalance(n: number) {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD'
}

const typeColorMap: Record<FlowType, string> = {
  '额度调整': 'processing',
  '手续费': 'default',
  '汇兑': 'cyan',
  '手工调账': 'orange',
  '卡充值': 'purple',
  '共享账户充值': 'geekblue',
  '资金划入': 'success',
  '资金划出': 'warning',
}

// ──────────────────────────────────────────────
// 列定义
// ──────────────────────────────────────────────
const columns: TableColumnsType<FlowRow> = [
  {
    title: '时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 176,
    align: 'center',
    ellipsis: true,
  },
  {
    title: '订单ID',
    dataIndex: 'orderId',
    key: 'orderId',
    width: 200,
    align: 'center',
    ellipsis: true,
  },
  {
    title: '归属部门',
    dataIndex: 'department',
    key: 'department',
    width: 120,
    align: 'center',
    ellipsis: true,
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 128,
    align: 'center',
    customRender: ({ text }: { text: FlowType }) =>
      h(Tag, { color: typeColorMap[text] ?? 'default' }, () => text),
  },
  {
    title: '交易金额',
    dataIndex: 'amount',
    key: 'amount',
    width: 148,
    align: 'center',
    ellipsis: true,
    customRender: ({ record }: { record: FlowRow }) => {
      const text = formatMoney(record.amount)
      const color = record.amount < 0 ? '#cf1322' : '#389e0d'
      return h('span', { style: { color, fontVariantNumeric: 'tabular-nums' } }, text)
    },
  },
  {
    title: '账户余额',
    dataIndex: 'balanceAfter',
    key: 'balanceAfter',
    width: 148,
    align: 'center',
    ellipsis: true,
    customRender: ({ record }: { record: FlowRow }) =>
      h('span', { style: { fontVariantNumeric: 'tabular-nums' } }, formatBalance(record.balanceAfter)),
  },
]

// ──────────────────────────────────────────────
// 导出（演示）
// ──────────────────────────────────────────────
function handleExport() {
  message.success('导出请求已发起（演示）')
}
</script>

<template>
  <div class="portal-page-card fiat-detail-page">
    <a-breadcrumb class="portal-page-crumb">
      <a-breadcrumb-item>账户管理-本期新增菜单</a-breadcrumb-item>
      <a-breadcrumb-item>法币账户明细-本期有改动-迁移到此</a-breadcrumb-item>
    </a-breadcrumb>

    <PortalPageTitle>法币账户明细-本期有改动-迁移到此</PortalPageTitle>
    <p class="portal-page-sub">
      需求演示：F8 总部视图子账户信息与流水——复用法币额度页面，新增「归属部门」筛选条件与列（路由 /account-mgmt/fiat-detail）
    </p>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-bar-left">
        <a-select
          v-model:value="queryType"
          placeholder="类型"
          allow-clear
          style="width: 160px"
          :options="typeOptions"
        />
        <a-select
          v-model:value="queryDept"
          placeholder="归属部门"
          allow-clear
          show-search
          option-filter-prop="label"
          style="width: 160px"
          :options="deptOptions"
        />
        <a-space :size="4">
          <span class="filter-label">日期：</span>
          <a-input v-model:value="queryDateStart" style="width: 120px" />
          <span style="padding: 0 4px; color: rgba(0,0,0,.45)">—</span>
          <a-input v-model:value="queryDateEnd" style="width: 120px" />
        </a-space>
        <a-button type="text" class="filter-search-btn" @click="handleSearch">
          <template #icon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </template>
        </a-button>
        <a-button size="small" @click="handleReset">重置</a-button>
      </div>

      <a-button type="primary" @click="handleExport">
        <template #icon><ExportOutlined /></template>
        导出
      </a-button>
    </div>

    <!-- 数据表格 -->
    <a-table
      row-key="id"
      :columns="columns"
      :data-source="displayRows"
      :pagination="{ pageSize: 10, showSizeChanger: true }"
      :scroll="{ x: 960 }"
      size="middle"
      class="fiat-table"
    >
      <template #emptyText>
        <a-empty description="暂无流水记录" />
      </template>
    </a-table>
  </div>
</template>

<style scoped lang="less">
.fiat-detail-page {
  padding: 24px;
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
  white-space: nowrap;
}

.filter-search-btn {
  color: rgba(0, 0, 0, 0.45);
  padding: 0 6px;

  &:hover {
    color: var(--ant-color-primary);
  }
}

.fiat-table {
  :deep(.ant-table-tbody .ant-table-cell) {
    font-size: 13px;
  }
}
</style>
