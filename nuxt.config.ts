export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',

  // 特征 6 的另一半：Element Plus 通过 Nuxt 模块接入，
  // 组件与样式都由模块处理，不需要在每个页面手动 import
  modules: ['@element-plus/nuxt'],

  css: ['~/assets/css/main.css'],

  // Nitro 当前版本未将 Node 24 列入自动检测范围，需为 Vercel Function 显式指定运行时
  nitro: {
    vercel: {
      functions: {
        runtime: 'nodejs24.x',
      },
    },
  },

  // 特征 7：runtimeConfig。
  // 这里的默认值只在开发时用；运行时由环境变量 NUXT_DB_PATH / NUXT_RESET_DB 覆盖（Docker 负责注入）
  runtimeConfig: {
    // SQLite 数据库文件路径（相对路径以启动时的工作目录为基准）
    // Vercel 运行时会在 server/utils/db.ts 中自动改用内存数据库
    dbPath: './data/demo.db',
    // 选项 R：每次服务器启动都重建表并写入固定种子，保证验收可重复
    // 设为 false 可保留上次的数据（此时需要外部提供持久化的 dbPath）
    resetDb: true,
  },
})
