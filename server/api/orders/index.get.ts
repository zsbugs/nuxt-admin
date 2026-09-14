import { ORDER_STATUS_VALUES } from '~~/shared/constants'
import type { OrderStatus, OrderWithCustomer } from '~~/shared/types'

/**
 * 订单列表（只读），支持按状态筛选。
 *
 * 筛选放在服务端而不是前端，是为了和客户列表形成对照：
 * 客户页演示「前端过滤 + refresh()」，订单页演示「watch 触发重新取数」。
 * 同一个特征（useAsyncData）的两种典型用法，都值得看一眼。
 */
export default defineEventHandler((event) => {
  const { status } = getQuery(event)
  const db = useDb()

  const baseSql = `
    SELECT o.id, o.customer_id, o.title, o.amount, o.status, o.created_at,
           c.name AS customer_name
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
  `

  if (status === undefined || status === '') {
    return { orders: db.prepare(`${baseSql} ORDER BY o.id`).all() as unknown as OrderWithCustomer[] }
  }

  // 参数校验：不在白名单里就直接 400，别把用户输入拼进 SQL 之后再后悔
  if (!ORDER_STATUS_VALUES.includes(status as OrderStatus)) {
    throw badRequest(`status 只能是 ${ORDER_STATUS_VALUES.join(' / ')} 之一，收到的是「${status}」`)
  }

  const orders = db
    .prepare(`${baseSql} WHERE o.status = ? ORDER BY o.id`)
    .all(status as string) as unknown as OrderWithCustomer[]

  return { orders }
})
