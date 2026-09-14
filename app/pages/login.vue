<script setup lang="ts">
import type { SessionUser } from '~~/shared/types'

/**
 * 登录页。用 blank 布局（特征 6）。
 *
 * 故意预填演示账号：这是一个教学演示，不是真系统，
 * 让读者打开就能进去看特征，比让他先翻 README 找密码更有用。
 */
definePageMeta({ layout: 'blank' })

const route = useRoute()

const form = reactive({ username: 'admin', password: 'demo1234' })
const submitting = ref(false)
const errorMessage = ref('')

// 组合函数在 await 之前取好（原因见 useAuth.ts 里的注释）
const authUser = useAuthUser()
const authLoaded = useAuthLoaded()

async function handleSubmit() {
  submitting.value = true
  errorMessage.value = ''

  try {
    const { user } = await $fetch<{ user: SessionUser }>('/api/login', {
      method: 'POST',
      body: { ...form },
    })

    // 特征 3：服务端刚返回的身份，直接写进 useState，
    // 这样客户端路由跳转时 middleware 不必再问一次 /api/me
    authUser.value = user
    authLoaded.value = true

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/customers'
    await navigateTo(redirect)
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-card class="login-card">
    <template #header>
      <div class="title">内部管理台</div>
    </template>

    <el-form label-position="top" @submit.prevent="handleSubmit">
      <el-form-item label="用户名">
        <el-input v-model="form.username" placeholder="admin" @keyup.enter="handleSubmit" />
      </el-form-item>

      <el-form-item label="密码">
        <el-input
          v-model="form.password"
          type="password"
          show-password
          placeholder="demo1234"
          @keyup.enter="handleSubmit"
        />
      </el-form-item>

      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        :closable="false"
        show-icon
        class="error"
      />

      <el-button type="primary" class="submit" :loading="submitting" @click="handleSubmit">
        登录
      </el-button>
    </el-form>

    <div class="hint">演示账号：admin / demo1234（写死在 server/utils/session.ts 里）</div>
  </el-card>
</template>

<style scoped>
.login-card {
  width: 380px;
}

.title {
  font-weight: 600;
  font-size: 16px;
}

.submit {
  width: 100%;
}

.error {
  margin-bottom: 16px;
}

.hint {
  margin-top: 16px;
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
}
</style>
