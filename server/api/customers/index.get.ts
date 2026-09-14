
/**
 * 客户列表（特征 1：server route）。
 *
 * 演示数据只有 8 条，所以不做 SQL 分页、不建索引（见「不做」清单），
 * 搜索也放在前端做 —— 让这一页专心演示 useAsyncData 与写后失效。
 */
export default defineEventHandler(async () => {
  const customers = await listCustomers()

  return { customers }
})
