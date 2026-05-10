import { ref } from 'vue'

/** 演示：与 PRD 对齐的固定 token，用于验收提示文案 */
export const DEMO_INVITE_TOKEN_INVALID = 'demo-invalid-token'
export const DEMO_INVITE_TOKEN_EXPIRED = 'demo-expired-token'

const INVITE_TTL_MS = 24 * 60 * 60 * 1000

/** 新标签打开激活链接时会整页刷新，内存 Map 会丢 —— 用 sessionStorage 持久化演示 token */
const TOKEN_STORAGE_KEY = 'portal-demo-invite-token-map'

export interface InviteTokenRecord {
  userId: string
  expiresAt: number
}

function loadTokenMapFromStorage(): Map<string, InviteTokenRecord> {
  try {
    const raw = sessionStorage.getItem(TOKEN_STORAGE_KEY)
    if (!raw) return new Map()
    const tuples = JSON.parse(raw) as [string, InviteTokenRecord][]
    if (!Array.isArray(tuples)) return new Map()
    return new Map(tuples.filter((x) => Array.isArray(x) && x.length >= 2))
  } catch {
    return new Map()
  }
}

function persistTokenMap(m: Map<string, InviteTokenRecord>) {
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify([...m.entries()]))
  } catch {
    /* 私密模式等 */
  }
}

/** token → 受邀用户 id + 过期时间（演示 · 与 sessionStorage 同步） */
export const inviteTokenByToken = ref(loadTokenMapFromStorage())

export function createInviteToken(userId: string): string {
  const token = `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  const next = new Map(inviteTokenByToken.value)
  next.set(token, { userId, expiresAt: Date.now() + INVITE_TTL_MS })
  inviteTokenByToken.value = next
  persistTokenMap(next)
  return token
}

export function revokeInviteToken(token: string) {
  const next = new Map(inviteTokenByToken.value)
  next.delete(token)
  inviteTokenByToken.value = next
  persistTokenMap(next)
}

export function findTokenForUser(userId: string): string | undefined {
  for (const [t, r] of inviteTokenByToken.value) {
    if (r.userId === userId) return t
  }
  return undefined
}

export function buildActivationHref(token: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base
  const qs = `token=${encodeURIComponent(token)}`
  if (typeof window === 'undefined') {
    return `${prefix}/invite/activate?${qs}`
  }
  return `${window.location.origin}${prefix}/invite/activate?${qs}`
}
