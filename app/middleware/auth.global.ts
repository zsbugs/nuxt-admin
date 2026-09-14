/**
 * 全局路由中间件（特征 2）。
 *
 * 为什么用 global 而不是给每个页面挂具名中间件：
 * 管理台的默认语义是「全部要登录」，用白名单表达这件事只需要读一处，
 * 反过来说，忘记给新页面挂中间件是这类项目最常见的安全漏洞 ——
 * 默认拒绝 + 白名单能让这个错误不可能发生。
 */
const PUBLIC_PATHS = ['/login']

export default defineNuxtRouteMiddleware(async (to) => {
  if (PUBLIC_PATHS.includes(to.path)) return

  // 组合函数在 await 之前先取好（原因见 useAuth.ts 里的注释）
  const user = useAuthUser()
  const loaded = useAuthLoaded()

  // SSR 阶段每个请求只问一次 /api/me；客户端导航复用 useState 里的结果
  if (!loaded.value) {
    await refreshAuthUser()
  }

  if (!user.value) {
    // 带上原目标地址，登录后能跳回去
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
