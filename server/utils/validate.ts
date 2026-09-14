/**
 * 请求体校验（特征 8 的一半）。
 *
 * 手写而不是引 zod：这个项目一共就 4 个字段要校验，
 * 引一个校验库会让读者多爬一层抽象，而收益为零。
 * 真需要复杂校验时再换来，那时引库才有意义。
 */
import type { H3Event } from 'h3'

/** 构造一个带业务错误码的 h3 错误；客户端靠 data.code 区分「哪种错」 */
export function apiError(
  statusCode: number,
  code: string,
  message: string,
  extra: Record<string, unknown> = {},
) {
  return createError({
    statusCode,
    // 长文案放 message 而不是 statusMessage：
    // h3 会打警告说 statusMessage 以后默认会被净化，它本来就是给「简短状态描述」用的
    message,
    // 同时把错误码放进 data，客户端就不必去解析文案来分辨错误类型
    data: { code, message, ...extra },
  })
}

export function badRequest(message: string) {
  return apiError(400, 'VALIDATION_FAILED', message)
}

export function requireNonEmptyString(value: unknown, field: string, maxLength = 50): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw badRequest(`${field}不能为空`)
  }
  const trimmed = value.trim()
  if (trimmed.length > maxLength) {
    throw badRequest(`${field}长度不能超过 ${maxLength} 个字符`)
  }
  return trimmed
}

export function optionalString(value: unknown, field: string, maxLength = 80): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') {
    throw badRequest(`${field}格式不正确`)
  }
  const trimmed = value.trim()
  if (trimmed === '') return null
  if (trimmed.length > maxLength) {
    throw badRequest(`${field}长度不能超过 ${maxLength} 个字符`)
  }
  return trimmed
}

export function optionalEmail(value: unknown): string | null {
  const email = optionalString(value, '邮箱', 120)
  if (email === null) return null
  // 校验故意放松：演示里用正则去追求「完全正确的邮箱」是自欺欺人
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw badRequest('邮箱格式不正确')
  }
  return email
}

/** 路由参数里的 id 必须是正整数，否则连 SQL 都不用执行 */
export function requireIdParam(event: H3Event): number {
  const raw = getRouterParam(event, 'id')
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) {
    throw badRequest(`id 必须是正整数，收到的是「${raw ?? ''}」`)
  }
  return id
}
