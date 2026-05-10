/** 企业管理（F1/F2/F3）· 演示数据模型 */

export interface TenantUserRow {
  id: string
  email: string
  name: string
  positionId: string
  positionName: string
  departmentIds: string[]
  departmentNames: string[]
  status: '启用' | '停用' | '待激活' | '作废'
  /** 租户首个管理员：不可改岗、不可停用 */
  isFirstAdmin?: boolean
  /** 邀请人：向该成员发起邀请的操作者可读标识；非邀请入口产生的成员可无 */
  invitedBy?: string
  createdAt: string
  updatedAt: string
  /** 列表「用户」列：最近更新人展示名 */
  updatedBy: string
}

export interface PositionDef {
  id: string
  /** 管理员岗位展示名固定为「管理员」 */
  name: string
  /** 岗位说明，选填，客户自定义 */
  description?: string
  permissionIds: string[]
  /** 系统预置管理员岗位，不可删除、不可改名 */
  isAdminPreset?: boolean
  createdAt: string
  updatedAt: string
  /** 列表「用户」列：最近更新人展示名 */
  updatedBy: string
}

export interface DepartmentDef {
  id: string
  name: string
  description?: string
  userIds: string[]
  /** 系统预置总部 */
  isHQ?: boolean
  createdAt: string
  updatedAt: string
  /** 列表「用户」列：最近更新人展示名 */
  updatedBy: string
}

export interface PermissionDef {
  id: string
  name: string
  group: string
}
