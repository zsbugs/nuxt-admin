
/**
 * 修改客户。与新增共用同一套校验函数。
 */
export default defineEventHandler(async (event) => {
  const id = requireIdParam(event)
  const body = await readBody(event)

  const name = requireNonEmptyString(body?.name, '客户名称', 50)
  const company = optionalString(body?.company, '公司', 80)
  const phone = optionalString(body?.phone, '电话', 30)
  const email = optionalEmail(body?.email)

  const customer = await updateCustomer(id, { name, company, phone, email })

  if (!customer) {
    throw apiError(404, 'CUSTOMER_NOT_FOUND', `客户 #${id} 不存在`)
  }

  return { customer }
})
