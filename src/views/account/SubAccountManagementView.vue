<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { Button, message, Modal, Tag, Tooltip } from 'ant-design-vue'
import PortalPageTitle from '@/components/PortalPageTitle.vue'
import type { TableColumnsType } from 'ant-design-vue'
import type { SubAccountFundInLog, SubAccountFundOutLog, SubAccountRow, SubAccountStatus } from '@/types/subAccount'
import type { DepartmentDef } from '@/types/f15UserManagement'
import { departments } from '@/state/enterpriseSettings'
import { demoMainAccountBalance, subAccountRows } from '@/state/subAccounts'
import { DEMO_AUDIT_USER, demoNow } from '@/constants/demoAudit'

/** 全部部门（排序：总部在前）— 仅用于排序来源 */
const sortedDepartments = computed(() => {
  const list: DepartmentDef[] = [...departments.value]
  return list.sort((a, b) => {
    if (a.isHQ) return -1
    if (b.isHQ) return 1
    return a.name.localeCompare(b.name, 'zh-CN')
  })
})

/** 开立子账户可选部门：不含总部（总部为系统预置，默认存在） */
const departmentsForOpen = computed(() => sortedDepartments.value.filter((d) => !d.isHQ))

/** 查询「关联部门」与开立一致：仅客户自建部门 */
const departmentsForQuery = departmentsForOpen

/** 查询条件（上方） */
const queryKeyword = ref('')
const queryDeptId = ref<string | undefined>(undefined)
const appliedKeyword = ref('')
const appliedDeptId = ref<string | undefined>(undefined)

/** 新增抽屉 */
const drawerOpen = ref(false)
const departmentId = ref<string | undefined>(undefined)
const aliasInput = ref('')
const transferAmount = ref<number>(0)
const submitting = ref(false)

/** F6 划入抽屉 */
const fundInDrawerOpen = ref(false)
const fundInTarget = ref<SubAccountRow | null>(null)
const fundInAmount = ref<number | null>(null)
const fundInSubmitting = ref(false)
const fundInLogs = ref<SubAccountFundInLog[]>([
  {
    id: 'in-demo-1',
    createdAt: '2026-05-08 09:12:20',
    subAccountId: 'sub-demo-a',
    alias: '华北营销账户',
    departmentName: '华北营销',
    amount: 3000,
    operator: DEMO_AUDIT_USER,
  },
  {
    id: 'in-demo-2',
    createdAt: '2026-05-08 10:26:45',
    subAccountId: 'sub-demo-c',
    alias: '华东运营账户',
    departmentName: '华东运营',
    amount: 1500,
    operator: DEMO_AUDIT_USER,
  },
])

/** F7 划出抽屉 */
const fundOutDrawerOpen = ref(false)
const fundOutTarget = ref<SubAccountRow | null>(null)
const fundOutAmount = ref<number | null>(null)
const fundOutSubmitting = ref(false)
const fundOutLogs = ref<SubAccountFundOutLog[]>([
  {
    id: 'out-demo-1',
    createdAt: '2026-05-08 11:08:10',
    subAccountId: 'sub-demo-a',
    alias: '华北营销账户',
    departmentName: '华北营销',
    amount: 800,
    operator: DEMO_AUDIT_USER,
  },
  {
    id: 'out-demo-2',
    createdAt: '2026-05-08 11:43:32',
    subAccountId: 'sub-demo-c',
    alias: '华东运营账户',
    departmentName: '华东运营',
    amount: 1200,
    operator: DEMO_AUDIT_USER,
  },
])

type SubAccountFlowType = '资金划入' | '资金划出' | '卡充值' | '共享账户充值' | '手续费扣收' | '手工调账'
interface SubAccountFlowLog {
  id: string
  createdAt: string
  subAccountId: string
  type: SubAccountFlowType
  amount: number
  balanceAfter: number
  bizNo: string
  operator: string
  remark: string
}

/** F8 子账户流水抽屉 */
const flowDrawerOpen = ref(false)
const flowTarget = ref<SubAccountRow | null>(null)
const subAccountFlowLogs = ref<SubAccountFlowLog[]>([
  {
    id: 'flow-demo-a-1',
    createdAt: '2026-05-07 09:20:18',
    subAccountId: 'sub-demo-a',
    type: '资金划入',
    amount: 2000,
    balanceAfter: 32000,
    bizNo: 'SAI20260507092018',
    operator: DEMO_AUDIT_USER,
    remark: '总部追加预算',
  },
  {
    id: 'flow-demo-b-1',
    createdAt: '2026-05-06 16:18:06',
    subAccountId: 'sub-demo-b',
    type: '手续费扣收',
    amount: 111.5,
    balanceAfter: 18888.5,
    bizNo: 'SAF20260506161806',
    operator: DEMO_AUDIT_USER,
    remark: '月度手续费',
  },
  {
    id: 'flow-demo-c-1',
    createdAt: '2026-05-05 16:08:02',
    subAccountId: 'sub-demo-c',
    type: '共享账户充值',
    amount: 1500,
    balanceAfter: 12500,
    bizNo: 'SAR20260505160802',
    operator: DEMO_AUDIT_USER,
    remark: '共享投放预算',
  },
])

/** F9 子账户生命周期（暂停 / 启用） */
const lifecycleDrawerOpen = ref(false)
const lifecycleSubmitting = ref(false)
const lifecycleTarget = ref<SubAccountRow | null>(null)
const lifecycleTargetStatus = ref<SubAccountStatus>('暂停')
const lifecycleReason = ref('')

