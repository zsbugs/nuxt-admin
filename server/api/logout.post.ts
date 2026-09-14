/**
 * 退出登录：把服务端会话删掉，同时让浏览器丢掉 cookie。
 */
export default defineEventHandler((event) => {
  destroySession(getCookie(event, SESSION_COOKIE))
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
  return { ok: true }
})
