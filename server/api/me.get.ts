/**
 * 当前登录用户。middleware 靠它来判断身份（特征 3 的数据来源）。
 *
 * 未登录不报错，返回 { user: null } ——
 * 因为「未登录」是一个正常状态，不是错误；报错会让客户端多一层判断。
 */
export default defineEventHandler((event) => {
  const session = getSessionByToken(getCookie(event, SESSION_COOKIE))
  return { user: session ? { username: session.username } : null }
})
