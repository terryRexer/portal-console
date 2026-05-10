<script setup lang="ts">
import { useRoute } from 'vue-router'
import PortalPageTitle from '@/components/PortalPageTitle.vue'

const route = useRoute()
const title = route.meta.title ?? '页面'
</script>

<template>
  <div class="portal-page-card">
    <PortalPageTitle>{{ title }}</PortalPageTitle>
    <a-empty :description="`${title} — 演示占位，路由已挂接`" />
  </div>
</template>
