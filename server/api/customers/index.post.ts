
/**
 * 新增客户。
 *
 * created_at 由存储层生成并返回，前端不必自己拼时间戳。
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const name = requireNonEmptyString(body?.name, '客户名称', 50)
  const company = optionalString(body?.company, '公司', 80)
  const phone = optionalString(body?.phone, '电话', 30)
  const email = optionalEmail(body?.email)

  const customer = await createCustomer({ name, company, phone, email })

  // 201：确实创建了资源。前端不依赖这个状态码，但它是 API 该有的样子
  setResponseStatus(event, 201)
  return { customer }
})
