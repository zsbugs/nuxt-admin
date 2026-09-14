/**
 * 从 $fetch 抛出的错误里挖出一句能给人看的话。
 *
 * 服务端用 apiError() 返回的结构是 { statusCode, statusMessage, data: { code, message } }，
 * 这里优先读 data.message —— 它不受运行环境影响；
 * statusMessage 在不同环境下可能被替换成通用文案，只能当兜底。
 */
export function getErrorMessage(error: unknown): string {
  const err = error as
    | { statusMessage?: string; message?: string; data?: { message?: string; statusMessage?: string } }
    | null
    | undefined

  return err?.data?.message || err?.data?.statusMessage || err?.statusMessage || '请求失败，请稍后重试'
}
