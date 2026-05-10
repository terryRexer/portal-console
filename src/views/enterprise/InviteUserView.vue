<script setup lang="ts">
import { h, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import PortalPageTitle from '@/components/PortalPageTitle.vue'
import { CheckOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { DataNode } from 'ant-design-vue/es/tree'
import type { TenantUserRow } from '@/types/f15UserManagement'
import { positions, departments, userRows, persistInvitedUserRow } from '@/state/enterpriseSettings'
import { DEMO_AUDIT_USER, demoNow } from '@/constants/demoAudit'
import { permissionCatalog } from '@/mocks/f15UserManagement'
import { buildActivationHref, createInviteToken } from '@/state/inviteActivation'

const router = useRouter()

const inviteLoading = ref(false)
const inviteForm = ref({
  name: '',
  email: '',
  positionId: undefined as string | undefined,
  departmentIds: [] as string[],
})

const invitePermDrawerOpen = ref(false)
const inviteDemoModalOpen = ref(false)
const lastActivationUrl = ref('')

const deptFilterOptions = computed(() =>
  departments.value.map((d) => ({ value: d.id, label: d.name })),
)
const positionFilterOptions = computed(() =>
  positions.value.map((p) => ({ value: p.id, label: p.name })),
)

const invitePreviewPosition = computed(() =>
  inviteForm.value.positionId
    ? positions.value.find((p) => p.id === inviteForm.value.positionId) ?? null
    : null,
)

function buildInvitePermTree(grantedIds: Set<string>): DataNode[] {
  const byGroup = new Map<string, typeof permissionCatalog>()
  for (const p of permissionCatalog) {
    const arr = byGroup.get(p.group) ?? []
    arr.push(p)
    byGroup.set(p.group, arr)
  }

  return Array.from(byGroup.entries()).map(([groupName, perms]) => ({
    key: `grp-${groupName}`,
    title: groupName,
    selectable: false,
    children: perms.map((perm) => {
      const granted = grantedIds.has(perm.id)
      return {
        key: perm.id,
        title: () =>
          h(
            'span',
            { class: ['invite-perm-leaf', granted ? 'invite-perm-leaf--on' : 'invite-perm-leaf--off'] },
            [
              granted
                ? h(CheckOutlined, { class: 'invite-perm-leaf-icon' })
                : h('span', { class: 'invite-perm-leaf-dot', 'aria-hidden': true }),
              h('span', { class: 'invite-perm-leaf-text' }, perm.name),
            ],
          ),
        isLeaf: true,
      }
    }),
  }))
}

const invitePermTreeData = computed(() => {
  const pos = invitePreviewPosition.value
  const granted = new Set(pos?.permissionIds ?? [])
  return buildInvitePermTree(granted)
})

function resetForm() {
  inviteForm.value = {
    name: '',
    email: '',
    positionId: positions.value[0]?.id,
    departmentIds: departments.value[0]?.id ? [departments.value[0].id] : [],
  }
}

resetForm()

function goBackToList() {
  router.replace({ path: '/settings/user-management', query: { tab: 'users' } })
}

function openInvitePermDrawer() {
  if (!inviteForm.value.positionId) {
    message.warning('请先选择岗位')
    return
  }
  invitePermDrawerOpen.value = true
}

function emailTaken(email: string) {
  const n = email.trim().toLowerCase()
  return userRows.value.some((u) => u.email.toLowerCase() === n && u.status !== '作废')
}

function copyActivationLink() {
  void navigator.clipboard.writeText(lastActivationUrl.value).then(
    () => message.success('链接已复制'),
    () => message.warning('复制失败，请手动复制'),
  )
}

function submitInvite() {
  const name = inviteForm.value.name?.trim()
  if (!name) {
    message.warning('请填写名称')
    return
  }
  const email = inviteForm.value.email?.trim()
  if (!email) {
    message.warning('请填写邮箱')
    return
  }
  if (emailTaken(email)) {
    message.warning('该邮箱已被启用/停用/待激活成员占用（作废后可重新邀请）')
    return
  }
  if (!inviteForm.value.positionId) {
    message.warning('请选择岗位')
    return
  }
  if (!inviteForm.value.departmentIds.length) {
    message.warning('请至少选择一个部门')
    return
  }
  inviteLoading.value = true
  window.setTimeout(() => {
    inviteLoading.value = false
    const pos = positions.value.find((p) => p.id === inviteForm.value.positionId)
    const deps = departments.value.filter((d) => inviteForm.value.departmentIds.includes(d.id))
    const id = `u-${Date.now()}`
    const now = demoNow()
    const row: TenantUserRow = {
      id,
      email,
      name,
      positionId: inviteForm.value.positionId!,
      positionName: pos?.name ?? '',
      departmentIds: [...inviteForm.value.departmentIds],
      departmentNames: deps.map((d) => d.name),
      status: '待激活',
      invitedBy: DEMO_AUDIT_USER,
      createdAt: now,
      updatedAt: now,
      updatedBy: DEMO_AUDIT_USER,
    }
    userRows.value.unshift(row)
    persistInvitedUserRow(row)
    for (const did of row.departmentIds) {
      const dep = departments.value.find((d) => d.id === did)
      if (dep && !dep.userIds.includes(id)) dep.userIds.push(id)
    }
    const tok = createInviteToken(id)
    lastActivationUrl.value = buildActivationHref(tok)
    inviteDemoModalOpen.value = true
    message.success('邀请已提交（演示 · 待激活）')
  }, 400)
}
</script>

<template>
  <div class="portal-page-card invite-user-page">
    <a-breadcrumb class="portal-page-crumb">
      <a-breadcrumb-item>设置-本期新增</a-breadcrumb-item>
      <a-breadcrumb-item>
        <router-link :to="{ path: '/settings/user-management', query: { tab: 'users' } }">
          企业管理-本期新增
        </router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>邀请用户</a-breadcrumb-item>
    </a-breadcrumb>

    <div class="invite-title-row">
      <PortalPageTitle class="invite-page-title">邀请用户</PortalPageTitle>
      <p class="portal-page-sub page-sub--aside">
        填写信息后提交，系统将发送激活邮件（演示环境）。
      </p>
    </div>

    <div class="invite-page-card">
      <a-form layout="vertical" class="invite-form">
        <a-form-item label="名称" required>
          <a-input v-model:value="inviteForm.name" placeholder="必填，列表展示用" />
        </a-form-item>
        <a-form-item label="邮箱" required>
          <a-input v-model:value="inviteForm.email" placeholder="登录邮箱，租户内不可重复（作废除外）" />
        </a-form-item>
        <a-form-item label="岗位" required>
          <a-select
            v-model:value="inviteForm.positionId"
            allow-clear
            placeholder="请选择岗位"
            style="width: 100%; max-width: 560px"
            :options="positionFilterOptions"
          />
          <div v-if="inviteForm.positionId" class="invite-position-perm-row">
            <a-button type="link" size="small" class="invite-view-perm-link" @click="openInvitePermDrawer">
              查看权限
            </a-button>
          </div>
        </a-form-item>
        <a-form-item label="部门" required>
          <a-select
            v-model:value="inviteForm.departmentIds"
            mode="multiple"
            allow-clear
            placeholder="至少选一个部门（一员多部）"
            style="width: 100%; max-width: 560px"
            :options="deptFilterOptions"
          />
        </a-form-item>
      </a-form>

      <div class="invite-page-actions">
        <a-space>
          <a-button @click="goBackToList">取消</a-button>
          <a-button type="primary" :loading="inviteLoading" @click="submitInvite">提交邀请</a-button>
        </a-space>
      </div>
    </div>

    <a-drawer
      v-model:open="invitePermDrawerOpen"
      :title="invitePreviewPosition ? `权限 · ${invitePreviewPosition.name}` : '权限预览'"
      placement="right"
      :width="520"
      :z-index="1100"
      :mask-closable="true"
    >
      <div class="invite-perm-drawer-inner">
        <p class="invite-perm-hint">按模块分组展示；勾选标记表示该岗位已授予。</p>
        <a-tree
          v-if="invitePreviewPosition?.permissionIds?.length"
          class="invite-perm-tree"
          block-node
          :show-line="true"
          :selectable="false"
          default-expand-all
          :tree-data="invitePermTreeData"
        />
        <div v-else class="invite-perm-empty">该岗位暂无勾选权限点（请到「岗位」Tab 配置）</div>
      </div>
    </a-drawer>

    <a-modal
      v-model:open="inviteDemoModalOpen"
      title="演示 · 激活链接"
      width="560px"
      ok-text="返回用户列表"
      cancel-text="留在本页"
      @ok="goBackToList"
    >
      <p>真实环境由邮件送达。以下为本次邀请的激活链接（含 token）：</p>
      <a-input :value="lastActivationUrl" readonly class="invite-demo-url-input">
        <template #addonAfter>
          <a-button type="link" size="small" @click="copyActivationLink">复制</a-button>
        </template>
      </a-input>
      <p class="invite-demo-modal-links">
        <router-link :to="{ path: '/invite/email-sample' }">查看邀请邮件模板</router-link>
        <span class="invite-demo-modal-sep"> · </span>
        <a :href="lastActivationUrl" target="_blank" rel="noopener noreferrer">在新标签打开激活页</a>
      </p>
    </a-modal>
  </div>
</template>

<style scoped lang="less">
.invite-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px 32px;
  width: 100%;
  margin-bottom: 24px;

  :deep(.portal-page-title) {
    margin-bottom: 0;
    flex: 0 1 auto;
  }

  .portal-page-sub {
    margin-bottom: 0;
  }
}

.invite-page-title {
  flex: 0 1 auto;
}

.page-sub--aside {
  flex: 0 1 380px;
  max-width: min(380px, 100%);
  text-align: right;
}

.invite-page-card {
  max-width: 640px;
  padding: 24px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.invite-form {
  margin-top: 0;
}

.invite-position-perm-row {
  margin-top: 4px;
}

.invite-view-perm-link {
  padding-left: 0;
  height: auto;
}

.invite-page-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.invite-perm-drawer-inner {
  padding-right: 4px;
}

.invite-perm-hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 1.5;
}

.invite-perm-tree {
  background: transparent;

  :deep(.ant-tree-treenode) {
    padding-block: 2px;
  }

  :deep(.ant-tree-switcher) {
    line-height: 28px;
  }

  :deep(.ant-tree-node-content-wrapper) {
    padding-block: 4px;
    border-radius: 6px;
  }

  :deep(.ant-tree-title) {
    width: 100%;
  }
}

.invite-perm-leaf {
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
}

.invite-perm-leaf-icon {
  flex-shrink: 0;
  margin-top: 3px;
  font-size: 14px;
  color: var(--ant-color-success, #52c41a);
}

.invite-perm-leaf-dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  margin-top: 8px;
  margin-left: 4px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.15);
}

.invite-perm-leaf-text {
  flex: 1;
  min-width: 0;
}

.invite-perm-leaf--off .invite-perm-leaf-text {
  color: rgba(0, 0, 0, 0.38);
}

.invite-perm-empty {
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

.invite-demo-modal-links {
  margin-top: 12px;
  font-size: 13px;
}

.invite-demo-modal-sep {
  color: rgba(0, 0, 0, 0.25);
}

.invite-demo-url-input {
  margin-top: 8px;
}

@media (max-width: 576px) {
  .invite-title-row {
    flex-direction: column;
    align-items: stretch;
  }

  .page-sub--aside {
    max-width: none;
    text-align: left;
  }
}
</style>
