## 1. 修复 API 缓存头

- [x] 1.1 将 `src/app/api/dashboard/sites/[siteId]/route.ts` GET handler 的 `Cache-Control` 响应头由 `private, max-age=0, s-maxage=30, stale-while-revalidate=60` 改为 `no-store`

## 2. 验证

- [x] 2.1 本地走一遍 GSC 或 GA4 OAuth 完整流程，确认回调后 IntegrationsPanel 立即显示"已连接"状态，无需手动刷新
- [x] 2.2 用浏览器 DevTools Network 面板确认 `GET /api/dashboard/sites/[siteId]` 响应头包含 `cache-control: no-store`
