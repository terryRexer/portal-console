<script setup lang="ts">
import { h, ref, computed, watch } from 'vue'
import { Button, Modal, Tag, message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import type { DataNode } from 'ant-design-vue/es/tree'
import type { PositionDef } from '@/types/f15UserManagement'
import { permissionCatalog } from '@/mocks/f15UserManagement'
import { positions } from '@/state/enterpriseSettings'
import { DEMO_AUDIT_USER, demoNow } from '@/constants/demoAudit'

const PERMISSION_ID_SET = new Set(permissionCatalog.map((p) => p.id))

function permissionIdsFromTreeCheckedKeys(keys: (string | number)[]): string[] {
  return keys.map(String).filter((k) => PERMISSION_ID_SET.has(k))
}

const selectedPositionId = ref('')
const drawerOpen = ref(false)
const newPositionDrawerOpen = ref(false)
const newPositionName = ref('')
const newPositionDesc = ref('')
const newPositionTreeCheckedKeys = ref<(string | number)[]>([])
const editNameDraft = ref('')
const editDescDraft = ref('')

const activePosition = computed(() =>
  positions.value.find((p) => p.id === selectedPositionId.value),
)

watch(
  positions,
  (list) => {
    if (list.length && !list.some((p) => p.id === selectedPositionId.value)) {
      selectedPositionId.value = list[0].id
    }
  },
  { deep: true, immediate: true },
)

watch(drawerOpen, (open) => {
  if (open && positions.value.length && !selectedPositionId.value) {
    selectedPositionId.value = positions.value[0].id
  }
  const pos = activePosition.value
  if (open && pos) {
    editDescDraft.value = pos.description ?? ''
    if (!pos.isAdminPreset) {
      editNameDraft.value = pos.name
    }
  }
})

const permOptions = computed(() =>
  permissionCatalog.map((p) => ({
    label: `${p.group} · ${p.name}`,
    value: p.id,
  })),
)

/** 新建岗位抽屉：按模块分组的权限树（可勾选） */
const permTreeDataForCreate = computed<DataNode[]>(() => {
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
    children: perms.map((perm) => ({
      key: perm.id,
      title: perm.name,
      isLeaf: true,
    })),
  }))
})

function openEditDrawer(id: string) {
  newPositionDrawerOpen.value = false
  selectedPositionId.value = id
  drawerOpen.value = true
}

function onPermGroupChange(vals: (string | number | boolean)[]) {
  const pos = positions.value.find((p) => p.id === selectedPositionId.value)
  if (pos) {
    pos.permissionIds = vals.map((v) => String(v))
  }
}

function addPosition() {
  drawerOpen.value = false
  newPositionName.value = ''
  newPositionDesc.value = ''
  newPositionTreeCheckedKeys.value = []
  newPositionDrawerOpen.value = true
}

function saveNewPosition() {
  const name = newPositionName.value.trim()
  if (!name) {
    message.warning('请输入岗位名称')
    return
  }
  if (positions.value.some((p) => p.name === name)) {
    message.warning('租户内岗位名称不得重复')
    return
  }
  const id = `pos-new-${Date.now()}`
  const desc = newPositionDesc.value.trim()
  const ts = demoNow()
  positions.value.push({
    id,
    name,
    description: desc || undefined,
    permissionIds: permissionIdsFromTreeCheckedKeys(newPositionTreeCheckedKeys.value),
    createdAt: ts,
    updatedAt: ts,
    updatedBy: DEMO_AUDIT_USER,
  })
  selectedPositionId.value = id
  newPositionDrawerOpen.value = false
  message.success('已新建岗位（演示）')
}

function deletePosition(record: PositionDef) {
  if (record.isAdminPreset) return
  Modal.confirm({
    title: '确认删除岗位？',
    content: '删除岗位后，相关用户将失去岗位权限。',
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      positions.value = positions.value.filter((p) => p.id !== record.id)
      if (selectedPositionId.value === record.id) {
        selectedPositionId.value = positions.value[0]?.id ?? ''
      }
      message.success('已删除（演示）')
    },
  })
}

function saveDrawer() {
  const pos = activePosition.value
  if (!pos) return
  if (!pos.isAdminPreset) {
    const name = editNameDraft.value.trim()
    if (!name) {
      message.warning('请输入岗位名称')
      return
    }
    if (positions.value.some((p) => p.id !== pos.id && p.name === name)) {
      message.warning('租户内岗位名称不得重复')
      return
    }
    pos.name = name
  }
  const d = editDescDraft.value.trim()
  pos.description = d ? d : undefined
  pos.updatedAt = demoNow()
  pos.updatedBy = DEMO_AUDIT_USER
  message.success('已保存（演示）')
  drawerOpen.value = false
}

const columns = [
  {
    title: '岗位名称',
    dataIndex: 'name',
    key: 'name',
    width: 144,
    align: 'center',
    ellipsis: true,
  },
  {
    title: '岗位说明',
    dataIndex: 'description',
    key: 'description',
    width: 240,
    align: 'center',
    ellipsis: true,
    customRender: ({ text }: { text?: string }) =>
      text !== undefined && text !== null && String(text).trim() !== '' ? String(text) : '—',
  },
  {
    title: '类型',
    key: 'type',
    width: 112,
    align: 'center',
    customRender: ({ record }: { record: PositionDef }) =>
      record.isAdminPreset ? h(Tag, { color: 'blue' }, () => '系统预置') : h(Tag, {}, () => '自定义'),
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
    width: 184,
    align: 'center',
    customRender: ({ record }: { record: PositionDef }) =>
      h('span', { class: 'table-actions' }, [
        h(
          Button,
          { type: 'link', size: 'small', onClick: () => openEditDrawer(record.id) },
          () => '编辑',
        ),
        !record.isAdminPreset
          ? h(
              Button,
              {
                type: 'link',
                size: 'small',
                danger: true,
                onClick: () => deletePosition(record),
              },
              () => '删除',
            )
          : null,
      ]),
  },
]
</script>

