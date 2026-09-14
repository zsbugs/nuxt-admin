import type { OrderStatus } from './types'

/**
 * 前后端共享的常量。
 *
 * 为什么不放在 shared/types.ts 里：
 * 那个文件只装类型（编译后被擦除），这里装的是运行时会用到的值。
 * 混在一起最容易踩的坑是「以为它能自动导入」——
 * Nuxt 不会自动导入 shared/ 根目录下的文件，只有 shared/utils/ 和 shared/types/ 会。
 * 所以这里在用到的地方一律显式 import，不玩猜测。
 */

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待付款',
  paid: '已付款',
  cancelled: '已取消',
}

export const ORDER_STATUS_VALUES: OrderStatus[] = ['pending', 'paid', 'cancelled']
