<script setup lang="ts">
import type { Customer } from '~~/shared/types'

/**
 * 客户列表 —— 特征 1、4 的主场。
 *
 * 读取用 useAsyncData：SSR 阶段就把数据取回来渲染进 HTML，
 * 所以直接按 F5 或者粘贴 URL 都能看到内容（验收 A2）。
 *
 * 新增/编辑/删除之后调 refresh()：
 * 这是「写后失效」，也是很多 CRUD 演示漏掉的一步 ——
 * 只演示「能查」不够，写完之后列表还是旧的，那个 demo 是假的。
 */
const { data, pending, error, refresh } = await useAsyncData('customers', () =>
  $fetch<{ customers: Customer[] }>('/api/customers'),
)

const keyword = ref('')
const customers = computed(() => data.value?.customers ?? [])

/** 搜索放在前端：8 条数据不值得为它写一次 SQL 查询（见「不做」清单） */
const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return customers.value

  return customers.value.filter((c) =>
    [c.name, c.company, c.phone, c.email].some((field) => (field ?? '').toLowerCase().includes(kw)),
  )
})

const dialogVisible = ref(false)
const submitting = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({ name: '', company: '', phone: '', email: '' })

function openCreateDialog() {
  editingId.value = null
  Object.assign(form, { name: '', company: '', phone: '', email: '' })
  dialogVisible.value = true
}

function openEditDialog(customer: Customer) {
  editingId.value = customer.id
  Object.assign(form, {
    name: customer.name,
    company: customer.company ?? '',
    phone: customer.phone ?? '',
    email: customer.email ?? '',
  })
  dialogVisible.value = true
}

async function submitForm() {
  submitting.value = true
  try {
    if (editingId.value === null) {
      await $fetch('/api/customers', { method: 'POST', body: { ...form } })
      ElMessage.success('已新增客户')
    } else {
      await $fetch(`/api/customers/${editingId.value}`, { method: 'PUT', body: { ...form } })
      ElMessage.success('已保存修改')
    }

    dialogVisible.value = false
    await refresh() // ← 写后失效
  } catch (error) {
    // 校验失败的 400 会带着服务端写好的说明回来，直接展示
    ElMessage.error(getErrorMessage(error))
  } finally {
    submitting.value = false
  }
}

async function removeCustomer(customer: Customer) {
  try {
    await ElMessageBox.confirm(`确认删除客户「${customer.name}」？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch {
    return // 用户点了取消，不是错误
  }

  try {
    await $fetch(`/api/customers/${customer.id}`, { method: 'DELETE' })
    await refresh() // ← 写后失效
    ElMessage.success('已删除')
  } catch (error) {
    // 验收 A4：删除有订单的客户 → 这里弹出「还有 3 条订单，不能删除」
    ElMessage.error(getErrorMessage(error))
  }
}
</script>

<template>
  <el-card>
    <template #header>
      <div class="toolbar">
        <el-input v-model="keyword" placeholder="搜索名称 / 公司 / 电话 / 邮箱" clearable class="search" />
        <el-button type="primary" @click="openCreateDialog">新增客户</el-button>
      </div>
    </template>

    <el-alert v-if="error" type="error" :title="getErrorMessage(error)" :closable="false" show-icon />

    <el-table v-else :data="filtered" v-loading="pending" stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="客户名称" width="120">
        <template #default="{ row }">
          <NuxtLink :to="`/customers/${row.id}`" class="link">{{ row.name }}</NuxtLink>
        </template>
      </el-table-column>
      <el-table-column prop="company" label="公司" min-width="200" />
      <el-table-column prop="phone" label="电话" width="140" />
      <el-table-column prop="email" label="邮箱" min-width="180" />
      <el-table-column prop="created_at" label="创建时间" width="170" />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="removeCustomer(row)">删除</el-button>
        </template>
      </el-table-column>
      <template #empty>没有匹配的客户</template>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId === null ? '新增客户' : `编辑客户 #${editingId}`"
      width="480px"
    >
      <el-form label-width="90px">
        <el-form-item label="客户名称" required>
          <el-input v-model="form.name" placeholder="必填，最多 50 字" />
        </el-form-item>
        <el-form-item label="公司">
          <el-input v-model="form.company" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.search {
  max-width: 320px;
}

.link {
  color: var(--el-color-primary);
  text-decoration: none;
}
</style>
