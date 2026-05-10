import { ref } from 'vue'
import type { SubAccountRow } from '@/types/subAccount'
import { DEMO_AUDIT_USER } from '@/constants/demoAudit'

/** 演示：已开立的子账户列表（一部一户：按 departmentId 唯一） */
export const subAccountRows = ref<SubAccountRow[]>([
  {
    id: 'sub-demo-a',
    departmentId: 'dep-a',
    departmentName: '华北营销',
    alias: '华北营销账户',
    balance: 32000,
    status: '启用',
    latestPauseReason: '2026-05-06 风险排查后恢复',
    statusChangedAt: '2026-05-07 09:40:00',
    createdAt: '2026-05-02 10:18:00',
    updatedAt: '2026-05-07 09:40:00',
    updatedBy: DEMO_AUDIT_USER,
  },
  {
    id: 'sub-demo-b',
    departmentId: 'dep-b',
    departmentName: '华南投放',
    alias: '华南投放账户',
    balance: 18888.5,
    status: '暂停',
    latestPauseReason: '风控命中异常交易，暂停审核中',
    statusChangedAt: '2026-05-06 16:22:00',
    createdAt: '2026-05-03 11:05:00',
    updatedAt: '2026-05-06 16:22:00',
    updatedBy: DEMO_AUDIT_USER,
  },
  {
    id: 'sub-demo-c',
    departmentId: 'dep-c',
    departmentName: '华东运营',
    alias: '华东运营账户',
    balance: 12500,
    status: '启用',
    statusChangedAt: '2026-05-05 14:00:00',
    createdAt: '2026-05-05 14:00:00',
    updatedAt: '2026-05-05 14:00:00',
    updatedBy: DEMO_AUDIT_USER,
  },
])

const INITIAL_SUB_BALANCES = subAccountRows.value.reduce((s, r) => s + r.balance, 0)
const MAIN_SEED = 100_000

/** 主资金账户演示余额：假设初始 100000，已减去上表子账户余额合计 */
export const demoMainAccountBalance = ref(
  Math.round((MAIN_SEED - INITIAL_SUB_BALANCES) * 100) / 100,
)
