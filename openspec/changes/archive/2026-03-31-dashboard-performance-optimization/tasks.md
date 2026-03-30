## 1. Session Cookie Cache

- [x] 1.1 查阅 better-auth 文档确认 `cookieCache` 与 `emailOTP` 插件无冲突
- [x] 1.2 在 `src/lib/auth.ts` 的 `betterAuth()` 配置中添加 `session.cookieCache: { enabled: true, maxAge: 60 * 5 }`
- [ ] 1.3 本地启动开发服务，登录后检查 Network 面板确认 session 验证请求不再查询数据库（Prisma 日志应无 session 相关 SELECT）
- [ ] 1.4 确认登出后 cookie 被正确清除，再次访问 `/dashboard` 被重定向到登录页

## 2. 服务端查询缓存 — getSiteById

- [x] 2.1 在 `src/lib/site-intelligence/sites.ts` 中，用 `unstable_cache` 包装 `getSiteById`，设置 `tags: ['site-${siteId}']`，`revalidate: 60`
- [x] 2.2 从 `sites.ts` 导出 `revalidateSiteCache(siteId: string)` 辅助函数，内部调用 `revalidateTag('site-${siteId}')`
- [x] 2.3 找出所有修改站点数据的写操作入口（站点更新、GSC/GA4 连接保存等），在操作成功后调用 `revalidateSiteCache(siteId)`
- [ ] 2.4 验证：在开发环境访问 `/dashboard/site-intelligence/[siteId]`，Prisma 日志中 `getSiteById` 的 SELECT 应只出现一次（不再重复两次）

## 3. 服务端查询缓存 — getUserData

- [x] 3.1 在 `src/app/(protected)/dashboard/page.tsx` 中，将 `getUserData` 函数用 `unstable_cache` 包装，设置 `tags: ['user-${userId}']`，`revalidate: 30`
- [x] 3.2 梳理所有会改变用户 credits 的路径：`api/webhooks/creem`、`api/skills/execute`、credits refund action —— 在每处成功操作后添加 `revalidateTag('user-${userId}')`
- [x] 3.3 验证：dashboard 首页刷新两次，Prisma 日志中 8 个并行查询在 30 秒内只出现一次

## 4. API 路由 HTTP 缓存头

- [x] 4.1 在 `src/app/api/dashboard/sites/[siteId]/audits/route.ts` 的 GET 响应中添加 `Cache-Control: private, max-age=60, stale-while-revalidate=120`
- [x] 4.2 在 `src/app/api/dashboard/sites/[siteId]/competitors/route.ts` 的 GET 响应中添加 `Cache-Control: private, max-age=120, stale-while-revalidate=240`
- [x] 4.3 在 `src/app/api/dashboard/sites/[siteId]/semantic-gap/route.ts` 的 GET 响应中添加 `Cache-Control: private, max-age=300, stale-while-revalidate=600`
- [x] 4.4 在 `src/app/api/dashboard/sites/[siteId]/strategy/route.ts` 的 GET 响应中添加 `Cache-Control: private, max-age=60, stale-while-revalidate=120`
- [x] 4.5 验证：在浏览器 Network 面板打开 DevTools，切换 tab 后返回，确认相关 API 请求显示 `(disk cache)` 或 `304 Not Modified`

## 5. 验证与回归测试

- [x] 5.1 完整走一遍后台导航：登录 → dashboard → site-intelligence → 切换各 tab → 返回首页，确认无功能异常
- [x] 5.2 测试登出/重新登录流程，确认 session 缓存不影响认证正确性
- [x] 5.3 触发一次站点数据更新，确认缓存失效后页面显示最新数据（不超过 60 秒延迟）
- [x] 5.4 触发一次 AI 技能消耗 credits，确认 dashboard 首页在下次加载时显示正确余额
- [x] 5.5 使用浏览器 DevTools Performance 面板或 Vercel Speed Insights 对比优化前后首屏 TTFB
