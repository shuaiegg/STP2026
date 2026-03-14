## Context

当前系统有两套独立的后台布局：

- `/admin/*` — `src/app/admin/AdminLayoutClient.tsx`，专用侧边栏，角色检查在 layout 层
- `/(protected)/dashboard/*` — `src/app/(protected)/layout.tsx`，独立侧边栏，无管理菜单

Middleware（`src/middleware.ts`）目前：未登录访问 `/admin/*` 时跳转到 `/admin/login`，未登录访问 `/dashboard/*` 时跳转到 `/login`。角色校验（ADMIN/EDITOR 限制）在 admin layout server 层完成，不在 middleware 层。

Credits 扣减逻辑在 `src/lib/billing/credits.ts` 的 `chargeUser()` 函数内，以 Prisma transaction 实现原子扣减，目前无角色豁免。

Geo-writer 生成结果保存通过 `saveTrackedArticle()` server action 存入 `TrackedArticle` 表（用户 library），与 `Content` 表（博客）完全隔离。

## Goals / Non-Goals

**Goals:**
- `/admin/*` 所有路由 301 redirect 到 `/dashboard/*`（含 `/admin/login` → `/login`）
- `/admin/setup` 保持独立可访问，不做 redirect
- Dashboard 侧边栏根据 role 动态展示"管理"分组菜单
- ADMIN 执行 AI 工具时跳过 credits 扣减
- ADMIN 在 geo-writer 结果页可一键将内容另存为 `Content` 表草稿
- `Site` 表预留 `workspaceId String?` 字段（nullable，不启用）

**Non-Goals:**
- 不重构任何 API 路由
- 不引入真正的 Workspace 功能（仅加字段）
- 不修改 middleware 的角色校验逻辑（保持在 layout 层）
- 不改变 admin 的 Server Component 检查逻辑
- 不重新设计登录页 UI

## Decisions

### D1：Redirect 在 middleware 层实现，而非 next.config.ts rewrites

**选择**：在 `middleware.ts` 内检测 `/admin/*` 路径并 301 redirect，而非 `next.config.ts` 的 redirects 数组。

**理由**：middleware 可以访问 request 上下文（路径参数、cookie），可以做精细化匹配（例如 `/admin/setup` 排除在外）；next.config.ts 的 redirects 是静态规则，无法做条件排除。

**Redirect 映射规则**：
```
/admin/login       → /login
/admin/setup       → /admin/setup (不 redirect，保持不变)
/admin             → /dashboard
/admin/content     → /dashboard/admin/content
/admin/sync        → /dashboard/admin/sync
/admin/users       → /dashboard/admin/users
/admin/skills      → /dashboard/admin/skills
/admin/:path*      → /dashboard/admin/:path* (通用规则)
```

### D2：Admin 菜单迁移到 /dashboard/admin/* 子路由

**选择**：现有 admin 功能页面（内容管理、Notion 同步、用户管理、技能管理）迁移到 `/dashboard/admin/*` 路由组。

**理由**：保持 Next.js App Router 的 route group 清晰性；dashboard layout 可统一渲染侧边栏；避免在 `/dashboard` 和 `/admin` 两个 route group 之间共享 layout。

**路由映射**：
```
/admin/content  → /dashboard/admin/content
/admin/sync     → /dashboard/admin/sync
/admin/users    → /dashboard/admin/users
/admin/skills   → /dashboard/admin/skills
```

**注意**：这是文件系统级别的迁移（移动 page.tsx 文件），原 admin layout 的 Server Component role 校验逻辑在 `/dashboard/(protected)/` layout 层替代实现。

### D3：侧边栏 role 检测通过 session prop 传入，不另起 API

**选择**：Dashboard layout 已是 Client Component，通过 `authClient.useSession()` 获取 session，直接读取 `session.user.role` 渲染管理菜单，无需额外 API 调用。

**理由**：session 已经在客户端可用（`authClient` 缓存），zero 额外请求；role 只需做简单字符串比较（`=== 'ADMIN' || === 'EDITOR'`）。

### D4：ADMIN credits 豁免在 chargeUser() 函数入口处理

**选择**：在 `src/lib/billing/credits.ts` 的 `chargeUser()` 接收 `userId` 后，先查询 user role，若为 ADMIN 则直接返回 `{ success: true, remainingCredits: Infinity }` 并跳过扣减和事务。

**替代方案考虑**：在每个调用 `chargeUser()` 的地方加条件判断——否决，因为调用点分散（`/api/skills/execute`、geo-writer 等），容易遗漏。集中在 `chargeUser()` 内处理更安全。

**注意**：ADMIN 豁免时不写 `CreditTransaction` 记录（避免污染用户消费统计数据）。

### D5：Geo-writer "另存为博客草稿" 新增独立 Server Action

**选择**：新建 `src/app/actions/blog-draft.ts`，导出 `saveToBlogDraft(content, metadata)` action，在 geo-writer 结果页按钮点击后调用。

**行为**：在 `Content` 表创建记录（`status: DRAFT`, `source: MANUAL`, `visibility: PRIVATE`），返回新建内容的 id，前端跳转到 `/dashboard/admin/content/edit/[id]`。

**安全性**：Server Action 内部通过 `getSession()` 校验 role === 'ADMIN'，非 ADMIN 调用时返回 403 错误。

## Risks / Trade-offs

**[风险] 文件迁移导致构建缓存失效** → Admin 页面迁移（D2）会改变文件路径，Next.js build cache 需要清理，Vercel 首次部署会较慢。Mitigation：部署前执行 `.next` 清理。

**[风险] /admin/setup 的特殊处理容易被遗漏** → middleware 的 redirect 规则必须在通用 `/admin/:path*` 规则之前显式排除 `/admin/setup`。Mitigation：tasks.md 中明确标注此项。

**[风险] workspaceId 字段后续迁移时已有数据** → 现在加 nullable 字段，所有现有 Site 记录 `workspaceId = null`，迁移时需要 backfill。Mitigation：这正是现在加 nullable 而非 required 的原因，代价最小。

**[Trade-off] Admin 页面迁移 vs 保留原位** → 选择迁移而非在两个 route group 保留两套 layout，代价是需要移动文件，好处是长期维护成本更低、路由结构更清晰。

## Migration Plan

1. 数据库变更先上（`prisma db push`）— 最低风险，nullable 字段不影响现有功能
2. Admin 页面文件迁移到 `/dashboard/admin/*` — 在功能测试完成前两套路由并存
3. 更新 middleware 加入 redirect 规则 — 此步骤后 /admin/* 对外失效
4. 删除原 `/admin/` 路由目录（保留 `/admin/setup`）
5. 更新侧边栏组件
6. 上线 credits 豁免和 geo-writer 博客草稿功能

**Rollback**：步骤3之前任何阶段均可回滚（文件移回、不执行 redirect）。步骤3之后 rollback 需要恢复 middleware。

## Open Questions

- `/admin/setup` 长期是否需要迁移到 `/dashboard/admin/setup`（首次安装向导）？目前保持原位，待产品决策。
- Geo-writer 博客草稿是否需要自动填充 slug（基于 title slug化）还是留空让管理员手动填写？建议自动生成但允许覆盖。
