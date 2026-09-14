# nuxt-admin-demo

Nuxt 4 + Element Plus + `node:sqlite` 的**内部管理台形状**教学演示。

载体是管理台，目标是教学：宁可一个页面讲透一个特征，也不为功能齐全铺面积。

## 快速开始

```bash
npm install
npm run dev          # http://localhost:3000
# 演示账号：admin / demo1234
```

Docker：

```bash
docker compose up --build
```

## 8 个特征分别在哪儿看

| # | 特征 | 看这里 |
|---|---|---|
| 1 | Nitro server routes | `server/api/**`；页面里没有一个 `$fetch` 是直连数据库的 |
| 2 | Route middleware | `app/middleware/auth.global.ts`——用白名单而不是黑名单，新页面默认就是要登录 |
| 3 | `useState` | `app/composables/useAuth.ts`——SSR 解析出的身份要交给客户端水合，否则会闪回登录页 |
| 4 | `useAsyncData` | `app/pages/customers/index.vue`（前端过滤 + `refresh()` 写后失效）与 `app/pages/orders.vue`（`watch` 触发重新取数） |
| 5 | Cookie 会话 | `server/api/login.post.ts` 写 cookie，`server/utils/session.ts` 管会话 |
| 6 | 动态路由 + 布局 | `app/pages/customers/[id].vue` + `app/layouts/default.vue` / `blank.vue` |
| 7 | `runtimeConfig` | `nuxt.config.ts` 的 `dbPath` / `resetDb`，运行时由 `NUXT_DB_PATH` / `NUXT_RESET_DB` 覆盖 |
| 8 | `createError` + `error.vue` | 删除有订单的客户 → 409 且话能读懂（`server/api/customers/[id].delete.ts`）；客户不存在 → 整页 `error.vue` |

## 验收（4 条，手工执行）

### A1 —— 未登录被挡回登录页

```bash
curl -i http://localhost:3000/customers
# 期望：HTTP/1.1 302，Location: /login?redirect=%2Fcustomers
```

### A2 —— 首屏 HTML 里真的有数据（SSR 生效的唯一证据）

```bash
curl -s -c /tmp/sid.txt -H 'content-type: application/json' \
  -d '{"username":"admin","password":"demo1234"}' \
  http://localhost:3000/api/login

curl -s -b /tmp/sid.txt http://localhost:3000/customers | grep -o '张三'
# 期望：输出 张三
```

> 关键点：A1 与 A2 一开始是互相矛盾的——不带 cookie 的 `curl` 只会拿到 302。
> 所以 A2 必须先用 `/api/login` 换一个会话 cookie 再请求。

### A3 —— 新增后列表立刻更新

浏览器里在 `/customers` 点「新增客户」填名字保存，列表应立刻出现新行，**不需要手动刷新页面**。

也可以先用接口验证写路径：

```bash
curl -s -b /tmp/sid.txt -H 'content-type: application/json' \
  -d '{"name":"验收客户","company":"测试公司"}' \
  http://localhost:3000/api/customers
# 期望：201，返回带 id 和 created_at 的整行
```

### A4 —— 删除的两种结果

```bash
# 张三（id=1，种子里有 3 条订单）→ 期望 409 且提示「还有 3 条订单，不能删除」
curl -i -b /tmp/sid.txt -X DELETE http://localhost:3000/api/customers/1

# 吴十（id=8，种子里 0 条订单）→ 期望 200 {"ok":true}
curl -i -b /tmp/sid.txt -X DELETE http://localhost:3000/api/customers/8
```

id=8 是**对照组**：没有它，A4 只证明了「会报错」，没证明「不是永远报错」。

## 数据模型

```sql
customers(id, name, company, phone, email, created_at)

orders(id, customer_id → customers.id, title, amount, status, created_at)
-- status ∈ ('pending','paid','cancelled')
```

种子固定 8 个客户 / 20 条订单，刻意安排：

- **张三（id=1）有 3 条订单** → 删除被拒绝的用例
- **吴十（id=8）有 0 条订单** → 删除成功的对照组

## 环境变量

| 变量 | 默认 | 说明 |
|---|---|---|
| `NUXT_DB_PATH` | `./data/demo.db` | SQLite 文件路径 |
| `NUXT_RESET_DB` | `true` | `true` = 每次启动重建表并写种子（选项 R） |
| `NUXT_SESSION_SECRET` | 无 | **没有这个变量**，见下方说明 |
| `NODE_OPTIONS` | — | 加 `--disable-warning=ExperimentalWarning` 可消掉 `node:sqlite` 的警告 |

## 与原计划的三处偏离（都有理由）

1. **计划里的 `sessionSecret` 没有实现。** 会话值是 32 字节随机串，不可猜，给它再加一层 HMAC 签名不增加任何安全性，只是为了「配置项齐全」而存在——这正是当初说的「为了演示而硬塞」。
2. **多了一个 `/` 重定向页。** 计划里只写了 4 个路由，但总要处理有人直接打开根路径的情况，`app/pages/index.vue` 只做一次 `navigateTo`。
3. **`app/pages/customers/index.vue` 增加了「编辑」。** 计划的 F1 写了「新增、编辑、删除」，而 P2 只列了「新建 + 删除」，两处不一致；按 F1 实现，因为它多花的代价很小（复用同一个弹窗）。

## 明确不做（17 条，来自计划的「不做」清单）

员工分角色权限、审计日志、软删除、导出 Excel、订单状态流转历史、多租户、国际化、暗色主题、自动化测试、CI、CSRF 防护、登录失败限速、schema 迁移框架、数据卷持久化、ORM、索引与 SQL 分页优化、移动端适配。

## 已知风险（不是免责声明，是真的会发生的事）

1. **`node:sqlite` 仍是 experimental**：Node 大版本升级可能破坏它。选它是为了换取零原生编译（Docker 里不用装 python3/gcc），代价就是这个。
2. **会话在内存里**：服务器重启即登出。选它是为了让表数量保持 2 张；生产环境必须落库，否则多实例下 A 机器登录 B 机器不认。
3. **演示账号写死在 `server/utils/session.ts`**：固定盐、单账号、无锁定、无改密。这是「够用的演示写法」，不是生产写法。
4. **单写者 + 同步驱动**：`node:sqlite` 是同步 API，会阻塞事件循环。1 个人用没问题，几十个人并发就要推倒重来。
5. **A3/A4 的界面部分只能手工点**：自动化测试被砍掉了，所以「列表立刻更新」这件事没有回归保护，改动 `refresh()` 之后没人会告诉你坏了。