/** 主资金账户余额刷新（演示：模拟拉取最新余额） */
const mainBalanceRefreshing = ref(false)
const mainBalanceLastRefreshed = ref<string | null>(null)

/** 划入抽屉内展示的子账户行（与列表同步） */
const fundInTargetLive = computed(() => {
  const t = fundInTarget.value
  if (!t) return null
  return subAccountRows.value.find((r) => r.id === t.id) ?? t
})

/** 划出抽屉内展示的子账户行（与列表同步） */
const fundOutTargetLive = computed(() => {
  const t = fundOutTarget.value
  if (!t) return null
  return subAccountRows.value.find((r) => r.id === t.id) ?? t
})

const flowTargetLive = computed(() => {
  const t = flowTarget.value
  if (!t) return null
  return subAccountRows.value.find((r) => r.id === t.id) ?? t
})

const flowRows = computed(() => {
  const target = flowTarget.value
  if (!target) return []
  return subAccountFlowLogs.value
    .filter((row) => row.subAccountId === target.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt, 'zh-CN'))
})

const lifecycleTargetLive = computed(() => {
  const t = lifecycleTarget.value
  if (!t) return null
  return subAccountRows.value.find((r) => r.id === t.id) ?? t
})

const selectedDept = computed(() =>
  departmentsForOpen.value.find((d) => d.id === departmentId.value),
)

watch(
  departmentId,
  (id) => {
    const d = departmentsForOpen.value.find((x) => x.id === id)
    aliasInput.value = d ? `${d.name}账户` : ''
  },
  { immediate: true },
)

watch(drawerOpen, (open) => {
  if (open) {
    departmentId.value = undefined
    aliasInput.value = ''
    transferAmount.value = 0
    mainBalanceLastRefreshed.value = null
  }
})

watch(fundInDrawerOpen, (open) => {
  if (open) {
    fundInAmount.value = null
    mainBalanceLastRefreshed.value = null
  } else {
    fundInTarget.value = null
  }
})

watch(fundOutDrawerOpen, (open) => {
  if (open) {
    fundOutAmount.value = null
    mainBalanceLastRefreshed.value = null
  } else {
    fundOutTarget.value = null
  }
})

watch(flowDrawerOpen, (open) => {
  if (!open) {
    flowTarget.value = null
  }
})

watch(lifecycleDrawerOpen, (open) => {
  if (!open) {
    lifecycleTarget.value = null
    lifecycleReason.value = ''
  }
})

const displayRows = computed(() => {
  let rows = [...subAccountRows.value]
  const kw = appliedKeyword.value.trim().toLowerCase()
  if (kw) {
    rows = rows.filter(
      (r) =>
        r.alias.toLowerCase().includes(kw) ||
        r.departmentName.toLowerCase().includes(kw),
    )
  }
  if (appliedDeptId.value) {
    rows = rows.filter((r) => r.departmentId === appliedDeptId.value)
  }
  return rows
})

const totalAvailableBalance = computed(() =>
  displayRows.value.reduce((sum, row) => sum + row.balance, 0),
)

const deptSelectOptions = computed(() =>
  departmentsForQuery.value.map((d) => ({ label: d.name, value: d.id })),
)

function subStatusTag(status: SubAccountStatus) {
  if (status === '启用') return h(Tag, { color: 'success' }, () => status)
  return h(Tag, { color: 'warning' }, () => status)
}

type TransferType = '划入' | '划出'
interface SubAccountTransferLogRow {
  id: string
  createdAt: string
  type: TransferType
  account: string
  amount: number
  operator: string
}

const transferLogRows = computed<SubAccountTransferLogRow[]>(() => {
  const inRows = fundInLogs.value.map((log) => ({
    id: `in-${log.id}`,
    createdAt: log.createdAt,
    type: '划入' as const,
    account: log.alias,
    amount: log.amount,
    operator: log.operator,
  }))
  const outRows = fundOutLogs.value.map((log) => ({
    id: `out-${log.id}`,
    createdAt: log.createdAt,
    type: '划出' as const,
    account: log.alias,
    amount: log.amount,
    operator: log.operator,
  }))
  return [...inRows, ...outRows].sort((a, b) => b.createdAt.localeCompare(a.createdAt, 'zh-CN'))
})

const transferLogColumns: TableColumnsType<SubAccountTransferLogRow> = [
  {
    title: '时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 168,
    align: 'center',
    ellipsis: true,
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 100,
    align: 'center',
    customRender: ({ text }: { text: TransferType }) =>
      text === '划入'
        ? h(Tag, { color: 'processing' }, () => text)
        : h(Tag, { color: 'purple' }, () => text),
  },
  {
    title: '账户',
    dataIndex: 'account',
    key: 'account',
    width: 148,
    align: 'center',
    ellipsis: true,
  },
  {
    title: '金额',
    dataIndex: 'amount',
    key: 'amount',
    width: 128,
    align: 'center',
    ellipsis: true,
    customRender: ({ record }: { record: SubAccountTransferLogRow }) => formatMoney(record.amount),
  },
  {
    title: '操作用户',
    dataIndex: 'operator',
    key: 'operator',
    width: 132,
    align: 'center',
    ellipsis: true,
  },
]

