<script setup lang="ts">
import { reactive } from 'vue'
import { message } from 'ant-design-vue'
import PortalPageTitle from '@/components/PortalPageTitle.vue'

const form = reactive({
  oldPwd: '',
  newPwd: '',
  confirm: '',
  captcha: '',
})

function onSubmit() {
  message.success('已提交（演示，不校验）')
}
</script>

<template>
  <div class="portal-page-card">
    <a-breadcrumb class="portal-page-crumb">
      <a-breadcrumb-item>设置-本期新增</a-breadcrumb-item>
      <a-breadcrumb-item>登录密码</a-breadcrumb-item>
    </a-breadcrumb>
    <PortalPageTitle>修改登录密码</PortalPageTitle>
    <div class="pwd-form-wrap">
      <a-form layout="vertical" :model="form" style="max-width: 420px">
        <a-form-item label="原密码" required>
          <a-input-password v-model:value="form.oldPwd" placeholder="请输入原密码" />
        </a-form-item>
        <a-form-item label="新密码" required>
          <a-input-password v-model:value="form.newPwd" placeholder="请输入新密码" />
        </a-form-item>
        <a-form-item label="确认新密码" required>
          <a-input-password v-model:value="form.confirm" placeholder="请再次输入新密码" />
        </a-form-item>
        <a-form-item label="验证码">
          <a-space>
            <a-input v-model:value="form.captcha" placeholder="请输入验证码" style="width: 200px" />
            <a-button>发送</a-button>
          </a-space>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="onSubmit">提交</a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<style scoped lang="less">
.pwd-form-wrap {
  padding-top: 8px;
}
</style>
