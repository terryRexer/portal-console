<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import PortalPageTitle from '@/components/PortalPageTitle.vue'
import { userRows, removePersistedInvitedUser } from '@/state/enterpriseSettings'
import {
  inviteTokenByToken,
  revokeInviteToken,
  createInviteToken,
  DEMO_INVITE_TOKEN_INVALID,
  DEMO_INVITE_TOKEN_EXPIRED,
} from '@/state/inviteActivation'
import { DEMO_AUDIT_USER, demoNow } from '@/constants/demoAudit'

const MSG_INVALID =
  'Token 校验失败，请检查链接是否完整，或联系管理员重新发起邀请'
const MSG_EXPIRED =
  '邀请链接已超过有效期，邀请已自动失效，请联系企业管理员重新发起邀请'

const route = useRoute()
const router = useRouter()

type Phase = 'checking' | 'invalid' | 'expired' | 'password' | 'success'

/** 仅随 URL token 变化 */
const tokenPhase = ref<Phase>('checking')

/** 提交激活成功后展示成功态 */
const flowSuccess = ref(false)

const token = computed(() => {
  const t = route.query.token
  if (Array.isArray(t)) return typeof t[0] === 'string' ? t[0] : ''
  return typeof t === 'string' ? t : ''
})

const pwdForm = ref({ password: '', confirm: '' })

function runCheck() {
  const t = token.value
  tokenPhase.value = 'checking'
  if (!t.trim()) {
    tokenPhase.value = 'invalid'
    return
  }
  if (t === DEMO_INVITE_TOKEN_INVALID) {
    tokenPhase.value = 'invalid'
    return
  }
  if (t === DEMO_INVITE_TOKEN_EXPIRED) {
    tokenPhase.value = 'expired'
    return
  }
  const rec = inviteTokenByToken.value.get(t)
  if (!rec) {
    tokenPhase.value = 'invalid'
    return
  }
  if (Date.now() > rec.expiresAt) {
    tokenPhase.value = 'expired'
    return
  }
  tokenPhase.value = 'password'
}

const displayPhase = computed<Phase>(() => {
  if (flowSuccess.value) return 'success'
  return tokenPhase.value
})

watch(
  token,
  () => {
    flowSuccess.value = false
    runCheck()
  },
  { immediate: true },
)

function submitPassword() {
  const t = token.value.trim()

  if (pwdForm.value.password.length < 6) {
    message.warning('密码至少 6 位（演示）')
    return
  }
  if (pwdForm.value.password !== pwdForm.value.confirm) {
    message.warning('两次输入的密码不一致')
    return
  }

  const rec = inviteTokenByToken.value.get(t)
  if (!rec || Date.now() > rec.expiresAt) {
    tokenPhase.value = 'expired'
    message.warning(MSG_EXPIRED)
    return
  }
  const idx = userRows.value.findIndex((u) => u.id === rec.userId)
  if (idx === -1) {
    message.error('未找到受邀用户（演示数据异常）')
    return
  }
  const userIdToClean = rec.userId
  const tokenToRevoke = t

  const now = demoNow()
  userRows.value[idx] = {
    ...userRows.value[idx],
    status: '启用',
    updatedAt: now,
    updatedBy: userRows.value[idx].email,
  }
  if (tokenToRevoke) revokeInviteToken(tokenToRevoke)
  removePersistedInvitedUser(userIdToClean)
  message.success(`已向邀请人发送邀请结果通知邮件（演示 · ${DEMO_AUDIT_USER}）`)
  flowSuccess.value = true
}

function goLogin() {
  router.push('/home')
}

/** 演示入口①：真实有效 token → 设密 → 成功跳转（依赖列表中存在「待激活」成员） */
function openDemoValidTokenFlow() {
  const pending = userRows.value.find((u) => u.status === '待激活')
  if (!pending) {
    message.warning('暂无「待激活」成员，请先在企业管理-本期新增发起邀请后再试（演示）')
    return
  }
  const t = createInviteToken(pending.id)
  router.push({ path: '/invite/activate', query: { token: t } })
}

