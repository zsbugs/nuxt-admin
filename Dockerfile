# ---- 构建阶段 ----
FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- 运行阶段 ----
# 用 node:sqlite 的回报就在这里：没有原生模块，不需要 python3/gcc/make，
# 运行镜像里也不用带着 node_modules，只拷 .output 就够了。
FROM node:24-alpine
WORKDIR /app

ENV NODE_ENV=production \
    NODE_OPTIONS=--disable-warning=ExperimentalWarning \
    NUXT_DB_PATH=/app/data/demo.db \
    NUXT_RESET_DB=true \
    PORT=3000

COPY --from=build /app/.output ./.output

EXPOSE 3000

# 选 R（每次启动重置数据），所以这里不需要数据卷：
# 数据库文件随容器生命周期存在，容器一重建就回到固定种子。
CMD ["node", ".output/server/index.mjs"]
