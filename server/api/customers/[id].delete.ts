/**
 * 删除客户 —— 特征 8 的主要载体。
 *
 * 这里的顺序是刻意的：先自己数一遍订单，再删。
 * 如果直接删、只靠外键约束兜底，用户看到的是数据库的错误（外键约束失败），
 * 那是给开发者看的，不是给用业务的人看的。
 *
 * 所以：先查订单 → 给出「还有 3 条订单」这种能读懂的话；
 * 外键约束仍然保留为最后一道防线（并发下先查后删之间可能被插入订单）。
 */
export default defineEventHandler(async (event) => {
  const id = requireIdParam(event)

  const customer = await getCustomer(id)

  if (!customer) {
    throw apiError(404, 'CUSTOMER_NOT_FOUND', `客户 #${id} 不存在`)
  }

  const count = await countOrdersByCustomer(id)

  if (count > 0) {
    throw apiError(409, 'CUSTOMER_HAS_ORDERS', `客户「${customer.name}」还有 ${count} 条订单，不能删除`, {
      orderCount: count,
    })
  }

  try {
    await deleteCustomer(id)
  } catch (error) {
    // 787 = SQLITE_CONSTRAINT_FOREIGNKEY（见 server/utils/db.ts 的说明）
    if (isForeignKeyViolation(error)) {
      throw apiError(409, 'CUSTOMER_HAS_ORDERS', `客户「${customer.name}」仍被订单引用，不能删除`)
    }
    throw error
  }

  return { ok: true }
})
