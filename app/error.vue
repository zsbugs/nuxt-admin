<script setup lang="ts">
import type { NuxtError } from '#app'

/**
 * 全局错误页（特征 8）。
 *
 * 只有「整个页面无法渲染」的情况才会走到这里 ——
 * 比如客户详情页拿到 404，或者某个接口在 SSR 阶段直接抛错。
 * 「点删除按钮失败了」那种局部错误不走这里，用 ElMessage 提示就够了。
 */
const props = defineProps<{ error: NuxtError }>()

function backToCustomers() {
  clearError({ redirect: '/customers' })
}
</script>

<template>
  <div class="error-page">
    <el-result
      :icon="props.error.statusCode === 404 ? 'warning' : 'error'"
      :title="String(props.error.statusCode ?? '出错了')"
      :sub-title="props.error.statusMessage || props.error.message || '页面无法显示'"
    >
      <template #extra>
        <el-button type="primary" @click="backToCustomers">回到客户列表</el-button>
      </template>
    </el-result>
  </div>
</template>

<style scoped>
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
</style>
