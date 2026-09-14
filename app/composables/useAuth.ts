import type { SessionUser } from '~~/shared/types'

/**
 * 当前登录用户（特征 3：useState）。
 *
 * 为什么必须是 useState 而不是普通的 ref：
 * 全局 middleware 在 SSR 阶段解析出「你是谁」，
 * 这个结果必须跟着首屏 HTML 一起送到浏览器，客户端水合时才能直接复用。
 * 如果用普通模块级 ref，SSR 和客户端是两份内存，会出现
 * 「服务端渲染出的是已登录页面，客户端一水合却认为没登录，闪一下登录页」。
 */
export function useAuthUser() {
  return useState<SessionUser | null>('auth-user', () => null)
}

/**
 * 是否已经问过 /api/me。
 *
 * 需要这个标记是因为「还没问」和「问过了，没登录」是两件事，
 * 只看 user === null 分不清，middleware 就会在每次客户端导航时重复请求。
 * SSR 每个请求都是新的 state（false），客户端水合后复用首屏的结果（true）。
 */
export function useAuthLoaded() {
  return useState<boolean>('auth-loaded', () => false)
}

/**
 * 向 /api/me 要当前用户。
 *
 * 用 useRequestFetch 而不是 $fetch：SSR 期间这次请求发生在服务器内部，
 * 必须把浏览器带来的 cookie 显式转发过去，否则 /api/me 永远看到「没登录」，
 * 表现就是「明明登录了，刷新页面就被弹回登录页」。
 *
 * 注意：所有 Nuxt 组合函数都在 await 之前取完。
 * 在嵌套的异步函数里，await 之后再调 useState 会丢掉 Nuxt 上下文，
 * 报 NUXT_E1001「composable called outside of ...」。这是实测踩出来的，不是洁癖。
 */
export async function refreshAuthUser() {
  const user = useAuthUser()
  const loaded = useAuthLoaded()
  const requestFetch = useRequestFetch()

  const data = await requestFetch<{ user: SessionUser | null }>('/api/me')

  user.value = data.user
  loaded.value = true

  return user.value
}

/** 退出登录：清服务端会话 + 清前端状态 */
export async function logoutUser() {
  const user = useAuthUser()
  const loaded = useAuthLoaded()

  await $fetch('/api/logout', { method: 'POST' })

  user.value = null
  loaded.value = true
}