const flowColumns: TableColumnsType<SubAccountFlowLog> = [
  {
    title: '流水时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 172,
    align: 'center',
    ellipsis: true,
  },
  {
    title: '流水类型',
    dataIndex: 'type',
    key: 'type',
    width: 122,
    align: 'center',
    ellipsis: true,
    customRender: ({ text }: { text: SubAccountFlowType }) => h(Tag, { color: 'processing' }, () => text),
  },
  {
    title: '金额',
    dataIndex: 'amount',
    key: 'amount',
    width: 132,
    align: 'center',
    ellipsis: true,
    customRender: ({ record }: { record: SubAccountFlowLog }) => formatMoney(record.amount),
  },
  {
    title: '变更后余额',
    dataIndex: 'balanceAfter',
    key: 'balanceAfter',
    width: 144,
    align: 'center',
    ellipsis: true,
    customRender: ({ record }: { record: SubAccountFlowLog }) => formatMoney(record.balanceAfter),
  },
  {
    title: '业务单号',
    dataIndex: 'bizNo',
    key: 'bizNo',
    width: 170,
    align: 'center',
    ellipsis: true,
  },
  {
    title: '操作人',
    dataIndex: 'operator',
    key: 'operator',
    width: 132,
    align: 'center',
    ellipsis: true,
  },
  {
    title: '备注',
    dataIndex: 'remark',
    key: 'remark',
    width: 160,
    align: 'center',
    ellipsis: true,
  },
]

const columns: TableColumnsType<SubAccountRow> = [
  {
    title: '账户别名',
    dataIndex: 'alias',
    key: 'alias',
    width: 168,
    align: 'center',
    ellipsis: true,
  },
  {
    title: '关联部门',
    dataIndex: 'departmentName',
    key: 'departmentName',
    width: 120,
    align: 'center',
    ellipsis: true,
  },
  {
    title: '子账户可用余额',
    dataIndex: 'balance',
    key: 'balance',
    width: 140,
    align: 'center',
    ellipsis: true,
    customRender: ({ record }: { record: SubAccountRow }) => formatMoney(record.balance),
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 96,
    align: 'center',
    customRender: ({ text }: { text: SubAccountStatus }) => subStatusTag(text),
  },
  {
    title: '最近暂停原因',
    dataIndex: 'latestPauseReason',
    key: 'latestPauseReason',
    width: 188,
    align: 'center',
    ellipsis: true,
    customRender: ({ record }: { record: SubAccountRow }) => {
      if (!record.latestPauseReason) return '—'
      return h(Tooltip, { title: record.latestPauseReason }, { default: () => record.latestPauseReason })
    },
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 168,
    align: 'center',
    ellipsis: true,
  },
  {
    title: '更新时间',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
    width: 168,
    align: 'center',
    ellipsis: true,
  },
  {
    title: '用户',
    dataIndex: 'updatedBy',
    key: 'updatedBy',
    width: 132,
    align: 'center',
    ellipsis: true,
  },
  {
    title: '操作',
    key: 'action',
    width: 280,
    align: 'center',
    fixed: 'right',
    customRender: ({ record }: { record: SubAccountRow }) => {
      const r = record
      if (r.status === '暂停') {
        return h('div', { class: 'action-links' }, [
          h(
            Tooltip,
            {
              title: r.latestPauseReason
                ? `当前子账户已暂停；原因：${r.latestPauseReason}`
                : '当前子账户已暂停，暂不可划入',
            },
            {
              default: () => h(Button, { type: 'link', size: 'small', disabled: true }, () => '划入'),
            },
          ),
          h(
            Tooltip,
            {
              title: r.latestPauseReason
                ? `当前子账户已暂停；原因：${r.latestPauseReason}`
                : '当前子账户已暂停，暂不可划出',
            },
            {
              default: () => h(Button, { type: 'link', size: 'small', disabled: true }, () => '划出'),
            },
          ),
          h(
            Button,
            { type: 'link', size: 'small', onClick: () => openFlowDrawer(r) },
            () => '流水',
          ),
          h(
            Button,
            { type: 'link', size: 'small', onClick: () => openLifecycleDrawer(r, '启用') },
            () => '启用',
          ),
        ])
      }
      return h('div', { class: 'action-links' }, [
        h(
          Button,
          { type: 'link', size: 'small', onClick: () => openFundInDrawer(r) },
          () => '划入',
        ),
        h(
          Button,
          { type: 'link', size: 'small', onClick: () => openFundOutDrawer(r) },
          () => '划出',
        ),
        h(
          Button,
          { type: 'link', size: 'small', onClick: () => openFlowDrawer(r) },
          () => '流水',
        ),
        h(
          Button,
          { type: 'link', size: 'small', danger: true, onClick: () => openLifecycleDrawer(r, '暂停') },
          () => '暂停',
        ),
      ])
    },
  },
]

function validateSubAccountEnabled(row: SubAccountRow, actionLabel: string) {
  if (row.status !== '启用') {
    const reason = row.latestPauseReason ? `；原因：${row.latestPauseReason}` : ''
    message.error(`当前子账户已暂停，暂不可${actionLabel}${reason}`)
    return false
  }
  return true
}

function format2(n: number) {
  return Math.round(n * 100) / 100
}

function openFundOutDrawer(row: SubAccountRow) {
  fundOutTarget.value = row
  fundOutDrawerOpen.value = true
}

function openFlowDrawer(row: SubAccountRow) {
  flowTarget.value = row
  flowDrawerOpen.value = true
}

