import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

/**
 * 会话（特征 5 的服务端那一半）。
 *
 * 这里用进程内的 Map，而不是数据库表 —— 这是计划里选项 X 的决定：
 * 表数量保持 2 张，代价是「服务器重启即登出」。
 * 对一个每次启动都会重置数据库的演示应用来说，这个代价是零。
 *
 * 生产环境必须落库（否则多实例部署时 A 机器登录、B 机器不认），
 * 这条已经写进 README 的「不做清单」。
 *
 * 值本身是 32 字节随机串，猜不出来，所以不需要再签名 ——
 * 往 cookie 里塞 HMAC 在这种设计下只是仪式感，不增加安全性。
 *
 * 名字带 ByToken 是必须的：h3 自己就导出一个 getSession（web crypto 会话），
 * 而 Nitro 会把 server/utils 里的东西自动导入，同名会撞车并打警告。
 */

interface Session {
  username: string
  expiresAt: number
}

export const SESSION_COOKIE = 'sid'

const SESSION_TTL_MS = 1000 * 60 * 60 * 8 // 8 小时

const sessions = new Map<string, Session>()

/**
 * 演示账号写死在代码里（选项 X 的代价，已在计划里认下）。
 * 口令不存明文，只存 scrypt 哈希；比对用 timingSafeEqual 避免时序侧信道。
 *
 * 注意：这是「够用的演示写法」，不是生产写法 ——
 * 固定盐、单账号、无锁定、无改密，都是被有意砍掉的东西。
 */
const DEMO_USERNAME = 'admin'
const DEMO_SALT = 'nuxt-admin-demo-salt'
const DEMO_PASSWORD_HASH = scryptSync('demo1234', DEMO_SALT, 32)

export function verifyCredentials(username: string, password: string): boolean {
  if (username !== DEMO_USERNAME) return false
  const input = scryptSync(password, DEMO_SALT, 32)
  return timingSafeEqual(input, DEMO_PASSWORD_HASH)
}

export function createSession(username: string): { token: string; maxAge: number } {
  const token = randomBytes(32).toString('hex')
  sessions.set(token, { username, expiresAt: Date.now() + SESSION_TTL_MS })
  return { token, maxAge: Math.floor(SESSION_TTL_MS / 1000) }
}

/** 取会话；顺手清掉过期的，省得演示久了内存里堆一堆死数据 */
export function getSessionByToken(token: string | undefined): Session | null {
  if (!token) return null

  const session = sessions.get(token)
  if (!session) return null

  if (session.expiresAt < Date.now()) {
    sessions.delete(token)
    return null
  }
  return session
}

export function destroySession(token: string | undefined): void {
  if (token) sessions.delete(token)
}
