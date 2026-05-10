import { ref } from 'vue'
import type { TenantUserRow, PositionDef, DepartmentDef } from '@/types/f15UserManagement'
import {
  initialPositions,
  initialDepartments,
  initialUserRows,
} from '@/mocks/f15UserManagement'

function clonePositions(): PositionDef[] {
  return initialPositions.map((p) => ({ ...p, permissionIds: [...p.permissionIds] }))
}

function cloneDepartments(): DepartmentDef[] {
  return initialDepartments.map((d) => ({
    ...d,
    userIds: [...d.userIds],
  }))
}

/** F1/F2/F3 演示共用状态（同页 Tab 间同步） */

const STORAGE_INVITED_ROWS = 'portal-demo-invited-user-rows'

function normalizeUserRow(u: TenantUserRow): TenantUserRow {
  return {
    ...u,
    departmentIds: [...u.departmentIds],
    departmentNames: [...u.departmentNames],
  }
}

function loadPersistedInvitedUsers(): TenantUserRow[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_INVITED_ROWS)
    if (!raw) return []
    const parsed = JSON.parse(raw) as TenantUserRow[]
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeUserRow)
  } catch {
    return []
  }
}

/** 邀请产生的「待激活」行写入 sessionStorage，便于新标签打开激活页仍能查到用户 */
export function persistInvitedUserRow(row: TenantUserRow) {
  const list = loadPersistedInvitedUsers()
  list.unshift(normalizeUserRow(row))
  try {
    sessionStorage.setItem(STORAGE_INVITED_ROWS, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

/** 激活成功后从演示缓存移除，避免刷新后又出现重复的待激活快照 */
export function removePersistedInvitedUser(userId: string) {
  const list = loadPersistedInvitedUsers().filter((u) => u.id !== userId)
  try {
    sessionStorage.setItem(STORAGE_INVITED_ROWS, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

function mergeDeptUsersFromRows(users: TenantUserRow[]) {
  for (const u of users) {
    for (const did of u.departmentIds) {
      const dep = departments.value.find((d) => d.id === did)
      if (dep && !dep.userIds.includes(u.id)) dep.userIds.push(u.id)
    }
  }
}

const persistedInviteRows = loadPersistedInvitedUsers()

export const positions = ref<PositionDef[]>(clonePositions())
export const departments = ref<DepartmentDef[]>(cloneDepartments())
mergeDeptUsersFromRows(persistedInviteRows)

export const userRows = ref<TenantUserRow[]>([
  ...persistedInviteRows.map(normalizeUserRow),
  ...initialUserRows.map((u) => ({
    ...u,
    departmentIds: [...u.departmentIds],
    departmentNames: [...u.departmentNames],
  })),
])
