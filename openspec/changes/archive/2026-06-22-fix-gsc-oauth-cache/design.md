## Context

`GET /api/dashboard/sites/[siteId]` 是 `IntegrationsPanel` 加载站点数据（包括 `gscConnections`、`ga4Connections`）的唯一数据源。当前响应头为：

```
Cache-Control: private, max-age=0, s-maxage=30, stale-while-revalidate=60
```

`stale-while-revalidate=60` 表示：当浏览器有旧缓存时，立即返回旧数据，同时后台发起重新验证。OAuth 回调后页面重新挂载，`IntegrationsPanel` 的 `fetchData()` 拿到的是 **授权前的旧缓存**（`gscConnections: []`），UI 因此显示"未连接"。

受影响文件：`src/app/api/dashboard/sites/[siteId]/route.ts`（GET handler，约第 31 行）。

## Goals / Non-Goals

**Goals:**
- OAuth 回调后，`IntegrationsPanel` 立即显示最新连接状态，无需用户手动刷新
- 修复对 GSC 和 GA4 均生效

**Non-Goals:**
- 不改动 OAuth 流程本身（`gsc-sync/auth`、`google-callback` 路由）
- 不改动前端组件逻辑
- 不引入乐观更新或 WebSocket 实时推送
- 不改变 API 的数据结构或鉴权逻辑

## Decisions

**决策：将 Cache-Control 改为 `no-store`**

选项对比：

| 方案 | 说明 | 结论 |
|------|------|------|
| `no-store` | 完全禁止缓存，每次请求都走服务器 | ✅ 选用 |
| `no-cache` | 每次必须重新验证（304 可复用响应体） | 也可行，但仪表盘私有数据无需 304 优化 |
| `private, max-age=0`（移除 `stale-while-revalidate`） | 移除问题指令而不完全禁缓存 | 过于保守，`private` 本不应搭配 `s-maxage` |
| 保留缓存 + 前端 `cache: 'no-store'` fetch | 在 `fetchData` 加 `{ cache: 'no-store' }` | 治标不治本，其他消费方可能仍被缓存影响 |

`no-store` 语义最清晰：这是用户私有、状态敏感的 API，每次调用都应反映 DB 真实状态。仪表盘不是高频公共接口，没有缓存收益。

## Risks / Trade-offs

- **轻微性能退化**：移除缓存后每次 fetch 都打到服务器/DB。该接口查询简单（单条 `findUnique` + `include`），在 VPS PG 延迟下影响可忽略不计（< 50ms）。
- **无回滚风险**：这是响应头变更，不影响数据逻辑，可随时还原。
