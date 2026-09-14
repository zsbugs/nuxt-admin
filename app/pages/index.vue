<script setup lang="ts">
/**
 * 根路径不在计划里的 4 个路由之内，这里只做一次重定向。
 * 全局 middleware 已经把未登录的人挡在 /login，所以走到这里的一定是已登录用户。
 */
await navigateTo('/customers', { replace: true })
</script>

<template>
  <div />
</template>
