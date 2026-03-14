## 1. 修复 Middleware Login Redirect 死代码

- [x] 1.1 在 `src/middleware.ts` 中，在 `/admin/*` redirect 规则之后、`const isPathDashboard` 声明之前，添加：`if (pathname === '/login' && sessionCookie) return NextResponse.redirect(new URL('/dashboard', request.url))`
- [x] 1.2 删除 `middleware.ts` 中已无用的 `isPathLogin` 变量及其相关的 `if (isPathLogin && sessionCookie)` 检查（原死代码）
- [ ] 1.3 验证：以已登录身份直接访问 `/login`，确认被 redirect 到 `/dashboard` 而非显示登录页

## 2. 修复 EDITOR 角色 Badge 显示

- [x] 2.1 在 `src/app/(protected)/layout.tsx` header 中，将 role badge 文本从 `role === 'ADMIN' ? '管理员' : '普通用户'` 改为 `role === 'ADMIN' ? '管理员' : role === 'EDITOR' ? '编辑员' : '普通用户'`
- [ ] 2.2 验证：以 EDITOR 账号登录，header badge 显示"编辑员"而非"普通用户"

## 3. 升级 Users/Skills 为服务端 ADMIN Guard

- [x] 3.1 在 `src/app/(protected)/dashboard/admin/` 下创建 `(admin-only)/` route group 目录
- [x] 3.2 新建 `src/app/(protected)/dashboard/admin/(admin-only)/layout.tsx`：Server Component，通过 `auth.api.getSession()` 校验 `role === 'ADMIN'`，否则 `redirect('/dashboard')`
- [x] 3.3 将 `src/app/(protected)/dashboard/admin/users/` 目录移动到 `src/app/(protected)/dashboard/admin/(admin-only)/users/`
- [x] 3.4 将 `src/app/(protected)/dashboard/admin/skills/` 目录移动到 `src/app/(protected)/dashboard/admin/(admin-only)/skills/`
- [x] 3.5 删除 `users/page.tsx` 中原有的 `useEffect` ADMIN role 检查（`useEffect(() => { if (!isPending && session && role !== 'ADMIN') router.push('/dashboard') })`）
- [x] 3.6 删除 `skills/page.tsx` 中原有的 `useEffect` ADMIN role 检查
- [ ] 3.7 验证：以 EDITOR 账号访问 `/dashboard/admin/users`，被服务端直接 redirect，页面内容无闪烁；URL 路径仍为 `/dashboard/admin/users`（不含括号）
- [x] 3.8 运行 `npm run build` 确认无构建错误
