## Why

整个后台导航明显卡顿，经分析根本原因是：应用服务器在美国西部，数据库在 Supabase 孟买节点（RTT ~220ms/次），而 better-auth 使用 Prisma 数据库适配器，每次 `getSession()` 都触发一次数据库查询。单次页面加载产生 6-7 次 session 查询 + 5 次数据查询，累计约 2.4 秒纯网络延迟，且目前没有任何服务端缓存或 HTTP 缓存头。

## What Changes

- **Session Cookie Cache**：在 `src/lib/auth.ts` 启用 better-auth 内置的 `cookieCache`，将 session 信息加密写入 cookie，服务端直接解密验证，完全绕过数据库，将 session 验证从 6× DB 查询（~1320ms）降为 0 次
- **服务端查询缓存**：用 Next.js `unstable_cache` 包装高频 Prisma 查询（`getSiteById`、dashboard 首页聚合查询），消除同一请求周期内的重复 DB 调用，并在写操作后通过 `revalidateTag` 精准失效
- **API 路由 HTTP 缓存头**：为所有只读 API 路由（`/audits`、`/competitors`、`/semantic-gap`、`/strategy`）补充 `Cache-Control: private, max-age=N, stale-while-revalidate=M`，让浏览器缓存响应，tab 切换时无需重复请求

## Capabilities

### New Capabilities

- `session-cache`: better-auth cookieCache 配置，消除重复 session DB 查询
- `server-query-cache`: Next.js unstable_cache 包装层，服务端缓存 Prisma 查询结果并支持 tag-based 失效
- `api-http-cache`: 为各只读 API 路由补充标准 HTTP 缓存响应头

### Modified Capabilities

- `dashboard-loading-ui`: 加载链路变化影响感知速度，骨架屏触发时机可能有微调

## Impact

**代码改动**
- `src/lib/auth.ts` — 添加 `session.cookieCache` 配置
- `src/lib/site-intelligence/sites.ts` — `getSiteById` 用 `unstable_cache` 包装，添加 `revalidateTag` 导出
- `src/app/(protected)/dashboard/page.tsx` — `getUserData` 用 `unstable_cache` 包装
- `src/app/api/dashboard/sites/[siteId]/audits/route.ts` — 添加 Cache-Control 头
- `src/app/api/dashboard/sites/[siteId]/competitors/route.ts` — 添加 Cache-Control 头
- `src/app/api/dashboard/sites/[siteId]/semantic-gap/route.ts` — 添加 Cache-Control 头
- `src/app/api/dashboard/sites/[siteId]/strategy/route.ts` — 添加 Cache-Control 头

**依赖**：无新增依赖，均使用 Next.js 内置能力和 better-auth 现有配置选项

**注意事项**
- Session cookieCache 启用后，cookie 体积会略微增大（加密的 session payload）
- `unstable_cache` 是 Next.js 实验性 API，但在 Next.js 15+ 已趋于稳定
- 写操作（站点更新、审计触发等）需要调用 `revalidateTag` 保持数据一致性
