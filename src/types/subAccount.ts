/** F5 子账户开立 · F6 资金划入 · F7 资金划出 · 演示列表模型 */

export type SubAccountStatus = '启用' | '暂停'

export interface SubAccountRow {
  id: string
  departmentId: string
  departmentName: string
  /** 账户别名（租户内可重复） */
  alias: string
  /** 子账户可用余额（演示） */
  balance: number
  /** F6：仅「启用」可自资金账户划入 */
  status: SubAccountStatus
  /** F9：最近一次暂停原因（启用后保留历史展示） */
  latestPauseReason?: string
  /** F9：最近一次状态变更时间 */
  statusChangedAt?: string
  createdAt: string
  updatedAt: string
  updatedBy: string
}

/** F6 划入成功后的演示流水（本地会话，刷新即清空） */
export interface SubAccountFundInLog {
  id: string
  createdAt: string
  subAccountId: string
  alias: string
  departmentName: string
  amount: number
  operator: string
}

/** F7 划出成功后的演示流水（本地会话，刷新即清空） */
export interface SubAccountFundOutLog {
  id: string
  createdAt: string
  subAccountId: string
  alias: string
  departmentName: string
  amount: number
  operator: string
}
