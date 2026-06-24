## Why

GSC/GA4 OAuth 认证完成后，`IntegrationsPanel` 重新 fetch 站点数据，浏览器因 `stale-while-revalidate=60` 直接返回旧缓存（`gscConnections` 为空），导致 UI 仍显示"未连接"状态。用户需要手动刷新页面才能看到认证成功的结果，体验断裂。

## What Changes

- 将 `GET /api/dashboard/sites/[siteId]` 响应头由 `private, max-age=0, s-maxage=30, stale-while-revalidate=60` 改为 `no-store`。仪表盘私有数据，实时性优先，不应被任何缓存层持有。

## Capabilities

### New Capabilities

无新能力引入。

### Modified Capabilities

无 spec 级别的行为变更——这是一个纯粹的 HTTP 缓存策略 bug fix，不影响接口契约或用户可见功能规格。

## Impact

- **文件**：`src/app/api/dashboard/sites/[siteId]/route.ts`（第 31–35 行 GET handler 返回处）
- **范围**：仅影响 `GET /api/dashboard/sites/[siteId]` 响应头，不涉及数据结构或逻辑
- **受益场景**：GSC 认证回调、GA4 认证回调、以及任何 OAuth 授权后需要立即反映新连接状态的场景
- **无破坏性变更**：移除缓存头不影响 API 契约；浏览器/CDN 只是不再缓存该响应
