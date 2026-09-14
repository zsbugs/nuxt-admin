<template>
  <!-- 登录页专用布局：没有侧栏，因为这时还没有身份 -->
  <div class="blank">
    <slot />
  </div>
</template>

<style scoped>
.blank {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
</style>
