<script setup lang="ts">
import { ORDER_STATUS_LABELS } from '~~/shared/constants'
import type { Customer, Order } from '~~/shared/types'

/**
 * 客户详情（特征 6：动态路由 /customers/[id]）。
 *
 * 一个接口把客户和订单一起给回来，所以这里只有一个 useAsyncData。
 */
const route = useRoute()
const id = route.params.id as string

const { data, error } = await useAsyncData(`customer-${id}`, () =>
  $fetch<{ customer: Customer; orders: Order[] }>(`/api/customers/${id}`),
)

/**
 * 特征 8：「客户不存在」这类错误不该在页面里写一段 if 去提示，
 * 而应该交给全局 error.vue —— 它本来就是为这种情况准备的。
 */
if (error.value) {
  showError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: getErrorMessage(error.value),
  })
}

const STATUS_TAG: Record<Order['status'], 'warning' | 'success' | 'info'> = {
  pending: 'warning',
  paid: 'success',
  cancelled: 'info',
}
</script>

<template>
  <div v-if="data">
    <el-page-header :content="data.customer.name" @back="navigateTo('/customers')" class="header" />

    <el-card class="card">
      <template #header>基本信息</template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="ID">{{ data.customer.id }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ data.customer.name }}</el-descriptions-item>
        <el-descriptions-item label="公司">{{ data.customer.company ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ data.customer.phone ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ data.customer.email ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ data.customer.created_at }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="card">
      <template #header>订单（{{ data.orders.length }} 条）</template>

      <el-table :data="data.orders" stripe>
        <el-table-column prop="id" label="订单号" width="90" />
        <el-table-column prop="title" label="内容" min-width="180" />
        <el-table-column prop="amount" label="金额" width="140">
          <template #default="{ row }">{{ formatAmount(row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="STATUS_TAG[row.status]">{{ ORDER_STATUS_LABELS[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="下单时间" width="170" />
        <template #empty>该客户暂无订单（删除他一定成功）</template>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.header {
  margin-bottom: 16px;
}

.card {
  margin-bottom: 16px;
}
</style>