function openLifecycleDrawer(row: SubAccountRow, targetStatus: SubAccountStatus) {
  lifecycleTarget.value = row
  lifecycleTargetStatus.value = targetStatus
  lifecycleReason.value = targetStatus === '暂停' ? '' : row.latestPauseReason ?? ''
  lifecycleDrawerOpen.value = true
}

async function submitLifecycleChange() {
  const row = lifecycleTargetLive.value
  if (!row) {
    message.warning('未选择子账户')
    return
  }

  const reason = lifecycleReason.value.trim()
  const targetStatus = lifecycleTargetStatus.value
  if (targetStatus === '暂停' && reason.length < 2) {
    message.warning('暂停原因需填写 2-100 个字符')
    return
  }
  if (targetStatus === '暂停' && reason.length > 100) {
    message.warning('暂停原因不能超过 100 个字符')
    return
  }
  if (targetStatus === '启用' && reason.length > 100) {
    message.warning('原因说明不能超过 100 个字符')
    return
  }

  Modal.confirm({
    title: '确认提交状态变更？',
    content:
      targetStatus === '暂停'
        ? '提交后该子账户将暂停，后续不可执行划入与划出。'
        : '提交后该子账户将恢复启用，可继续执行资金操作。',
    okText: '确认',
    cancelText: '取消',
    centered: true,
    onOk: async () => {
      lifecycleSubmitting.value = true
      await new Promise((r) => setTimeout(r, 280))
      lifecycleSubmitting.value = false

      const ts = demoNow()
      subAccountRows.value = subAccountRows.value.map((r) =>
        r.id === row.id
          ? {
              ...r,
              status: targetStatus,
              latestPauseReason:
                targetStatus === '暂停' ? reason : (r.latestPauseReason ?? (reason || undefined)),
              statusChangedAt: ts,
              updatedAt: ts,
              updatedBy: DEMO_AUDIT_USER,
            }
          : r,
      )

      message.success(`子账户已${targetStatus}（演示）`)
      lifecycleDrawerOpen.value = false
    },
  })
}

function buildBizNo(prefix: string) {
  const suffix = String(Date.now()).slice(-10)
  return `${prefix}${suffix}`
}

async function submitFundOut() {
  const row = fundOutTarget.value
  if (!row) {
    message.warning('未选择子账户')
    return
  }
  if (!validateSubAccountEnabled(row, '划出')) return

  const amount = Number(fundOutAmount.value)
  if (Number.isNaN(amount) || amount <= 0) {
    message.warning('划出金额须大于 0')
    return
  }
  if (amount > row.balance) {
    message.error('子账户余额不足')
    return
  }

  fundOutSubmitting.value = true
  await new Promise((r) => setTimeout(r, 280))
  fundOutSubmitting.value = false

  const ts = demoNow()
  demoMainAccountBalance.value = format2(demoMainAccountBalance.value + amount)

  subAccountRows.value = subAccountRows.value.map((r) =>
    r.id === row.id
      ? {
          ...r,
          balance: format2(r.balance - amount),
          updatedAt: ts,
          updatedBy: DEMO_AUDIT_USER,
        }
      : r,
  )

  const balanceAfter = format2(row.balance - amount)
  subAccountFlowLogs.value.unshift({
    id: `flow-out-${Date.now()}`,
    createdAt: ts,
    subAccountId: row.id,
    type: '资金划出',
    amount,
    balanceAfter,
    bizNo: buildBizNo('SAO'),
    operator: DEMO_AUDIT_USER,
    remark: '子账户划回主账户',
  })

  fundOutLogs.value.unshift({
    id: `out-${Date.now()}`,
    createdAt: ts,
    subAccountId: row.id,
    alias: row.alias,
    departmentName: row.departmentName,
    amount,
    operator: DEMO_AUDIT_USER,
  })

  message.success('划出成功（演示）')
  fundOutDrawerOpen.value = false
}

