## 1. 数据库预留字段

- [x] 1.1 在 `prisma/schema.prisma` 的 `Site` model 中添加 `workspaceId String?` nullable 字段
- [x] 1.2 运行 `npx prisma db push` 应用字段变更
- [x] 1.3 运行 `npx prisma generate` 更新 Prisma client

## 2. Middleware 路由 Redirect

- [x] 2.1 在 `src/middleware.ts` 中，在现有逻辑前添加 `/admin/setup` 的白名单排除规则（不 redirect）
- [x] 2.2 添加 `/admin/login` → `/login` 的 301 redirect 规则
- [x] 2.3 添加 `/admin` → `/dashboard` 的 301 redirect 规则
- [x] 2.4 添加 `/admin/:path*` → `/dashboard/admin/:path*` 的通用 301 redirect 规则（确保在 setup/login 规则之后）
- [x] 2.5 更新 middleware `config.matcher` 确保包含 `/admin/:path*`
- [x] 2.6 验证：访问 `/admin/content` 跳转到 `/dashboard/admin/content`，访问 `/admin/setup` 正常渲染

## 3. Admin 页面迁移到 /dashboard/admin/*

- [x] 3.1 在 `src/app/(protected)/dashboard/` 下创建 `admin/` 子目录
- [x] 3.2 将 `src/app/admin/content/` 移动到 `src/app/(protected)/dashboard/admin/content/`
- [x] 3.3 将 `src/app/admin/sync/` 移动到 `src/app/(protected)/dashboard/admin/sync/`
- [x] 3.4 将 `src/app/admin/users/` 移动到 `src/app/(protected)/dashboard/admin/users/`
- [x] 3.5 将 `src/app/admin/skills/` 移动到 `src/app/(protected)/dashboard/admin/skills/`
- [x] 3.6 更新迁移后各页面内的内部链接（`href`、`router.push` 等），将 `/admin/` 前缀改为 `/dashboard/admin/`
- [x] 3.7 在 `src/app/(protected)/dashboard/admin/layout.tsx` 创建 admin 子路由的 layout Server Component，校验 role（ADMIN/EDITOR），非授权用户 redirect 到 `/dashboard`
- [x] 3.8 用户管理 (`/dashboard/admin/users`) 和技能管理 (`/dashboard/admin/skills`) 页面额外校验 role === 'ADMIN'，EDITOR 访问时 redirect 到 `/dashboard`

## 4. 统一侧边栏导航

- [x] 4.1 在 `src/app/(protected)/layout.tsx` 的侧边栏导航数组中，新增"管理"分组，包含：内容管理（`/dashboard/admin/content`）、Notion 同步（`/dashboard/admin/sync`）、用户管理（`/dashboard/admin/users`）、技能管理（`/dashboard/admin/skills`）
- [x] 4.2 用 `session?.user?.role` 条件渲染管理分组：`ADMIN` 显示全部 4 项，`EDITOR` 只显示内容管理和 Notion 同步，`USER` 不显示
- [x] 4.3 验证：以 ADMIN 账号登录，侧边栏显示 4 个管理菜单；以 USER 账号登录，无管理菜单

## 5. 统一登录页

- [x] 5.1 在 `src/app/(public)/login/page.tsx` 的登录成功回调中，确保所有角色（ADMIN/EDITOR/USER）均跳转到 `/dashboard`（移除原有的 `/admin` 跳转逻辑，如有）
- [x] 5.2 验证 `/admin/login` 已被 middleware redirect 到 `/login`，旧管理员书签不失效

## 6. Admin Credits 豁免

- [x] 6.1 在 `src/lib/billing/credits.ts` 的 `chargeUser()` 函数开头，查询 `user.role`（通过 `prisma.user.findUnique` select role）
- [x] 6.2 若 `role === 'ADMIN'`，直接 return `{ success: true, remainingCredits: user.credits }` 跳过扣减逻辑，不写 CreditTransaction
- [x] 6.3 验证：以 ADMIN 账号执行 AI 工具，credits 余额不变，数据库无新 CreditTransaction 记录

## 7. Geo-writer 博客草稿功能

- [x] 7.1 新建 `src/app/actions/blog-draft.ts`，导出 `saveToBlogDraft(params)` server action
- [x] 7.2 在 `saveToBlogDraft` 中：通过 `getSession()` 验证 role === 'ADMIN'（否则返回 `{ success: false, message: 'Unauthorized' }`）
- [x] 7.3 实现 `Content` 记录创建逻辑：`status: DRAFT`, `source: MANUAL`, `visibility: PRIVATE`，title/content/summary 来自参数，slug 从 title 自动生成（kebab-case，加随机后缀保证唯一性）
- [x] 7.4 在 `src/app/(public)/tools/geo-writer/page.tsx` 中，根据 `session?.user?.role === 'ADMIN'` 条件渲染"另存为博客草稿"按钮（在 step 3 结果区，紧邻"保存到内容库"按钮）
- [x] 7.5 按钮点击后调用 `saveToBlogDraft()`，成功后用 `router.push('/dashboard/admin/content/edit/[id]')` 跳转到编辑页
- [x] 7.6 添加按钮 loading 状态和错误 toast
- [x] 7.7 验证：ADMIN 生成文章后点击按钮，Content 表新增草稿记录，跳转到编辑页；USER 看不到此按钮

## 8. 清理

- [x] 8.1 删除原 `src/app/admin/content/`、`sync/`、`users/`、`skills/` 目录（已在步骤3迁移）
- [x] 8.2 删除 `src/app/admin/AdminLayoutClient.tsx` 和 `src/app/admin/layout.tsx`（原 admin layout，已被 dashboard admin layout 替代）
- [x] 8.3 检查并移除代码中所有剩余的 `/admin/` 硬编码链接（除 `/admin/setup` 外）
- [x] 8.4 运行 `npm run build` 确认无构建错误
