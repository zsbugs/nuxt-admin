import type { DatabaseSync } from 'node:sqlite'
import type { OrderStatus } from '~~/shared/types'

/**
 * 固定种子数据（不是随机生成）。
 *
 * 为什么必须固定：验收 A3/A4 要断言「某一行出现/消失」，
 * 随机数据会让断言没法写死，也就没法判断失败是功能坏了还是运气不好。
 *
 * 两个刻意安排：
 *   - 张三（id=1）有 3 条订单 → A4 的「删除被拒绝」用例
 *   - 吴十（id=8）有 0 条订单 → A4 的对照组，验证「该成功时确实能成功」
 *     没有对照组，A4 只证明了「会报错」，没证明「不是永远报错」
 */

interface SeedCustomer {
  id: number
  name: string
  company: string
  phone: string
  email: string
  createdAt: string
}

interface SeedOrder {
  id: number
  customerId: number
  title: string
  amount: number
  status: OrderStatus
  createdAt: string
}

const CUSTOMERS: SeedCustomer[] = [
  { id: 1, name: '张三', company: '北京云杉科技有限公司', phone: '13800000001', email: 'zhangsan@example.com', createdAt: '2026-08-01 09:12:00' },
  { id: 2, name: '李四', company: '上海衡石贸易有限公司', phone: '13800000002', email: 'lisi@example.com', createdAt: '2026-08-02 10:03:00' },
  { id: 3, name: '王五', company: '深圳蓝湾电子有限公司', phone: '13800000003', email: 'wangwu@example.com', createdAt: '2026-08-03 11:20:00' },
  { id: 4, name: '赵六', company: '杭州明远网络有限公司', phone: '13800000004', email: 'zhaoliu@example.com', createdAt: '2026-08-05 14:41:00' },
  { id: 5, name: '钱七', company: '成都青柚文化传播', phone: '13800000005', email: 'qianqi@example.com', createdAt: '2026-08-07 16:05:00' },
  { id: 6, name: '孙八', company: '广州海岸物流有限公司', phone: '13800000006', email: 'sunba@example.com', createdAt: '2026-08-09 08:58:00' },
  { id: 7, name: '周九', company: '南京知微数据技术', phone: '13800000007', email: 'zhoujiu@example.com', createdAt: '2026-08-11 13:27:00' },
  { id: 8, name: '吴十', company: '西安长风机械制造', phone: '13800000008', email: 'wushi@example.com', createdAt: '2026-08-12 15:36:00' },
]

// 20 条订单，分布：张三 3、李四 3、王五 3、赵六 2、钱七 3、孙八 2、周九 4、吴十 0
const ORDERS: SeedOrder[] = [
  { id: 1, customerId: 1, title: '云服务器年费', amount: 8600.0, status: 'paid', createdAt: '2026-08-03 09:00:00' },
  { id: 2, customerId: 1, title: '技术咨询（2 天）', amount: 5000.5, status: 'pending', createdAt: '2026-08-15 10:00:00' },
  { id: 3, customerId: 1, title: '上门部署', amount: 1200.0, status: 'cancelled', createdAt: '2026-08-20 11:00:00' },

  { id: 4, customerId: 2, title: '数据迁移服务', amount: 15000.0, status: 'paid', createdAt: '2026-08-04 09:30:00' },
  { id: 5, customerId: 2, title: '内部培训（3 场）', amount: 6000.0, status: 'paid', createdAt: '2026-08-12 14:00:00' },
  { id: 6, customerId: 2, title: '运维支持（包月）', amount: 3000.0, status: 'pending', createdAt: '2026-08-22 10:20:00' },

  { id: 7, customerId: 3, title: '硬件采购', amount: 42000.0, status: 'paid', createdAt: '2026-08-05 09:00:00' },
  { id: 8, customerId: 3, title: '现场巡检', amount: 800.0, status: 'pending', createdAt: '2026-08-16 15:30:00' },
  { id: 9, customerId: 3, title: '备件更换', amount: 2350.75, status: 'paid', createdAt: '2026-08-24 11:45:00' },

  { id: 10, customerId: 4, title: '系统集成', amount: 28000.0, status: 'pending', createdAt: '2026-08-06 10:10:00' },
  { id: 11, customerId: 4, title: '二次开发', amount: 9600.0, status: 'cancelled', createdAt: '2026-08-18 16:00:00' },

  { id: 12, customerId: 5, title: '内容代运营', amount: 12000.0, status: 'paid', createdAt: '2026-08-07 09:05:00' },
  { id: 13, customerId: 5, title: '活动策划', amount: 7800.0, status: 'pending', createdAt: '2026-08-19 13:15:00' },
  { id: 14, customerId: 5, title: '素材制作', amount: 1500.0, status: 'paid', createdAt: '2026-08-26 09:50:00' },

  { id: 15, customerId: 6, title: '物流系统对接', amount: 18000.0, status: 'paid', createdAt: '2026-08-09 09:40:00' },
  { id: 16, customerId: 6, title: '报表定制', amount: 4500.0, status: 'pending', createdAt: '2026-08-21 14:25:00' },

  { id: 17, customerId: 7, title: '数据仓库搭建', amount: 56000.0, status: 'paid', createdAt: '2026-08-11 10:00:00' },
  { id: 18, customerId: 7, title: '算法调优', amount: 22000.0, status: 'pending', createdAt: '2026-08-17 11:10:00' },
  { id: 19, customerId: 7, title: '季度巡检', amount: 2600.0, status: 'paid', createdAt: '2026-08-23 15:00:00' },
  { id: 20, customerId: 7, title: '紧急支援', amount: 3800.0, status: 'cancelled', createdAt: '2026-08-27 08:30:00' },
]

/** 在一个事务里写入种子数据；任何一条失败就整体回滚，不留半份数据 */
export function seedFixedData(db: DatabaseSync): void {
  const insertCustomer = db.prepare(
    'INSERT INTO customers (id, name, company, phone, email, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  )
  const insertOrder = db.prepare(
    'INSERT INTO orders (id, customer_id, title, amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  )

  db.exec('BEGIN')
  try {
    for (const c of CUSTOMERS) {
      insertCustomer.run(c.id, c.name, c.company, c.phone, c.email, c.createdAt)
    }
    for (const o of ORDERS) {
      insertOrder.run(o.id, o.customerId, o.title, o.amount, o.status, o.createdAt)
    }
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}
