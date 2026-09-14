<script setup lang="ts">
import { ORDER_STATUS_LABELS, ORDER_STATUS_VALUES } from '~~/shared/constants'
import type { OrderStatus, OrderWithCustomer } from '~~/shared/types'

/**
 * 订单列表（只读）—— 特征 4 的另一种用法。
 *
 * 客户页演示「前端过滤 + refresh()」，这一页演示「watch 触发重新取数」：
 * status 一变，useAsyncData 自动重跑，不用手写 watch + $fetch + 赋值那三行样板。
 */
const status = ref<OrderStatus | ''>('')

const { data, pending, error } = await useAsyncData(
  'orders',
  () =>
    $fetch<{ orders: OrderWithCustomer[] }>('/api/orders', {
      query: status.value ? { status: status.value } : {},
    }),
  { watch: [status] },
)

const orders = computed(() => data.value?.orders ?? [])

const STATUS_TAG: Record<OrderStatus, 'warning' | 'success' | 'info'> = {
  pending: 'warning',
  paid: 'success',
  cancelled: 'info',
}

const total = computed(() => orders.value.reduce((sum, order) => sum + order.amount, 0))
</script>

<template>
  <el-card>
    <template #header>
      <div class="toolbar">
        <el-select v-model="status" placeholder="全部状态" clearable class="filter">
          <el-option
            v-for="value in ORDER_STATUS_VALUES"
            :key="value"
            :label="ORDER_STATUS_LABELS[value]"
            :value="value"
          />
        </el-select>

        <span class="summary">共 {{ orders.length }} 条，合计 {{ formatAmount(total) }}</span>
      </div>
    </template>

    <el-alert v-if="error" type="error" :title="getErrorMessage(error)" :closable="false" show-icon />

    <el-table v-else :data="orders" v-loading="pending" stripe>
      <el-table-column prop="id" label="订单号" width="90" />
      <el-table-column prop="title" label="内容" min-width="180" />
      <el-table-column prop="customer_name" label="客户" width="120">
        <template #default="{ row }">
          <NuxtLink :to="`/customers/${row.customer_id}`" class="link">{{ row.customer_name }}</NuxtLink>
        </template>
      </el-table-column>
      <el-table-column prop="amount" label="金额" width="140">
        <template #default="{ row }">{{ formatAmount(row.amount) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="STATUS_TAG[row.status]">{{ ORDER_STATUS_LABELS[row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="下单时间" width="170" />
      <template #empty>没有符合条件的订单</template>
    </el-table>
  </el-card>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter {
  width: 200px;
}

.summary {
  font-size: 14px;
  color: #606266;
}

.link {
  color: var(--el-color-primary);
  text-decoration: none;
}
</style>
