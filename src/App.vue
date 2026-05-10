<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import { antdTheme } from '@/theme/tokens'
</script>

<template>
  <a-config-provider :theme="antdTheme" :locale="zhCN">
    <router-view />
  </a-config-provider>
</template>
