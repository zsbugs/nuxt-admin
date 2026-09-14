<script setup lang="ts">
/**
 * 登录后的主布局：左侧导航 + 顶栏用户信息（特征 6 的 layout 部分）。
 */
const user = useAuthUser()
const route = useRoute()

async function handleLogout() {
  await logoutUser()
  await navigateTo('/login')
}
</script>

<template>
  <el-container class="layout">
    <el-aside width="200px" class="aside">
      <div class="brand">内部管理台</div>
      <el-menu :default-active="route.path" router class="menu">
        <el-menu-item index="/customers">客户管理</el-menu-item>
        <el-menu-item index="/orders">订单管理</el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <span class="user">当前用户：{{ user?.username ?? '未知' }}</span>
        <el-button link type="primary" @click="handleLogout">退出登录</el-button>
      </el-header>

      <el-main>
        <slot />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout {
  height: 100vh;
}

.aside {
  background-color: #fff;
  border-right: 1px solid #e4e7ed;
}

.brand {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  border-bottom: 1px solid #e4e7ed;
}

.menu {
  border-right: none;
}

.header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.user {
  color: #606266;
  font-size: 14px;
}
</style>
