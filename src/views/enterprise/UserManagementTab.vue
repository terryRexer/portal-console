<script setup lang="ts">
import { h, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { ColumnsType } from 'ant-design-vue/es/table'
import { Button, Modal, Tag, message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import type { TenantUserRow } from '@/types/f15UserManagement'
import { positions, departments, userRows } from '@/state/enterpriseSettings'
import { DEMO_AUDIT_USER, demoNow } from '@/constants/demoAudit'
import {
  buildActivationHref,
  createInviteToken,
  findTokenForUser,
} from '@/state/inviteActivation'

const router = useRouter()

const searchKeyword = ref<string>()
const searchDeptId = ref<string>()
const searchPositionId = ref<string>()
const searchStatus = ref<string>()

const deptFilterOptions = computed(() =>
  departments.value.map((d) => ({ value: d.id, label: d.name })),
)
const positionFilterOptions = computed(() =>
  positions.value.map((p) => ({ value: p.id, label: p.name })),
)

const statusFilterOptions = [
  { value: '启用', label: '启用' },
  { value: '停用', label: '停用' },
  { value: '待激活', label: '待激活' },
  { value: '作废', label: '作废' },
]

function adminEnabledCount() {
  return userRows.value.filter(
    (u) => u.positionId === 'pos-admin' && u.status === '启用',
  ).length
}

const filteredUsers = computed(() => {
  return userRows.value.filter((u) => {
    const kw = searchKeyword.value?.trim()
    if (kw && !u.email.includes(kw) && !u.name.includes(kw) && !(u.invitedBy?.includes(kw) ?? false))
      return false
    if (searchDeptId.value && !u.departmentIds.includes(searchDeptId.value)) return false
    if (searchPositionId.value && u.positionId !== searchPositionId.value) return false
    if (searchStatus.value && u.status !== searchStatus.value) return false
    return true
  })
})

function openInvite() {
  router.push({ name: 'InviteUser' })
}

const editDrawerOpen = ref(false)
const editForm = ref({
  id: '',
  email: '',
  name: '',
  isFirstAdmin: false,
  createdAt: '',
  updatedAt: '',
  updatedBy: '',
  invitedBy: '',
  positionId: '',
  departmentIds: [] as string[],
  status: '启用' as TenantUserRow['status'],
})

function openEdit(record: TenantUserRow) {
  editForm.value = {
    id: record.id,
    email: record.email,
    name: record.name,
    isFirstAdmin: !!record.isFirstAdmin,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    updatedBy: record.updatedBy,
    invitedBy: record.invitedBy ?? '',
    positionId: record.positionId,
    departmentIds: [...record.departmentIds],
    status: record.status,
  }
  editDrawerOpen.value = true
}

function saveEdit() {
  const idx = userRows.value.findIndex((u) => u.id === editForm.value.id)
  if (idx === -1) {
    message.error('未找到用户')
    return
  }
  if (!['启用', '停用'].includes(editForm.value.status)) {
    message.warning('待激活 / 作废成员请在列表查看；演示编辑仅支持启用或停用成员')
    return
  }
  const pos = positions.value.find((p) => p.id === editForm.value.positionId)
  const deps = departments.value.filter((d) => editForm.value.departmentIds.includes(d.id))
  if (!pos || deps.length !== editForm.value.departmentIds.length) {
    message.warning('请选择有效的岗位与部门')
    return
  }
  if (editForm.value.positionId === 'pos-admin' && editForm.value.status !== '启用') {
    const others = userRows.value.filter(
      (u) =>
        u.id !== editForm.value.id &&
        u.positionId === 'pos-admin' &&
        u.status === '启用',
    )
    if (others.length === 0) {
      message.warning('须保留至少一名启用状态的管理员岗位成员')
      return
    }
  }
  const uid = editForm.value.id
  for (const d of departments.value) {
    d.userIds = d.userIds.filter((id) => id !== uid)
  }
  for (const did of editForm.value.departmentIds) {
    const dep = departments.value.find((d) => d.id === did)
    if (dep && !dep.userIds.includes(uid)) dep.userIds.push(uid)
  }

  const now = demoNow()
  userRows.value[idx] = {
    ...userRows.value[idx],
    name: editForm.value.name.trim() || '—',
    positionId: editForm.value.positionId,
    positionName: pos.name,
    departmentIds: [...editForm.value.departmentIds],
    departmentNames: deps.map((d) => d.name),
    status: editForm.value.status,
    updatedAt: now,
    updatedBy: DEMO_AUDIT_USER,
  }
  message.success('已保存（演示）')
  editDrawerOpen.value = false
}

function openActivateDemo(record: TenantUserRow) {
  let tok = findTokenForUser(record.id)
  if (!tok) {
    tok = createInviteToken(record.id)
    message.info('已为该用户生成演示用激活链接')
  }
  window.open(buildActivationHref(tok), '_blank', 'noopener,noreferrer')
}

function toggleDisable(record: TenantUserRow) {
  if (record.isFirstAdmin) return
  const target = record.status === '启用' ? '停用' : '启用'
  if (target === '停用' && record.positionId === 'pos-admin' && adminEnabledCount() <= 1) {
    message.warning('不得停用最后一名启用中的管理员岗位成员')
    return
  }
  Modal.confirm({
    title: target === '停用' ? '确认停用？' : '确认启用？',
    okText: '确定',
    cancelText: '取消',
    onOk() {
      const idx = userRows.value.findIndex((u) => u.id === record.id)
      if (idx === -1) return
      const now = demoNow()
      userRows.value[idx] = {
        ...userRows.value[idx],
        status: target,
        updatedAt: now,
        updatedBy: DEMO_AUDIT_USER,
      }
      message.success(`已${target}（演示）`)
    },
  })
}

function statusTag(text: string) {
  const map: Record<string, string> = {
    启用: 'success',
    停用: 'default',
    待激活: 'processing',
    作废: 'error',
  }
  return h(Tag, { color: map[text] ?? 'default' }, () => text)
}

const columns: ColumnsType = [
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
    width: 176,
    align: 'center',
    ellipsis: true,
  },
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
    width: 96,
    align: 'center',
    ellipsis: true,
  },
  {
    title: '岗位',
    dataIndex: 'positionName',
    key: 'positionName',
    width: 108,
    align: 'center',
    ellipsis: true,
  },
  {
    title: '部门',
    key: 'departments',
    width: 200,
    align: 'center',
    ellipsis: true,
    customRender: ({ record }) => {
      const r = record as TenantUserRow
      return h(
        'span',
        { class: 'dept-tags' },
        r.departmentNames.map((n) => h(Tag, { key: n, style: { marginBottom: '4px' } }, () => n)),
      )
    },
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 96,
    align: 'center',
    customRender: ({ text }) => statusTag(text as string),
  },
  {
    title: '发起邀请人',
    key: 'invitedBy',
    width: 120,
    align: 'center',
    ellipsis: true,
    customRender: ({ record }) => {
      const r = record as TenantUserRow
      return r.invitedBy?.trim() ? r.invitedBy : '—'
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
    title: '邀请人',
    dataIndex: 'updatedBy',
    key: 'updatedBy',
    width: 132,
    align: 'center',
    ellipsis: true,
  },
  {
    title: '操作',
    key: 'action',
    width: 196,
    align: 'center',
    customRender: ({ record }) => {
      const r = record as TenantUserRow
      const btns = [
        h(
          Button,
          {
            type: 'link',
            size: 'small',
            disabled: r.status !== '启用' && r.status !== '停用',
            onClick: () => openEdit(r),
          },
          () => '编辑',
        ),
      ]
      if (r.status === '待激活') {
        btns.push(
          h(
            Button,
            { type: 'link', size: 'small', onClick: () => openActivateDemo(r) },
            () => '激活页',
          ),
        )
      }
      if (!r.isFirstAdmin && (r.status === '启用' || r.status === '停用')) {
        btns.push(
          h(
            Button,
            { type: 'link', size: 'small', onClick: () => toggleDisable(r) },
            () => (r.status === '启用' ? '停用' : '启用'),
          ),
        )
      }
      return h('span', { class: 'action-cell' }, btns)
    },
  },
]

function onSearch() {
  message.success('已筛选（演示）')
}

function onReset() {
  searchKeyword.value = undefined
  searchDeptId.value = undefined
  searchPositionId.value = undefined
  searchStatus.value = undefined
}
</script>

<template>
  <div class="f3-users">
    <p class="module-hint">
      F3：邀请 / 列表 / 编辑（演示）。岗位与部门请在「岗位」「部门」Tab 维护；首个管理员不可改岗、不可停用。
    </p>

    <div class="toolbar">
      <div class="users-toolbar-inner">
        <a-space wrap :size="12">
          <a-input
            v-model:value="searchKeyword"
            allow-clear
            placeholder="邮箱、名称或邀请人"
            style="width: 180px"
          />
          <a-select
            v-model:value="searchDeptId"
            allow-clear
            placeholder="部门"
            style="width: 180px"
            :options="deptFilterOptions"
          />
          <a-select
            v-model:value="searchPositionId"
            allow-clear
            placeholder="岗位"
            style="width: 180px"
            :options="positionFilterOptions"
          />
          <a-select
            v-model:value="searchStatus"
            allow-clear
            placeholder="状态"
            style="width: 140px"
            :options="statusFilterOptions"
          />
          <a-button type="primary" @click="onSearch">查询</a-button>
          <a-button @click="onReset">重置</a-button>
        </a-space>
        <a-button type="primary" class="users-toolbar-invite" @click="openInvite">
          <template #icon>
            <PlusOutlined />
          </template>
          邀请用户
        </a-button>
      </div>
    </div>

    <a-table
      :columns="columns"
      :data-source="filteredUsers"
      row-key="id"
      size="middle"
      :scroll="{ x: 1460 }"
      :pagination="{ pageSize: 10, showSizeChanger: true }"
    />

    <a-drawer
      v-model:open="editDrawerOpen"
      title="编辑用户"
      placement="right"
      :width="520"
      :mask-closable="true"
    >
      <div class="edit-user-form">
        <div class="edit-readonly-block">
          <div class="edit-readonly-row">
            <span class="edit-readonly-label">邮箱</span>
            <span class="edit-readonly-value">{{ editForm.email }}</span>
          </div>
          <div class="edit-readonly-row">
            <span class="edit-readonly-label">发起邀请人</span>
            <span class="edit-readonly-value">{{ editForm.invitedBy?.trim() ? editForm.invitedBy : '—' }}</span>
          </div>
          <div v-if="editForm.isFirstAdmin" class="edit-readonly-row">
            <span class="edit-readonly-label">首个管理员</span>
            <span class="edit-readonly-value">岗位固定为「管理员」，不可变更</span>
          </div>
        </div>
        <a-form layout="vertical" class="edit-user-form-fields">
          <a-form-item label="名称">
            <a-input v-model:value="editForm.name" placeholder="选填" />
          </a-form-item>
          <a-form-item label="岗位" required>
            <a-select
              v-model:value="editForm.positionId"
              placeholder="请选择岗位"
              style="width: 100%"
              :disabled="editForm.isFirstAdmin"
              :options="positionFilterOptions"
            />
          </a-form-item>
          <a-form-item label="部门" required>
            <a-select
              v-model:value="editForm.departmentIds"
              mode="multiple"
              placeholder="至少一个部门"
              style="width: 100%"
              :options="deptFilterOptions"
            />
          </a-form-item>
          <a-form-item v-if="!editForm.isFirstAdmin" label="状态" required>
            <a-switch
              :checked="editForm.status === '启用'"
              checked-children="启用"
              un-checked-children="停用"
              @change="
                (checked: boolean) => (editForm.status = checked ? '启用' : '停用')
              "
            />
          </a-form-item>
        </a-form>
        <div class="edit-readonly-block edit-readonly-block--meta">
          <div class="edit-readonly-row">
            <span class="edit-readonly-label">创建时间</span>
            <span class="edit-readonly-value">{{ editForm.createdAt }}</span>
          </div>
          <div class="edit-readonly-row">
            <span class="edit-readonly-label">更新时间</span>
            <span class="edit-readonly-value">{{ editForm.updatedAt }}</span>
          </div>
          <div class="edit-readonly-row">
            <span class="edit-readonly-label">邀请人</span>
            <span class="edit-readonly-value">{{ editForm.updatedBy }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="drawer-footer-actions">
          <a-button type="primary" @click="saveEdit">保存</a-button>
        </div>
      </template>
    </a-drawer>
  </div>
</template>

<style scoped lang="less">
.module-hint {
  margin: 0 0 16px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
}

.toolbar {
  margin-bottom: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.users-toolbar-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.users-toolbar-invite {
  flex-shrink: 0;
}

.edit-user-form {
  margin-top: 8px;
}

.edit-readonly-block {
  margin-bottom: 16px;
}

.edit-readonly-block--meta {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.edit-readonly-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
}

.edit-readonly-label {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.edit-readonly-value {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
}

.drawer-footer-actions {
  display: flex;
  justify-content: flex-end;
}

.action-cell {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  width: 100%;
}

.dept-tags {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  max-width: 100%;
}
</style>
