## Context

代码审查在 `unified-dashboard` 实施后发现 3 处缺陷：

**Bug 1 — Middleware 死代码**
当前 `middleware.ts` 的控制流：
```
if pathname === '/admin/setup' → return next()
if pathname === '/admin/login' → redirect /login
if pathname === '/admin'       → redirect /dashboard
if pathname.startsWith('/admin/') → redirect /dashboard/admin/*
↓
const isPathDashboard = pathname.startsWith('/dashboard')
const isPathLogin = pathname === '/login'

if (isPathApiAuth || !isPathDashboard) → return next()  // ← /login 在这里提前返回
↓
if (isPathLogin && sessionCookie) → redirect /dashboard  // ← 永远不会执行
```
`/login` 不是 `/dashboard` 开头，所以命中 `!isPathDashboard`，在第 38 行就 return 了。第 50 行的 `isPathLogin` 检查是死代码。

**Bug 2 — Role badge 只判断 ADMIN**
```tsx
// 当前（错误）
role === 'ADMIN' ? '管理员' : '普通用户'
// EDITOR 会显示"普通用户"
```

**Bug 3 — 客户端 useEffect guard**
users/skills 页面用 `useEffect` 做 role 检查，React hydration 之前页面内容已渲染，导致非 ADMIN 用户看到一帧内容后才跳转。

## Goals / Non-Goals

**Goals:**
- 已登录用户访问 `/login` 立即 redirect 到 `/dashboard`（无论角色）
- EDITOR 角色在 header 正确显示"编辑员"
- users/skills 页面的 ADMIN-only 保护改为服务端，消除闪烁

**Non-Goals:**
- 不重构 middleware 整体结构
- 不修改任何 API 路由
- 不影响其他路由的保护逻辑

## Decisions

### D1：在 middleware 提前 return 之前处理 /login 的已登录 redirect

在 `if (isPathApiAuth || !isPathDashboard)` 之前，加一段专门针对 `/login` 的处理：

```typescript
// 已登录用户访问 /login → redirect /dashboard
if (pathname === '/login' && sessionCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

这样 `/login` 在命中 `!isPathDashboard` 提前 return 之前已被截获。原来死代码的 `isPathLogin` 变量和检查可以删除（保持代码整洁）。

### D2：Route group 而非 nested layout 文件放置

ADMIN-only guard 使用 Next.js route group：在 `dashboard/admin/` 下新建 `(admin-only)/` route group，将 `users/` 和 `skills/` 移入其中。在 `(admin-only)/layout.tsx` 做服务端 ADMIN 校验。

**好处**：
- Route group 不影响 URL（`(admin-only)` 不出现在路径中），`/dashboard/admin/users` URL 保持不变
- 只有这两个页面受影响，`content/` 和 `sync/` 保持在原位由上层 `admin/layout.tsx`（ADMIN/EDITOR）保护

### D3：Role badge 用三元嵌套，不引入查找表

```tsx
// 修改后
role === 'ADMIN' ? '管理员' : role === 'EDITOR' ? '编辑员' : '普通用户'
```
改动最小，不引入额外变量或函数。

## Risks / Trade-offs

**[风险] users/skills 页面移动后路由不变但文件路径改变** → URL `/dashboard/admin/users` 不变（route group 括号不参与路由），但文件从 `admin/users/` 变为 `admin/(admin-only)/users/`。Mitigation：移动后立即测试路由可访问性。

**[Trade-off] 删除 useEffect guard vs 保留作冗余** → 选择删除。保留客户端 guard 与服务端 layout 双重检查没有额外安全价值（服务端已拦截），反而增加维护负担。

## Migration Plan

1. 修复 middleware（最高优先，影响面最小）
2. 修复 role badge（1 行改动）
3. 新建 `(admin-only)/layout.tsx`，移动 users/skills 目录，移除 useEffect guard
4. 本地验证：以 EDITOR 账号访问 `/dashboard/admin/users`，直接被 redirect 无闪烁
5. 运行 `npm run build` 确认无构建错误
