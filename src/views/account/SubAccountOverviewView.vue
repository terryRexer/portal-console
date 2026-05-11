<script setup lang="ts">
import { computed } from 'vue'
import { subAccountRows } from '@/state/subAccounts'
import {
  CheckCircleOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons-vue'

/** Portal 当前部门（F20 顶部上下文）；本页不提供切换，与框架一致 */
const PORTAL_CURRENT_DEPT_ID = 'dep-a'

const currentSub = computed(() =>
  subAccountRows.value.find((s) => s.departmentId === PORTAL_CURRENT_DEPT_ID),
)

/** 空状态等场景下的部门展示名（无子账户行时回退） */
const portalDeptDisplayName = computed(
  () =>
    subAccountRows.value.find((s) => s.departmentId === PORTAL_CURRENT_DEPT_ID)?.departmentName
    ?? '华北营销',
)

// ─── Mock 指标数据 ───
interface Metrics {
  // 近一月数据分析
  successAmount: number   // 交易成功金额
  successCount: number    // 交易成功笔数
  failAmount: number      // 交易失败金额
  failCount: number       // 交易失败笔数
  refundAmount: number    // 交易退款金额
  refundCount: number     // 交易退款笔数
  openCardCount: number   // 开卡数（本月）
  // 顶部余额卡用
  tradeAmount: number     // 近一月总交易金额
  tradeCount: number      // 近一月总笔数
  // 卡交易指标
  successRate: number     // 成功率 %
  failRate: number        // 失败率 %
  refundRate: number      // 退款率 %
}
const metricsMap: Record<string, Metrics> = {
  'sub-demo-a': {
    successAmount: 26890.5, successCount: 408,
    failAmount: 520.0,      failCount: 8,
    refundAmount: 180.0,    refundCount: 2,
    openCardCount: 3,
    tradeAmount: 26890.5,   tradeCount: 418,
    successRate: 97.6,      failRate: 1.9,      refundRate: 0.5,
  },
  'sub-demo-b': {
    successAmount: 12980.0, successCount: 196,
    failAmount: 620.0,      failCount: 8,
    refundAmount: 0,        refundCount: 0,
    openCardCount: 1,
    tradeAmount: 12980.0,   tradeCount: 206,
    successRate: 95.1,      failRate: 3.9,      refundRate: 0,
  },
  'sub-demo-c': {
    successAmount: 18420.75, successCount: 292,
    failAmount: 340.0,       failCount: 8,
    refundAmount: 96.0,      refundCount: 2,
    openCardCount: 2,
    tradeAmount: 18420.75,   tradeCount: 302,
    successRate: 96.7,       failRate: 2.6,      refundRate: 0.7,
  },
}
const metrics = computed<Metrics | null>(() =>
  currentSub.value ? (metricsMap[currentSub.value.id] ?? null) : null,
)

// ─── 卡片介绍 mock 数据 ───
const cardProducts = [
  { name: '广告投流卡1', issuer: 'US', currency: 'USD', platforms: 'Facebook/Google Ads/TikTok广告投放', remark: '建议先充值后再购入使用' },
  { name: '广告投流卡2', issuer: 'US', currency: 'USD', platforms: 'H5 Google / 专有注册审批', remark: '买卡' },
  { name: '边境充置卡', issuer: 'HK', currency: 'USD', platforms: '合适万事达不达地区', remark: '合规万事达不送投放' },
  { name: '投流油卡专用', issuer: 'HK', currency: 'USD', platforms: '墨西万方直送投放', remark: '墨西万方送投放' },
  { name: 'AI订阅1', issuer: 'US', currency: 'USD', platforms: 'OpenAI/Gemini/Claude/AI等订阅', remark: '建议先充值后再购入使用' },
  { name: 'AI订阅2', issuer: 'US', currency: 'USD', platforms: 'OpenAI/Gemini/Claude/AI等订阅', remark: '建议先充值后再购入使用' },
  { name: '测试-共享卡', issuer: '美国', currency: 'USD', platforms: '共享卡产品', remark: '共享卡-测试-回收下线' },
]
const cardColumns = [
  { title: '卡名称', dataIndex: 'name', key: 'name', width: 160 },
  { title: '发卡地', dataIndex: 'issuer', key: 'issuer', width: 80, align: 'center' as const },
  { title: '结算币种', dataIndex: 'currency', key: 'currency', width: 100, align: 'center' as const },
  { title: '适用平台', dataIndex: 'platforms', key: 'platforms', ellipsis: true },
  { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
]

function fmtMoney(v: number) {
  return v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<template>
  <div class="sub-ov">
    <!-- 面包屑 -->
    <a-breadcrumb class="portal-page-crumb">
      <a-breadcrumb-item>首页</a-breadcrumb-item>
    </a-breadcrumb>

    <!-- ===== 有子账户 ===== -->
    <template v-if="currentSub && metrics">

      <!-- ① 顶部：子账户额度卡（仿首页法币/数币额度布局） -->
      <div class="ov-quota-wrap">
        <!-- 左：子账户余额 -->
        <div class="ov-quota-panel ov-quota-panel--left">
          <div class="ov-quota-head">
            <span class="ov-quota-label">子账户余额</span>
            <span class="ov-quota-flag">🏦</span>
          </div>
          <div class="ov-quota-amount">
            {{ fmtMoney(currentSub.balance) }}
            <span class="ov-quota-unit">USD</span>
          </div>
          <div class="ov-quota-hint">
            <span>{{ currentSub.alias }}</span>
            <a-tag
              v-if="currentSub.status === '启用'"
              color="success"
              style="margin-left:8px; font-size:11px;"
            >
              <CheckCircleOutlined /> 启用
            </a-tag>
            <a-tag v-else color="warning" style="margin-left:8px; font-size:11px;">
              <PauseCircleOutlined /> 暂停
            </a-tag>
          </div>
        </div>

        <!-- 分隔线 -->
        <a-divider type="vertical" class="ov-quota-divider" />

        <!-- 右：近一月交易金额 -->
        <div class="ov-quota-panel ov-quota-panel--right">
          <div class="ov-quota-head">
            <span class="ov-quota-label">近一月交易金额</span>
            <a-tooltip title="统计当前部门子账户近30天卡消费金额">
              <span class="ov-quota-info">ℹ</span>
            </a-tooltip>
          </div>
          <div class="ov-quota-amount ov-quota-amount--secondary">
            {{ fmtMoney(metrics.tradeAmount) }}
            <span class="ov-quota-unit">USD</span>
          </div>
          <div class="ov-quota-actions">
            <a-button size="small">查看流水</a-button>
          </div>
          <div class="ov-quota-hint">共 {{ metrics.tradeCount }} 笔 · 成功 {{ metrics.successCount }} 笔</div>
        </div>
      </div>

      <!-- 暂停横幅 -->
      <a-alert
        v-if="currentSub.status === '暂停'"
        type="warning"
        show-icon
        style="margin-bottom:16px"
        :message="`子账户已暂停：${currentSub.latestPauseReason ?? '原因未填写'}`"
        description="暂停期间不可执行资金划入划出操作。如需恢复请联系管理员。"
      />

      <!-- ② 中部：近一月数据分析 + 卡交易指标 -->
      <a-row :gutter="16" style="margin-bottom:16px">
        <!-- 左：近一月数据分析 -->
        <a-col :xs="24" :md="13">
          <a-card :bordered="false" class="ov-analysis-card">
            <template #title>
              <span class="ov-analysis-title-bar">近一个月数据分析</span>
            </template>
            <template #extra>
              <span class="ov-analysis-extra">开卡数：{{ metrics.openCardCount }} 张</span>
            </template>
            <a-row class="ov-analysis-body">
              <!-- 交易成功 -->
              <a-col :span="8" class="ov-analysis-col">
                <div class="ov-col-label">交易成功</div>
                <div class="ov-col-row">
                  <span class="ov-col-key">金额</span>
                  <span class="ov-col-val success">
                    {{ fmtMoney(metrics.successAmount) }}
                    <span class="ov-col-currency">USD</span>
                  </span>
                </div>
                <div class="ov-col-row">
                  <span class="ov-col-key">笔数</span>
                  <span class="ov-col-val success">{{ metrics.successCount }}</span>
                </div>
              </a-col>
              <!-- 交易失败 -->
              <a-col :span="8" class="ov-analysis-col">
                <div class="ov-col-label">交易失败</div>
                <div class="ov-col-row">
                  <span class="ov-col-key">金额</span>
                  <span class="ov-col-val fail">
                    {{ fmtMoney(metrics.failAmount) }}
                    <span class="ov-col-currency">USD</span>
                  </span>
                </div>
                <div class="ov-col-row">
                  <span class="ov-col-key">笔数</span>
                  <span class="ov-col-val fail">{{ metrics.failCount }}</span>
                </div>
              </a-col>
              <!-- 交易退款 -->
              <a-col :span="8" class="ov-analysis-col ov-analysis-col--last">
                <div class="ov-col-label">交易退款</div>
                <div class="ov-col-row">
                  <span class="ov-col-key">金额</span>
                  <span class="ov-col-val">
                    {{ fmtMoney(metrics.refundAmount) }}
                    <span class="ov-col-currency">USD</span>
                  </span>
                </div>
                <div class="ov-col-row">
                  <span class="ov-col-key">笔数</span>
                  <span class="ov-col-val">{{ metrics.refundCount }}</span>
                </div>
              </a-col>
            </a-row>
          </a-card>
        </a-col>

        <!-- 右：卡交易指标（半圆仪表盘） -->
        <a-col :xs="24" :md="11">
          <a-card title="卡交易指标" :bordered="false" class="ov-metrics-card">
            <div class="ov-rings">
              <div class="ov-ring-item">
                <a-progress
                  type="dashboard"
                  :percent="Number(metrics.successRate.toFixed(1))"
                  :gap-degree="75"
                  :width="90"
                  stroke-color="#4096ff"
                  :format="(p: number) => p + '%'"
                />
                <div class="ov-ring-label">成功率</div>
              </div>
              <div class="ov-ring-item">
                <a-progress
                  type="dashboard"
                  :percent="Number(metrics.failRate.toFixed(1))"
                  :gap-degree="75"
                  :width="90"
                  stroke-color="#ff7875"
                  :format="(p: number) => p + '%'"
                />
                <div class="ov-ring-label">失败率</div>
              </div>
              <div class="ov-ring-item">
                <a-progress
                  type="dashboard"
                  :percent="Number(metrics.refundRate.toFixed(1))"
                  :gap-degree="75"
                  :width="90"
                  stroke-color="#d9d9d9"
                  :format="(p: number) => p + '%'"
                />
                <div class="ov-ring-label">退款率</div>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- ③ 底部：卡片介绍 -->
      <a-card title="卡片介绍" :bordered="false" class="ov-card-list">
        <a-table
          :columns="cardColumns"
          :data-source="cardProducts"
          :pagination="false"
          size="middle"
          row-key="name"
          :scroll="{ x: 800 }"
        />
      </a-card>

    </template>

    <!-- ===== 无子账户（空状态） ===== -->
    <template v-else>
      <a-card :bordered="false" class="ov-empty-card">
        <a-empty>
          <template #description>
            <span class="ov-empty-title">
              「{{ portalDeptDisplayName }}」暂未绑定子账户
            </span>
            <br />
            <span class="ov-empty-hint">
              请联系总部用户在「账户管理 → 子账户管理」中为该部门开立子账户。
            </span>
          </template>
        </a-empty>
      </a-card>
    </template>
  </div>
</template>

<style scoped lang="less">
.sub-ov {
  padding-bottom: 24px;
}

// ─── 顶部额度卡 ───
.ov-quota-wrap {
  display: flex;
  align-items: stretch;
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.ov-quota-panel {
  flex: 1;
  min-width: 0;

  &--left {
    padding-right: 24px;
  }

  &--right {
    padding-left: 24px;
  }
}

.ov-quota-divider {
  height: auto !important;
  align-self: stretch;
  margin: 0 !important;
}

.ov-quota-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.ov-quota-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
}

.ov-quota-flag {
  font-size: 16px;
}

.ov-quota-info {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.35);
  cursor: default;
}

.ov-quota-amount {
  font-size: 28px;
  font-weight: 700;
  line-height: 38px;
  color: rgba(0, 0, 0, 0.88);
  font-variant-numeric: tabular-nums;
  margin-bottom: 12px;

  &--secondary {
    font-size: 24px;
  }
}

.ov-quota-unit {
  font-size: 13px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.45);
  margin-left: 4px;
}

.ov-quota-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.ov-quota-hint {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
}

// ─── 近一月数据分析 ───
.ov-analysis-card,
.ov-metrics-card {
  border-radius: 8px;
  height: 100%;
}

.ov-analysis-extra {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.ov-analysis-body {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}

.ov-analysis-col {
  padding: 0 12px;
  border-right: 1px solid #f0f0f0;

  &--last {
    border-right: none;
  }

  &:first-child {
    padding-left: 0;
  }
}

.ov-col-label {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 12px;
}

.ov-col-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
}

.ov-col-key {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.ov-col-val {
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.65);
  font-variant-numeric: tabular-nums;

  &.success {
    color: #1677ff;
    font-weight: 600;
  }

  &.fail {
    color: #ff4d4f;
    font-weight: 600;
  }
}

.ov-col-currency {
  font-size: 11px;
  font-weight: 400;
  color: inherit;
  margin-left: 2px;
  opacity: 0.8;
}

.ov-analysis-title-bar {
  display: inline-flex;
  align-items: center;

  &::before {
    content: '';
    display: inline-block;
    width: 3px;
    height: 14px;
    background: #6a5acd;
    border-radius: 2px;
    margin-right: 8px;
  }
}

// ─── 卡交易指标（环形图） ───
.ov-rings {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 0;
}

.ov-ring-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.ov-ring-label {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

// ─── 卡片介绍 ───
.ov-card-list {
  border-radius: 8px;
}

// ─── 空状态 ───
.ov-empty-card {
  border-radius: 8px;
  padding: 40px 0;
}

.ov-empty-title {
  font-size: 15px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.65);
}

.ov-empty-hint {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.35);
}
</style>
