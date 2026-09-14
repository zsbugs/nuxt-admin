import type { Customer } from '~~/shared/types'

/**
 * 客户列表（特征 1：server route）。
 *
 * 演示数据只有 8 条，所以不做 SQL 分页、不建索引（见「不做」清单），
 * 搜索也放在前端做 —— 让这一页专心演示 useAsyncData 与写后失效。
 */
export default defineEventHandler(() => {
  const customers = useDb()
    .prepare('SELECT id, name, company, phone, email, created_at FROM customers ORDER BY id')
    .all() as unknown as Customer[]

  return { customers }
})