function formatMoney(n: number) {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function refreshMainAccountBalance() {
  mainBalanceRefreshing.value = true
  await new Promise((r) => setTimeout(r, 420))
  mainBalanceRefreshing.value = false
  mainBalanceLastRefreshed.value = demoNow()
  message.success('主账户余额已查询（演示）')
}

function handleSearch() {
  appliedKeyword.value = queryKeyword.value.trim()
  appliedDeptId.value = queryDeptId.value
}

function handleReset() {
  queryKeyword.value = ''
  queryDeptId.value = undefined
  appliedKeyword.value = ''
  appliedDeptId.value = undefined
}

function deptHasSubAccount(depId: string) {
  return subAccountRows.value.some((r) => r.departmentId === depId)
}

function openCreateDrawer() {
  drawerOpen.value = true
}

function openFundInDrawer(row: SubAccountRow) {
  fundInTarget.value = row
  fundInDrawerOpen.value = true
}

async function submitCreate() {
  const depId = departmentId.value
  const dep = selectedDept.value
  const alias = aliasInput.value.trim()

  if (!depId || !dep) {
    message.warning('请选择部门')
    return false
  }
  if (!alias) {
    message.warning('请填写账户别名')
    return false
  }

  if (deptHasSubAccount(depId)) {
    message.error(`开户失败，部门${dep.name}已经开立子账户，`)
    return false
  }

  const amount = Number(transferAmount.value)
  if (Number.isNaN(amount) || amount < 0) {
    message.warning('转入金额须为非负数')
    return false
  }

  if (amount > 0 && amount > demoMainAccountBalance.value) {
    message.error('主资金账户余额不足')
    return false
  }

  submitting.value = true
  await new Promise((r) => setTimeout(r, 280))
  submitting.value = false

  const ts = demoNow()
  const balance = amount > 0 ? amount : 0
  const subAccountId = `sub-${Date.now()}`
  if (amount > 0) {
    demoMainAccountBalance.value = Math.round((demoMainAccountBalance.value - amount) * 100) / 100
  }

  subAccountRows.value.unshift({
    id: subAccountId,
    departmentId: depId,
    departmentName: dep.name,
    alias,
    balance,
    status: '启用',
    statusChangedAt: ts,
    createdAt: ts,
    updatedAt: ts,
    updatedBy: DEMO_AUDIT_USER,
  })

  if (amount > 0) {
    subAccountFlowLogs.value.unshift({
      id: `flow-open-${Date.now()}`,
      createdAt: ts,
      subAccountId,
      type: '资金划入',
      amount: balance,
      balanceAfter: balance,
      bizNo: buildBizNo('SAI'),
      operator: DEMO_AUDIT_USER,
      remark: '子账户首笔开立划入',
    })
  }

  message.success('开立成功（演示）')
  drawerOpen.value = false
  return true
}

async function onDrawerSubmit() {
  await submitCreate()
}

async function submitFundIn() {
  const row = fundInTarget.value
  if (!row) {
    message.warning('未选择子账户')
    return
  }
  if (!validateSubAccountEnabled(row, '划入')) return

  const amount = Number(fundInAmount.value)
  if (Number.isNaN(amount) || amount <= 0) {
    message.warning('划入金额须大于 0')
    return
  }

  if (amount > demoMainAccountBalance.value) {
    message.error('主资金账户余额不足')
    return
  }

  fundInSubmitting.value = true
  await new Promise((r) => setTimeout(r, 280))
  fundInSubmitting.value = false

  const ts = demoNow()
  demoMainAccountBalance.value = format2(demoMainAccountBalance.value - amount)

  subAccountRows.value = subAccountRows.value.map((r) =>
    r.id === row.id
      ? {
          ...r,
          balance: format2(r.balance + amount),
          updatedAt: ts,
          updatedBy: DEMO_AUDIT_USER,
        }
      : r,
  )

  const balanceAfter = format2(row.balance + amount)
  subAccountFlowLogs.value.unshift({
    id: `flow-in-${Date.now()}`,
    createdAt: ts,
    subAccountId: row.id,
    type: '资金划入',
    amount,
    balanceAfter,
    bizNo: buildBizNo('SAI'),
    operator: DEMO_AUDIT_USER,
    remark: '主账户追加划入',
  })

  fundInLogs.value.unshift({
    id: `in-${Date.now()}`,
    createdAt: ts,
    subAccountId: row.id,
    alias: row.alias,
    departmentName: row.departmentName,
    amount,
    operator: DEMO_AUDIT_USER,
  })

  message.success('划入成功（演示）')
  fundInDrawerOpen.value = false
}

async function onFundInDrawerSubmit() {
  await submitFundIn()
}

async function onFundOutDrawerSubmit() {
  await submitFundOut()
}
</script>

<template>
  <div class="portal-page-card sub-account-page">
    <a-breadcrumb class="portal-page-crumb">
      <a-breadcrumb-item>账户管理-本期新增菜单</a-breadcrumb-item>
      <a-breadcrumb-item>子账户管理-本期内容</a-breadcrumb-item>
    </a-breadcrumb>

    <PortalPageTitle>子账户管理-本期内容</PortalPageTitle>
    <p class="portal-page-sub">
      需求演示：F5 子账户开立、F6 资金账户 → 子账户划入、F7 子账户 → 资金账户划出、F8 总部视图子账户流水、F9 子账户生命周期管理（路由
      /account-mgmt/sub-accounts）
    </p>

    <a-card size="small" title="查询条件" class="query-card" :bordered="false">
      <div class="query-row">
        <a-space wrap :size="12">
          <a-input-search
            v-model:value="queryKeyword"
            placeholder="账户别名 / 关联部门"
            allow-clear
            style="width: 260px"
            @search="handleSearch"
          />
          <a-select
            v-model:value="queryDeptId"
            placeholder="关联部门"
            allow-clear
            show-search
            option-filter-prop="label"
            style="width: 200px"
            :options="deptSelectOptions"
          />
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button @click="handleReset">重置</a-button>
        </a-space>
      </div>
    </a-card>

    <a-card title="子账户列表" class="table-card" :bordered="false">
      <div class="table-toolbar">
        <span class="table-toolbar-meta">
          可用余额：{{ formatMoney(totalAvailableBalance) }}
        </span>
        <a-button type="primary" @click="openCreateDrawer">
          <template #icon><PlusOutlined /></template>
          新增子账户
        </a-button>
      </div>

      <a-table
        row-key="id"
        :columns="columns"
        :data-source="displayRows"
        :pagination="{ pageSize: 8, showSizeChanger: true }"
        :scroll="{ x: 1200 }"
        size="middle"
      >
        <template #emptyText>
          <a-empty description="暂无子账户，请点击「新增子账户」开立" />
        </template>
      </a-table>
    </a-card>

    <a-card title="划转记录" class="ledger-card" :bordered="false">
      <a-table
        row-key="id"
        :columns="transferLogColumns"
        :data-source="transferLogRows"
        :pagination="transferLogRows.length > 8 ? { pageSize: 8 } : false"
        :scroll="{ x: 640 }"
        size="middle"
      >
        <template #emptyText>
          <a-empty description="暂无划转记录；在列表中点击「划入 / 划出」后在此查看" />
        </template>
      </a-table>
    </a-card>

    <a-drawer
      v-model:open="drawerOpen"
      title="新增子账户"
      placement="right"
      :width="560"
      destroy-on-close
      :mask-closable="true"
    >
      <div class="drawer-body">
        <section class="drawer-section" aria-labelledby="drawer-create-main-balance-title">
          <div class="drawer-section-head">
            <span id="drawer-create-main-balance-title" class="drawer-section-title">主资金账户</span>
            <span class="drawer-section-desc">首开划入时，自以下余额扣减（演示数据与列表联动）</span>
          </div>
          <div class="main-balance-panel">
            <div class="main-balance-block">
              <span class="main-balance-label">可用余额</span>
              <div class="main-balance-row">
                <strong class="main-balance-value">{{ formatMoney(demoMainAccountBalance) }}</strong>
                <a-button
                  type="link"
                  class="main-balance-query-link"
                  :loading="mainBalanceRefreshing"
                  @click="refreshMainAccountBalance"
                >
                  <template #icon><ReloadOutlined /></template>
                  查询余额
                </a-button>
              </div>
            </div>
          </div>
          <p v-if="mainBalanceLastRefreshed" class="drawer-section-meta">
            上次查询：{{ mainBalanceLastRefreshed }}
          </p>
        </section>

        <section class="drawer-section" aria-labelledby="drawer-create-form-title">
          <div class="drawer-section-head">
            <span id="drawer-create-form-title" class="drawer-section-title">子账户开立</span>
            <span class="drawer-section-desc">选择部门并填写别名；首笔转入金额可为 0</span>
          </div>
          <a-form layout="vertical" class="drawer-form drawer-form-flush">
            <a-form-item label="部门" required>
              <a-select
                v-model:value="departmentId"
                placeholder="请选择客户自建部门（不含总部）"
                :options="deptSelectOptions"
                allow-clear
                show-search
                option-filter-prop="label"
              />
            </a-form-item>
            <a-form-item label="账户别名" required>
              <a-input v-model:value="aliasInput" placeholder="默认：所选部门名 +「账户」" allow-clear />
            </a-form-item>
            <a-form-item label="转入金额">
              <a-input-number
                v-model:value="transferAmount"
                :min="0"
                :precision="2"
                class="amount-input"
                placeholder="默认 0，大于 0 时从主资金账户划入"
              />
            </a-form-item>
          </a-form>
        </section>
      </div>

      <template #footer>
        <div class="drawer-footer-actions">
          <a-button type="primary" :loading="submitting" @click="onDrawerSubmit">提交</a-button>
        </div>
      </template>
    </a-drawer>

    <a-drawer
      v-model:open="fundInDrawerOpen"
      title="资金划入"
      placement="right"
      :width="560"
      destroy-on-close
      :mask-closable="true"
    >
      <div v-if="fundInTargetLive" class="drawer-body">
        <section class="drawer-section" aria-labelledby="drawer-fundin-main-balance-title">
          <div class="drawer-section-head">
            <span id="drawer-fundin-main-balance-title" class="drawer-section-title">主资金账户</span>
            <span class="drawer-section-desc">划入将从以下可用余额扣减，与列表、开立页共用演示数据</span>
          </div>
          <div class="main-balance-panel">
            <div class="main-balance-block">
              <span class="main-balance-label">可用余额</span>
              <div class="main-balance-row">
                <strong class="main-balance-value">{{ formatMoney(demoMainAccountBalance) }}</strong>
                <a-button
                  type="link"
                  class="main-balance-query-link"
                  :loading="mainBalanceRefreshing"
                  @click="refreshMainAccountBalance"
                >
                  <template #icon><ReloadOutlined /></template>
                  查询余额
                </a-button>
              </div>
            </div>
          </div>
          <p v-if="mainBalanceLastRefreshed" class="drawer-section-meta">
            上次查询：{{ mainBalanceLastRefreshed }}
          </p>
        </section>

        <section class="drawer-section" aria-labelledby="drawer-fundin-target-title">
          <div class="drawer-section-head">
            <span id="drawer-fundin-target-title" class="drawer-section-title">目标子账户</span>
            <span class="drawer-section-desc">只读信息</span>
          </div>
          <div class="drawer-subcard">
            <a-descriptions bordered size="small" :column="1" :label-style="{ width: '112px' }">
              <a-descriptions-item label="账户别名">{{
                fundInTargetLive.alias
              }}</a-descriptions-item>
              <a-descriptions-item label="关联部门">{{
                fundInTargetLive.departmentName
              }}</a-descriptions-item>
              <a-descriptions-item label="当前可用余额">{{
                formatMoney(fundInTargetLive.balance)
              }}</a-descriptions-item>
            </a-descriptions>
          </div>
        </section>

        <section class="drawer-section" aria-labelledby="drawer-fundin-amount-title">
          <div class="drawer-section-head">
            <span id="drawer-fundin-amount-title" class="drawer-section-title">划入金额</span>
            <span class="drawer-section-desc">须大于 0，且不超过主账户可用余额</span>
          </div>
          <a-form layout="vertical" class="drawer-form drawer-form-flush">
            <a-form-item label="金额" required class="drawer-form-item-compact">
              <a-input-number
                v-model:value="fundInAmount"
                :min="0.01"
                :precision="2"
                class="amount-input"
                placeholder="须大于 0"
              />
            </a-form-item>
          </a-form>
        </section>
      </div>

      <template #footer>
        <div class="drawer-footer-actions">
          <a-button type="primary" :loading="fundInSubmitting" @click="onFundInDrawerSubmit"
            >提交</a-button
          >
        </div>
      </template>
    </a-drawer>

    <a-drawer
      v-model:open="fundOutDrawerOpen"
      title="资金划出"
      placement="right"
      :width="560"
      destroy-on-close
      :mask-closable="true"
    >
      <div v-if="fundOutTargetLive" class="drawer-body">
        <section class="drawer-section" aria-labelledby="drawer-fundout-main-balance-title">
          <div class="drawer-section-head">
            <span id="drawer-fundout-main-balance-title" class="drawer-section-title">主资金账户</span>
            <span class="drawer-section-desc">划出后增加以下可用余额，与列表、开立页共用演示数据</span>
          </div>
          <div class="main-balance-panel">
            <div class="main-balance-block">
              <span class="main-balance-label">可用余额</span>
              <div class="main-balance-row">
                <strong class="main-balance-value">{{ formatMoney(demoMainAccountBalance) }}</strong>
                <a-button
                  type="link"
                  class="main-balance-query-link"
                  :loading="mainBalanceRefreshing"
                  @click="refreshMainAccountBalance"
                >
                  <template #icon><ReloadOutlined /></template>
                  查询余额
                </a-button>
              </div>
            </div>
          </div>
          <p v-if="mainBalanceLastRefreshed" class="drawer-section-meta">
            上次查询：{{ mainBalanceLastRefreshed }}
          </p>
        </section>

        <section class="drawer-section" aria-labelledby="drawer-fundout-source-title">
          <div class="drawer-section-head">
            <span id="drawer-fundout-source-title" class="drawer-section-title">来源子账户</span>
            <span class="drawer-section-desc">只读信息</span>
          </div>
          <div class="drawer-subcard">
            <a-descriptions bordered size="small" :column="1" :label-style="{ width: '112px' }">
              <a-descriptions-item label="账户别名">{{
                fundOutTargetLive.alias
              }}</a-descriptions-item>
              <a-descriptions-item label="关联部门">{{
                fundOutTargetLive.departmentName
              }}</a-descriptions-item>
              <a-descriptions-item label="当前可用余额">{{
                formatMoney(fundOutTargetLive.balance)
              }}</a-descriptions-item>
            </a-descriptions>
          </div>
        </section>

        <section class="drawer-section" aria-labelledby="drawer-fundout-amount-title">
          <div class="drawer-section-head">
            <span id="drawer-fundout-amount-title" class="drawer-section-title">划出金额</span>
            <span class="drawer-section-desc">须大于 0，且小于等于来源子账户可用余额</span>
          </div>
          <a-form layout="vertical" class="drawer-form drawer-form-flush">
            <a-form-item label="金额" required class="drawer-form-item-compact">
              <a-input-number
                v-model:value="fundOutAmount"
                :min="0.01"
                :precision="2"
                class="amount-input"
                placeholder="须大于 0，且不超过来源子账户可用余额"
              />
            </a-form-item>
          </a-form>
        </section>
      </div>

      <template #footer>
        <div class="drawer-footer-actions">
          <a-button type="primary" :loading="fundOutSubmitting" @click="onFundOutDrawerSubmit"
            >提交</a-button
          >
        </div>
      </template>
    </a-drawer>

    <a-drawer
      v-model:open="flowDrawerOpen"
      title="子账户流水"
      placement="right"
      :width="860"
      destroy-on-close
      :mask-closable="true"
    >
      <div v-if="flowTargetLive" class="drawer-body">
        <section class="drawer-section" aria-labelledby="drawer-flow-target-title">
          <div class="drawer-section-head">
            <span id="drawer-flow-target-title" class="drawer-section-title">账户信息</span>
            <span class="drawer-section-desc">以下流水仅展示当前选中子账户</span>
          </div>
          <div class="drawer-subcard">
            <a-descriptions bordered size="small" :column="3">
              <a-descriptions-item label="账户别名">{{ flowTargetLive.alias }}</a-descriptions-item>
              <a-descriptions-item label="关联部门">{{ flowTargetLive.departmentName }}</a-descriptions-item>
              <a-descriptions-item label="当前可用余额">{{
                formatMoney(flowTargetLive.balance)
              }}</a-descriptions-item>
            </a-descriptions>
          </div>
        </section>

        <section class="drawer-section" aria-labelledby="drawer-flow-list-title">
          <div class="drawer-section-head">
            <span id="drawer-flow-list-title" class="drawer-section-title">流水列表</span>
            <span class="drawer-section-desc">包含划入、划出与其他账务类型（演示）</span>
          </div>
          <a-table
            row-key="id"
            :columns="flowColumns"
            :data-source="flowRows"
            :pagination="flowRows.length > 8 ? { pageSize: 8 } : false"
            :scroll="{ x: 1030 }"
            size="middle"
          >
            <template #emptyText>
              <a-empty description="暂无流水记录" />
            </template>
          </a-table>
        </section>
      </div>
    </a-drawer>

    <a-drawer
      v-model:open="lifecycleDrawerOpen"
      title="子账户状态变更"
      placement="right"
      :width="560"
      destroy-on-close
      :mask-closable="true"
    >
      <div v-if="lifecycleTargetLive" class="drawer-body">
        <section class="drawer-section" aria-labelledby="drawer-lifecycle-target-title">
          <div class="drawer-section-head">
            <span id="drawer-lifecycle-target-title" class="drawer-section-title">目标子账户</span>
            <span class="drawer-section-desc">确认对象与状态后提交（提交前会二次确认）</span>
          </div>
          <div class="drawer-subcard">
            <a-descriptions bordered size="small" :column="1" :label-style="{ width: '112px' }">
              <a-descriptions-item label="账户别名">{{ lifecycleTargetLive.alias }}</a-descriptions-item>
              <a-descriptions-item label="关联部门">{{
                lifecycleTargetLive.departmentName
              }}</a-descriptions-item>
              <a-descriptions-item label="当前状态">{{
                lifecycleTargetLive.status
              }}</a-descriptions-item>
              <a-descriptions-item label="目标状态">{{ lifecycleTargetStatus }}</a-descriptions-item>
            </a-descriptions>
          </div>
        </section>

        <section class="drawer-section" aria-labelledby="drawer-lifecycle-reason-title">
          <div class="drawer-section-head">
            <span id="drawer-lifecycle-reason-title" class="drawer-section-title">原因说明</span>
            <span class="drawer-section-desc">
              {{ lifecycleTargetStatus === '暂停' ? '暂停必填，长度 2-100 字符' : '启用可选，用于补充恢复原因' }}
            </span>
          </div>
          <a-form layout="vertical" class="drawer-form drawer-form-flush">
            <a-form-item
              :label="lifecycleTargetStatus === '暂停' ? '暂停原因' : '启用说明'"
              :required="lifecycleTargetStatus === '暂停'"
              class="drawer-form-item-compact"
            >
              <a-textarea
                v-model:value="lifecycleReason"
                :rows="4"
                :maxlength="100"
                show-count
                :placeholder="
                  lifecycleTargetStatus === '暂停'
                    ? '请输入暂停原因（2-100 个字符）'
                    : '可选，输入启用说明（最多 100 字符）'
                "
              />
            </a-form-item>
          </a-form>
        </section>

        <section class="drawer-section" aria-labelledby="drawer-lifecycle-history-title">
          <div class="drawer-section-head">
            <span id="drawer-lifecycle-history-title" class="drawer-section-title">详情区</span>
            <span class="drawer-section-desc">展示最近一次暂停原因与状态变更时间</span>
          </div>
          <div class="drawer-subcard">
            <a-descriptions bordered size="small" :column="1" :label-style="{ width: '136px' }">
              <a-descriptions-item label="最近一次暂停原因">
                {{ lifecycleTargetLive.latestPauseReason || '—' }}
              </a-descriptions-item>
              <a-descriptions-item label="最近一次状态变更时间">
                {{ lifecycleTargetLive.statusChangedAt || '—' }}
              </a-descriptions-item>
            </a-descriptions>
          </div>
        </section>
      </div>

      <template #footer>
        <div class="drawer-footer-actions">
          <a-button type="primary" :loading="lifecycleSubmitting" @click="submitLifecycleChange">
            提交
          </a-button>
        </div>
      </template>
    </a-drawer>
  </div>
</template>

<style scoped lang="less">
.query-card {
  margin-bottom: 16px;
}

.query-row {
  width: 100%;
}

.table-card {
  margin-bottom: 16px;
}

.ledger-card {
  margin-bottom: 8px;
}

.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.drawer-section {
  margin: 0;
}

.drawer-section-head {
  margin-bottom: 12px;
}

.drawer-section-title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
  color: rgba(0, 0, 0, 0.88);
}

