import type { Customer } from '~~/shared/types'

/**
 * 新增客户。
 *
 * created_at 交给建表时的 DEFAULT (datetime('now'))，再用 RETURNING 把整行拿回来 ——
 * 这样前端不必自己拼一个时间戳，也不必事后多发一次查询（RETURNING 已实测可用）。
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const name = requireNonEmptyString(body?.name, '客户名称', 50)
  const company = optionalString(body?.company, '公司', 80)
  const phone = optionalString(body?.phone, '电话', 30)
  const email = optionalEmail(body?.email)

  const customer = useDb()
    .prepare(
      `INSERT INTO customers (name, company, phone, email)
       VALUES (?, ?, ?, ?)
       RETURNING id, name, company, phone, email, created_at`,
    )
    .get(name, company, phone, email) as unknown as Customer

  // 201：确实创建了资源。前端不依赖这个状态码，但它是 API 该有的样子
  setResponseStatus(event, 201)
  return { customer }
})
