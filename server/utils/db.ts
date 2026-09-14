import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

/**
 * SQLite 连接（特征 1 的地基）。
 *
 * 用 Node 24 内置的 node:sqlite，零依赖、零原生编译 —— 这是它在 Docker 里的最大好处：
 * node:24-alpine 镜像里不需要 python/gcc/make，也就没有 better-sqlite3 的构建步骤。
 *
 * 代价（实测）：API 仍是 experimental，启动会打 ExperimentalWarning，
 * 用 NODE_OPTIONS=--disable-warning=ExperimentalWarning 消掉即可。
 *
 * 连接是模块级单例：Nitro 在同一个 Node 进程里服务所有请求，重复 new 会浪费句柄。
 */
let db: DatabaseSync | null = null

const SCHEMA = `
CREATE TABLE customers (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  company    TEXT,
  phone      TEXT,
  email      TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE orders (
  id          INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  title       TEXT NOT NULL,
  amount      REAL NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
`

/** 取数据库连接，第一次调用时建连并打开必要的 pragma */
export function useDb(): DatabaseSync {
  if (db) return db

  const config = useRuntimeConfig()
  const isVercelRuntime = Boolean(process.env.VERCEL) || process.cwd() === '/var/task'
  const useMemoryDb = config.dbPath === ':memory:' || (isVercelRuntime && !process.env.NUXT_DB_PATH)
  const file = useMemoryDb ? ':memory:' : resolve(process.cwd(), config.dbPath)

  // 目录可能还不存在（首次启动、干净的容器），先建出来
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true })

  db = new DatabaseSync(file)
  // WAL 让读写不互相阻塞；演示场景用不用都可以，这里保留是为了贴近真实用法
  if (file !== ':memory:') db.exec('PRAGMA journal_mode = WAL')
  // 外键约束默认是关的，必须显式打开 —— 否则「删除有订单的客户」不会报错，特征 8 就没了载体
  db.exec('PRAGMA foreign_keys = ON')

  return db
}

/**
 * 建表 + 写入固定种子。由 server/plugins/db.ts 在服务器启动时调用一次。
 *
 * 选项 R：每次启动都重建。这样第一次访问时的数据状态永远是已知的，
 * 验收（A1~A4）因此可重复，不会出现「昨天点过所以今天失败」的假故障。
 *
 * 也因此这里没有迁移框架：没有需要保住的旧数据，迁移就是没有意义的东西。
 * 如果哪天把 NUXT_RESET_DB 设成 false，就必须先把迁移补回来。
 */
export function initDb(): void {
  const { resetDb } = useRuntimeConfig()
  const database = useDb()

  if (!resetDb) {
    const existing = database
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('customers', 'orders')`)
      .all()
    if (existing.length === 2) return
  }

  database.exec('DROP TABLE IF EXISTS orders')
  database.exec('DROP TABLE IF EXISTS customers')
  database.exec(SCHEMA)

  seedFixedData(database)
}

/**
 * 判断是否为外键约束报错。
 *
 * node:sqlite 抛出的错误形如 { code: 'ERR_SQLITE_ERROR', errcode: 787 }。
 * 787 就是 SQLITE_CONSTRAINT_FOREIGNKEY；node:sqlite 的 constants 里并没有导出这个常量
 * （实测只有 SQLITE_CHANGESET_* 那几个），所以只能硬编码这个数字。
 */
export function isForeignKeyViolation(error: unknown): boolean {
  const errcode = (error as { errcode?: number } | null | undefined)?.errcode
  return errcode === 787
}