.drawer-section-desc {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  line-height: 20px;
  color: rgba(0, 0, 0, 0.45);
}

.drawer-section-meta {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 18px;
  color: rgba(0, 0, 0, 0.45);
}

.main-balance-panel {
  padding: 16px;
  border-radius: 8px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--ant-color-primary) 12%, transparent) 0%,
    color-mix(in srgb, var(--ant-color-primary) 4%, transparent) 100%
  );
  border: 1px solid color-mix(in srgb, var(--ant-color-primary) 28%, transparent);
}

.main-balance-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.main-balance-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
}

.main-balance-label {
  font-size: 13px;
  line-height: 20px;
  color: rgba(0, 0, 0, 0.45);
}

.main-balance-value {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  line-height: 30px;
  color: var(--ant-color-primary);
  font-variant-numeric: tabular-nums;
}

.main-balance-query-link {
  padding: 0 !important;
  height: auto !important;
  line-height: 22px;
}

.drawer-subcard {
  padding: 0;
}

.drawer-subcard :deep(.ant-descriptions) {
  margin-bottom: 0;
}

.drawer-form-flush {
  margin-top: 0;
}

.drawer-form-item-compact {
  margin-bottom: 0;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  margin-bottom: 16px;
  width: 100%;
}

.table-toolbar-meta {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

.action-links {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.amount-input {
  width: 100%;
}

.drawer-form {
  margin-top: 4px;
}

.drawer-footer-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
