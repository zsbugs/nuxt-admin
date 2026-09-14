import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { Customer, Order, OrderStatus, OrderWithCustomer } from '~~/shared/types'
import { SEED_CUSTOMERS, SEED_ORDERS } from './seed'

type SqliteDatabase = import('node:sqlite').DatabaseSync

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

interface MemoryData {
  customers: Customer[]
  orders: Order[]
}

export interface CustomerInput {
  name: string
  company: string | null
  phone: string | null
  email: string | null
}

let sqlite: SqliteDatabase | null = null
let memory: MemoryData | null = null

function supportsNodeSqlite(): boolean {
  const [major, minor] = process.versions.node.split('.').map(Number)
  return major > 22 || (major === 22 && minor >= 13)
}

function cloneCustomer(customer: Customer): Customer {
  return { ...customer }
}

function cloneOrder(order: Order): Order {
  return { ...order }
}

function sqlTimestamp(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function initMemory(): void {
  memory = {
    customers: SEED_CUSTOMERS.map((customer) => ({
      id: customer.id,
      name: customer.name,
      company: customer.company,
      phone: customer.phone,
      email: customer.email,
      created_at: customer.createdAt,
    })),
    orders: SEED_ORDERS.map((order) => ({
      id: order.id,
      customer_id: order.customerId,
      title: order.title,
      amount: order.amount,
      status: order.status,
      created_at: order.createdAt,
    })),
  }
}

function seedSqlite(db: SqliteDatabase): void {
  const insertCustomer = db.prepare(
    'INSERT INTO customers (id, name, company, phone, email, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  )
  const insertOrder = db.prepare(
    'INSERT INTO orders (id, customer_id, title, amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  )

  db.exec('BEGIN')
  try {
    for (const customer of SEED_CUSTOMERS) {
      insertCustomer.run(
        customer.id,
        customer.name,
        customer.company,
        customer.phone,
        customer.email,
        customer.createdAt,
      )
    }
    for (const order of SEED_ORDERS) {
      insertOrder.run(order.id, order.customerId, order.title, order.amount, order.status, order.createdAt)
    }
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

async function initSqlite(): Promise<void> {
  const config = useRuntimeConfig()
  const isVercelRuntime = Boolean(process.env.VERCEL) || process.cwd() === '/var/task'
  const useMemoryDb = config.dbPath === ':memory:' || (isVercelRuntime && !process.env.NUXT_DB_PATH)
  const file = useMemoryDb ? ':memory:' : resolve(process.cwd(), config.dbPath)

  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true })

  const { DatabaseSync } = await import('node:sqlite')
  const db = new DatabaseSync(file)
  sqlite = db

  if (file !== ':memory:') db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA foreign_keys = ON')

  if (!config.resetDb) {
    const existing = db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('customers', 'orders')`)
      .all()
    if (existing.length === 2) return
  }

  db.exec('DROP TABLE IF EXISTS orders')
  db.exec('DROP TABLE IF EXISTS customers')
  db.exec(SCHEMA)
  seedSqlite(db)
}

export async function initDb(): Promise<void> {
  if (sqlite || memory) return

  if (process.env.NUXT_DB_DRIVER === 'memory' || !supportsNodeSqlite()) {
    initMemory()
    return
  }

  await initSqlite()
}

async function ensureDb(): Promise<void> {
  if (!sqlite && !memory) await initDb()
}

export async function listCustomers(): Promise<Customer[]> {
  await ensureDb()

  if (sqlite) {
    return sqlite
      .prepare('SELECT id, name, company, phone, email, created_at FROM customers ORDER BY id')
      .all() as unknown as Customer[]
  }

  return memory!.customers.map(cloneCustomer).sort((a, b) => a.id - b.id)
}

export async function getCustomer(id: number): Promise<Customer | undefined> {
  await ensureDb()

  if (sqlite) {
    return sqlite
      .prepare('SELECT id, name, company, phone, email, created_at FROM customers WHERE id = ?')
      .get(id) as unknown as Customer | undefined
  }

  const customer = memory!.customers.find((item) => item.id === id)
  return customer ? cloneCustomer(customer) : undefined
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  await ensureDb()

  if (sqlite) {
    return sqlite
      .prepare(
        `INSERT INTO customers (name, company, phone, email)
         VALUES (?, ?, ?, ?)
         RETURNING id, name, company, phone, email, created_at`,
      )
      .get(input.name, input.company, input.phone, input.email) as unknown as Customer
  }

  const id = memory!.customers.reduce((max, customer) => Math.max(max, customer.id), 0) + 1
  const customer: Customer = {
    id,
    ...input,
    created_at: sqlTimestamp(),
  }
  memory!.customers.push(customer)
  return cloneCustomer(customer)
}

export async function updateCustomer(id: number, input: CustomerInput): Promise<Customer | undefined> {
  await ensureDb()

  if (sqlite) {
    return sqlite
      .prepare(
        `UPDATE customers SET name = ?, company = ?, phone = ?, email = ?
         WHERE id = ?
         RETURNING id, name, company, phone, email, created_at`,
      )
      .get(input.name, input.company, input.phone, input.email, id) as unknown as Customer | undefined
  }

  const customer = memory!.customers.find((item) => item.id === id)
  if (!customer) return undefined

  Object.assign(customer, input)
  return cloneCustomer(customer)
}

export async function deleteCustomer(id: number): Promise<void> {
  await ensureDb()

  if (sqlite) {
    sqlite.prepare('DELETE FROM customers WHERE id = ?').run(id)
    return
  }

  const index = memory!.customers.findIndex((customer) => customer.id === id)
  if (index >= 0) memory!.customers.splice(index, 1)
}

export async function countOrdersByCustomer(customerId: number): Promise<number> {
  await ensureDb()

  if (sqlite) {
    const { count } = sqlite
      .prepare('SELECT COUNT(*) AS count FROM orders WHERE customer_id = ?')
      .get(customerId) as unknown as { count: number }
    return count
  }

  return memory!.orders.filter((order) => order.customer_id === customerId).length
}

export async function listOrders(status?: OrderStatus): Promise<OrderWithCustomer[]> {
  await ensureDb()

  if (sqlite) {
    const baseSql = `
      SELECT o.id, o.customer_id, o.title, o.amount, o.status, o.created_at,
             c.name AS customer_name
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
    `

    if (status) {
      return sqlite
        .prepare(`${baseSql} WHERE o.status = ? ORDER BY o.id`)
        .all(status) as unknown as OrderWithCustomer[]
    }

    return sqlite.prepare(`${baseSql} ORDER BY o.id`).all() as unknown as OrderWithCustomer[]
  }

  return memory!.orders
    .filter((order) => !status || order.status === status)
    .map((order) => ({
      ...cloneOrder(order),
      customer_name: memory!.customers.find((customer) => customer.id === order.customer_id)!.name,
    }))
    .sort((a, b) => a.id - b.id)
}

export async function listOrdersByCustomer(customerId: number): Promise<Order[]> {
  await ensureDb()

  if (sqlite) {
    return sqlite
      .prepare(
        `SELECT id, customer_id, title, amount, status, created_at
         FROM orders WHERE customer_id = ? ORDER BY id`,
      )
      .all(customerId) as unknown as Order[]
  }

  return memory!.orders
    .filter((order) => order.customer_id === customerId)
    .map(cloneOrder)
    .sort((a, b) => a.id - b.id)
}

/**
 * 判断是否为外键约束报错。
 *
 * node:sqlite 抛出的错误形如 { code: 'ERR_SQLITE_ERROR', errcode: 787 }。
 * 787 就是 SQLITE_CONSTRAINT_FOREIGNKEY；node:sqlite 的 constants 里并没有导出这个常量，
 * 所以只能硬编码这个数字。
 */
export function isForeignKeyViolation(error: unknown): boolean {
  const errcode = (error as { errcode?: number } | null | undefined)?.errcode
  return errcode === 787
}
