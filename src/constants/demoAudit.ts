/** 演示环境列表「用户」列占位；接入后端后替换为最近更新人昵称或账号 */

export const DEMO_AUDIT_USER = '客户管理员（演示）'

export const DEMO_AUDIT_SYSTEM = '系统'

export function demoNow(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}
