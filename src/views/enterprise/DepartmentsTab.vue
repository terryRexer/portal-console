<script setup lang="ts">
import { h, ref, computed } from 'vue'
import { Button, Tag, message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import type { DepartmentDef } from '@/types/f15UserManagement'
import { departments, userRows } from '@/state/enterpriseSettings'
import { DEMO_AUDIT_USER, demoNow } from '@/constants/demoAudit'

const drawerOpen = ref(false)
const editing = ref<DepartmentDef | null>(null)
const formName = ref('')
const formDesc = ref('')
const isCreate = ref(false)

const sortedDepartments = computed(() => {
  const list = [...departments.value]
  return list.sort((a, b) => {
    if (a.isHQ) return -1
    if (b.isHQ) return 1
    return a.name.localeCompare(b.name, 'zh-CN')
  })
})

function openCreate() {
  isCreate.value = true
  editing.value = null
  formName.value = ''
  formDesc.value = ''
  drawerOpen.value = true
}

function openEdit(record: DepartmentDef) {
  if (record.isHQ) {
    message.info('总部为系统预置，不可编辑（演示）')
    return
  }
  isCreate.value = false
  editing.value = record
  formName.value = record.name
  formDesc.value = record.description ?? ''
  drawerOpen.value = true
}

function saveDepartment() {
  const name = formName.value.trim()
  if (!name) {
    message.warning('部门名称必填')
    return
  }
  const others = departments.value.filter((d) => d.id !== editing.value?.id)
  if (others.some((d) => d.name === name)) {
    message.warning('租户内部门名称不得重复')
    return
  }
  if (isCreate.value) {
    const id = `dep-new-${Date.now()}`
    const ts = demoNow()
    departments.value.push({
      id,
      name,
      description: formDesc.value.trim() || undefined,
      userIds: [],
      createdAt: ts,
      updatedAt: ts,
      updatedBy: DEMO_AUDIT_USER,
    })
    message.success('已新建部门（演示）')
  } else if (editing.value) {
    editing.value.name = name
    editing.value.description = formDesc.value.trim() || undefined
    editing.value.updatedAt = demoNow()
    editing.value.updatedBy = DEMO_AUDIT_USER
    syncDepartmentNamesOnUsers()
    message.success('已保存（演示）')
  }
  drawerOpen.value = false
}

/** 部门改名后同步成员列表展示（演示） */
function syncDepartmentNamesOnUsers() {
  const map = new Map(departments.value.map((d) => [d.id, d.name]))
  for (const u of userRows.value) {
    u.departmentNames = u.departmentIds.map((id) => map.get(id) ?? '')
  }
}

const columns = [
  {
    title: '部门名称',
    dataIndex: 'name',
    key: 'name',
    width: 152,
    align: 'center',
    ellipsis: true,
  },
  {
    title: '说明',
    key: 'desc',
    width: 260,
    align: 'center',
    ellipsis: true,
    customRender: ({ record }: { record: DepartmentDef }) =>
      record.description || (record.isHQ ? '系统预置' : '—'),
  },
  {
    title: '类型',
    key: 'type',
    width: 112,
    align: 'center',
    customRender: ({ record }: { record: DepartmentDef }) =>
      record.isHQ ? h(Tag, { color: 'blue' }, () => '总部') : h(Tag, {}, () => '自定义'),
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
    width: 112,
    align: 'center',
    customRender: ({ record }: { record: DepartmentDef }) =>
      record.isHQ
        ? h('span', { style: 'color: rgba(0,0,0,0.25)' }, '—')
        : h(
            Button,
            { type: 'link', size: 'small', onClick: () => openEdit(record) },
            () => '编辑',
          ),
  },
]
</script>

<template>
  <div class="f2-departments">
    <div class="toolbar">
      <div class="departments-toolbar-inner">
        <a-button type="primary" class="departments-toolbar-create" @click="openCreate">
          <template #icon>
            <PlusOutlined />
          </template>
          新建部门
        </a-button>
      </div>
    </div>

    <p class="module-hint">列表平铺展示：系统预置「总部」与客户自建平行部门，不提供删除（F2）。</p>

    <a-table
      :columns="columns"
      :data-source="sortedDepartments"
      row-key="id"
      size="middle"
      :pagination="false"
      :scroll="{ x: 1104 }"
    />

    <a-drawer
      v-model:open="drawerOpen"
      :title="isCreate ? '新建部门' : '编辑部门'"
      placement="right"
      :width="480"
      :mask-closable="true"
      destroy-on-close
    >
      <a-form layout="vertical">
        <a-form-item label="部门名称" required>
          <a-input v-model:value="formName" placeholder="租户内不重名" />
        </a-form-item>
        <a-form-item label="部门说明">
          <a-textarea v-model:value="formDesc" placeholder="选填" :rows="3" />
        </a-form-item>
      </a-form>

      <template #footer>
        <div class="drawer-footer-actions">
          <a-button type="primary" @click="saveDepartment">保存</a-button>
        </div>
      </template>
    </a-drawer>
  </div>
</template>

<style scoped lang="less">
.toolbar {
  margin-bottom: 16px;
}

.departments-toolbar-inner {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.departments-toolbar-create {
  flex-shrink: 0;
}

.module-hint {
  margin: 0 0 16px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
}

.drawer-footer-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
