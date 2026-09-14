
/**
 * 客户详情 + 该客户的订单（特征 6：动态路由背后的接口）。
 *
 * 一次请求返回两份数据，页面就只需要一次 useAsyncData，
 * 不用等客户回来了再发第二个请求 —— 少一次串行等待。
 */
export default defineEventHandler(async (event) => {
  const id = requireIdParam(event)
  const customer = await getCustomer(id)

  if (!customer) {
    // 这个 404 会被页面接住并交给 error.vue（特征 8）
    throw apiError(404, 'CUSTOMER_NOT_FOUND', `客户 #${id} 不存在`)
  }

  const orders = await listOrdersByCustomer(id)

  return { customer, orders }
})
