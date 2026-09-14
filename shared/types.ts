/**
 * 前后端共享的类型定义。
 *
 * 放在根目录的 shared/ 里，app/ 与 server/ 都能引用，
 * 这样接口的返回结构只有一处定义，改字段时两端同时报错。
 */

export type OrderStatus = 'pending' | 'paid' | 'cancelled'

// 状态的中文名与合法取值是运行时的值，放在 shared/constants.ts

export interface Customer {
  id: number
  name: string
  company: string | null
  phone: string | null
  email: string | null
  created_at: string
}

export interface Order {
  id: number
  customer_id: number
  title: string
  amount: number
  status: OrderStatus
  created_at: string
}

/** 订单列表里带上客户名称，省得前端再加一次请求 */
export interface OrderWithCustomer extends Order {
  customer_name: string
}

export interface SessionUser {
  username: string
}
