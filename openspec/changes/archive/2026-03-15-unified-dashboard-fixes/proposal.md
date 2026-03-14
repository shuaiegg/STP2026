## Why

`unified-dashboard` 完成后的代码审查发现 3 个缺陷：1 个安全相关的 critical bug（已登录用户可以重新访问登录页），1 个 UX 信息错误（EDITOR 角色显示"普通用户"），以及 1 个会导致页面内容闪烁的服务端校验缺失。这些问题影响用户感知和系统健壮性，应在上线前修复。

## What Changes

- **CRITICAL BUG 修复**：`src/middleware.ts` 中 `/login` 路由的已登录 redirect 逻辑是死代码（提前 return 导致检查不可达）。修复后，已登录用户访问 `/login` 应被立即 redirect 到 `/dashboard`
- **UX 修复**：`src/app/(protected)/layout.tsx` header 的 role badge 只判断 `ADMIN`，EDITOR 角色错误显示"普通用户"。修复后显示"编辑员"
- **服务端 guard 优化**：`/dashboard/admin/users` 和 `/dashboard/admin/skills` 的 ADMIN-only 校验目前在客户端 `useEffect` 中执行，非 ADMIN 用户会看到一帧页面内容后才跳走（闪烁）。改为服务端 nested layout 校验，消除闪烁

## Capabilities

### New Capabilities

- `admin-only-route-guard`: ADMIN-only 服务端路由保护层（嵌套 layout），供 users/skills 页使用

### Modified Capabilities

- `unified-navigation`: role badge 显示逻辑新增 EDITOR 判断
- `admin-redirect`: middleware 的 `/login` 已登录 redirect 逻辑修复

## Impact

- `src/middleware.ts` — 修复 `/login` 已登录用户检测逻辑
- `src/app/(protected)/layout.tsx` — role badge ternary 增加 EDITOR 分支
- `src/app/(protected)/dashboard/admin/` — 新建 `admin-only/` 子目录及其 layout.tsx
- `src/app/(protected)/dashboard/admin/users/` — 移入 `admin-only/` 子目录，移除 useEffect guard
- `src/app/(protected)/dashboard/admin/skills/` — 移入 `admin-only/` 子目录，移除 useEffect guard
