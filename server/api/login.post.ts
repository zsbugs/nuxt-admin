/**
 * 登录。成功后写入 httpOnly cookie（特征 5）。
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const username = requireNonEmptyString(body?.username, '用户名', 32)
  const password = requireNonEmptyString(body?.password, '密码', 64)

  if (!verifyCredentials(username, password)) {
    // 不区分「用户不存在」和「密码错误」，避免把账号是否存在告诉对方
    throw apiError(401, 'INVALID_CREDENTIALS', '用户名或密码不正确')
  }

  const { token, maxAge } = createSession(username)

  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge,
    // 故意不开 secure：Docker 里是 http://localhost:3000，
    // 开了 secure 浏览器直接不存这个 cookie，表现就是「登录成功了但仍然被弹回登录页」
    secure: false,
  })

  return { user: { username } }
})