function openDemoInvalidToken() {
  router.push({ path: '/invite/activate', query: { token: DEMO_INVITE_TOKEN_INVALID } })
}

function openDemoExpiredToken() {
  router.push({ path: '/invite/activate', query: { token: DEMO_INVITE_TOKEN_EXPIRED } })
}
</script>

<template>
  <div class="invite-activate-page">
    <div class="invite-activate-card">
      <div class="invite-activate-brand">MarsWallet</div>

      <template v-if="displayPhase === 'checking'">
        <a-spin tip="校验邀请链接…" />
      </template>

      <template v-else-if="displayPhase === 'invalid'">
        <a-result status="error" title="无法完成激活" :sub-title="MSG_INVALID" />
      </template>

      <template v-else-if="displayPhase === 'expired'">
        <a-result status="warning" title="链接已失效" :sub-title="MSG_EXPIRED" />
      </template>

      <template v-else-if="displayPhase === 'password'">
        <div class="invite-activate-phase-password">
          <PortalPageTitle>设置登录密码</PortalPageTitle>
          <p class="portal-page-sub invite-activate-desc">
            校验已通过，请设置密码以完成账号激活（演示环境）。
          </p>
        </div>
        <a-form
          layout="vertical"
          class="invite-activate-form"
          :model="pwdForm"
          @finish="submitPassword"
        >
          <a-form-item
            label="登录密码"
            name="password"
            :rules="[{ required: true, message: '请输入密码' }]"
          >
            <a-input-password
              v-model:value="pwdForm.password"
              placeholder="至少 6 位（演示）"
              autocomplete="new-password"
            />
          </a-form-item>
          <a-form-item
            label="确认密码"
            name="confirm"
            :rules="[{ required: true, message: '请再次输入密码' }]"
          >
            <a-input-password
              v-model:value="pwdForm.confirm"
              placeholder="再次输入密码"
              autocomplete="new-password"
            />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit" block>提交并激活</a-button>
          </a-form-item>
        </a-form>
      </template>

      <template v-else-if="displayPhase === 'success'">
        <a-result
          status="success"
          title="注册成功"
          sub-title="跳转登录后，可使用当前邮箱与所设密码登录（演示）。"
        >
          <template #extra>
            <a-button type="primary" size="large" @click="goLogin">跳转登录</a-button>
          </template>
        </a-result>
      </template>

      <div class="invite-activate-demo-tools">
        <a-divider plain>演示辅助</a-divider>
        <a-space wrap>
          <a-button size="small" @click="router.push('/invite/email-sample')">邀请邮件模板</a-button>
          <a-button size="small" type="primary" ghost @click="openDemoValidTokenFlow">
            演示：校验通过 · 设密 · 成功
          </a-button>
          <a-button size="small" danger ghost @click="openDemoInvalidToken">
            演示：Token 校验失败
          </a-button>
          <a-button size="small" @click="openDemoExpiredToken">演示：Token 超期</a-button>
        </a-space>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.invite-activate-page {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 48px 16px;
  background: linear-gradient(145deg, #e8e0ff 0%, #e6f4ff 45%, #fafafa 100%);
}

.invite-activate-card {
  width: 100%;
  max-width: 520px;
  padding: 36px 28px 28px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(45, 29, 109, 0.08);
}

.invite-activate-brand {
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 28px;
  color: rgba(0, 0, 0, 0.88);
}

.invite-activate-phase-password {
  :deep(.portal-page-title) {
    display: block;
  }
}

.invite-activate-desc {
  margin-bottom: 24px;
}

.invite-activate-form {
  margin-top: 8px;
}

.invite-activate-demo-tools {
  margin-top: 24px;

  :deep(.ant-divider-plain.ant-divider-horizontal) {
    margin: 16px 0 12px;
  }
}
</style>