<template>
  <div class="f1-positions">
    <div class="toolbar">
      <div class="positions-toolbar-inner">
        <a-button type="primary" class="positions-toolbar-create" @click="addPosition">
          <template #icon>
            <PlusOutlined />
          </template>
          新建岗位
        </a-button>
      </div>
    </div>

    <a-table
      :columns="columns"
      :data-source="positions"
      row-key="id"
      size="middle"
      :pagination="false"
      :scroll="{ x: 1148 }"
      class="positions-table"
    />

    <a-drawer
      v-model:open="newPositionDrawerOpen"
      title="新建岗位"
      placement="right"
      :width="920"
      :mask-closable="true"
      destroy-on-close
      @close="newPositionDrawerOpen = false"
    >
      <a-row :gutter="20" class="new-position-create-row">
        <a-col :xs="24" :sm="9" class="new-position-create-col-left">
          <a-form layout="vertical">
            <a-form-item label="岗位名称" required>
              <a-input v-model:value="newPositionName" placeholder="同一租户内不得重复" />
            </a-form-item>
            <a-form-item label="岗位说明">
              <a-textarea
                v-model:value="newPositionDesc"
                placeholder="选填，客户自定义"
                :rows="6"
                allow-clear
              />
            </a-form-item>
          </a-form>
        </a-col>
        <a-col :xs="24" :sm="15" class="new-position-create-col-right">
          <div class="panel-sub panel-sub--tree">分配权限</div>
          <p class="panel-desc">在 Boss 下发的权限点清单中勾选（演示数据）</p>
          <div class="new-position-perm-tree-wrap">
            <a-tree
              v-model:checked-keys="newPositionTreeCheckedKeys"
              checkable
              block-node
              :show-line="true"
              default-expand-all
              :selectable="false"
              :tree-data="permTreeDataForCreate"
              class="new-position-perm-tree"
            />
          </div>
        </a-col>
      </a-row>

      <template #footer>
        <div class="drawer-footer-actions">
          <a-button type="primary" @click="saveNewPosition">保存</a-button>
        </div>
      </template>
    </a-drawer>

    <a-drawer
      v-model:open="drawerOpen"
      :title="activePosition?.isAdminPreset ? '编辑岗位（系统预置）' : '编辑岗位'"
      placement="right"
      :width="720"
      :mask-closable="true"
      destroy-on-close
      @close="drawerOpen = false"
    >
      <template v-if="activePosition">
        <a-form layout="vertical">
          <a-form-item v-if="activePosition.isAdminPreset" label="岗位名称">
            <a-input :value="activePosition.name" disabled />
            <div class="field-hint">系统预置「管理员」岗位，不提供改名入口（演示）</div>
          </a-form-item>
          <a-form-item v-else label="岗位名称" required>
            <a-input v-model:value="editNameDraft" placeholder="同一租户内不得重复" />
          </a-form-item>
          <a-form-item label="岗位说明">
            <a-textarea
              v-model:value="editDescDraft"
              placeholder="选填，客户自定义"
              :rows="3"
              allow-clear
            />
          </a-form-item>
        </a-form>

        <div class="panel-sub">分配权限</div>
        <p class="panel-desc">在 Boss 下发的权限点清单中勾选（演示数据）</p>
        <a-checkbox-group
          class="perm-group"
          :value="activePosition.permissionIds"
          :options="permOptions"
          @change="onPermGroupChange($event as (string | number | boolean)[])"
        />
      </template>

      <template #footer>
        <div class="drawer-footer-actions">
          <a-button type="primary" @click="saveDrawer">保存</a-button>
        </div>
      </template>
    </a-drawer>
  </div>
</template>

<style scoped lang="less">
.toolbar {
  margin-bottom: 16px;
}

.positions-toolbar-inner {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.positions-toolbar-create {
  flex-shrink: 0;
}

.panel-sub {
  font-weight: 600;
  margin: 16px 0 8px;

  &--tree {
    margin-top: 0;
  }
}

.panel-desc {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  margin-bottom: 12px;
}

.new-position-create-row {
  align-items: stretch;
}

.new-position-create-col-right {
  border-left: 1px solid #f0f0f0;
  padding-left: 20px;
  min-height: 280px;
}

@media (max-width: 576px) {
  .new-position-create-col-right {
    border-left: none;
    padding-left: 0;
    margin-top: 8px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
  }
}

.new-position-perm-tree-wrap {
  max-height: 420px;
  overflow: auto;
  padding: 8px 4px 4px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.new-position-perm-tree {
  background: transparent;
}

.field-hint {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.drawer-footer-actions {
  display: flex;
  justify-content: flex-end;
}

.perm-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 420px;
  overflow: auto;
}

.positions-table :deep(.table-actions) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px;
  width: 100%;
}
</style>
