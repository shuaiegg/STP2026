## Why

当前项目存在两个独立后台（`/admin` 和 `/dashboard`），管理员需要频繁切换才能同时使用运营工具（site-intelligence、geo-writer）和内容管理功能，体验割裂。同时，现有数据模型未预留多租户扩展字段，若后续引入工作区（Workspace）和助理账户，需要大规模迁移数据，代价高。

## What Changes

- **统一入口**：`/admin/*` 所有路由做 301 redirect 到 `/dashboard/*` 对应页面；`/admin/login` redirect 到 `/login`；`/admin/setup` 保持独立可访问
- **统一登录页**：现有 `/login` 成为唯一登录入口，登录后根据角色自动跳转：ADMIN/EDITOR → `/dashboard`（带管理菜单）；USER → `/dashboard`（无管理菜单）
- **统一侧边栏**：Dashboard 侧边栏新增"管理"分组，仅 ADMIN/EDITOR 可见，包含内容管理、Notion 同步、用户管理（仅 ADMIN）、技能管理（仅 ADMIN）
- **Admin Credits Exempt**：ADMIN 角色执行 AI 工具时跳过 credits 扣减逻辑
- **Geo-writer → 博客草稿**：ADMIN 在 geo-writer 生成结果页看到"另存为博客草稿"按钮，点击后在 `Content` 表创建 `status: DRAFT, source: MANUAL` 记录并跳转到内容管理编辑页
- **数据库预留字段**（P2，nullable，暂不使用）：在 `Site` 表加 `workspaceId String?` 字段，为未来 Workspace 多租户功能留口

## Capabilities

### New Capabilities

- `unified-navigation`: 统一侧边栏导航，基于角色展示不同菜单分组（ADMIN/EDITOR 管理分组，所有用户工具分组）
- `admin-redirect`: /admin/* 路由的 redirect 规则，保证旧链接不失效
- `geo-writer-blog-publish`: geo-writer 结果页的"另存为博客草稿"工作流，仅 ADMIN 可见
- `admin-credits-exempt`: ADMIN 角色 AI 工具调用时的 credits 豁免逻辑

### Modified Capabilities

（无现有 spec 层面的 requirement 变更，本次为新增能力）

## Impact

- **路由层**：`src/middleware.ts` 需增加 /admin/* → /dashboard/* 的 redirect 规则
- **布局层**：`src/app/(protected)/dashboard/` 的侧边栏组件，需读取 session role 动态渲染管理菜单
- **登录页**：`src/app/(public)/login/` 的登录成功回调，需根据 role 决定跳转目标
- **Geo-writer 结果组件**：新增"另存为博客草稿"按钮及对应 Server Action
- **Credits 扣减逻辑**：`src/lib/skills/` 的 credits 扣减前检查 user role，ADMIN 跳过
- **Prisma schema**：`Site` 表新增 `workspaceId String?` nullable 字段（需 `prisma db push` + `prisma generate`）
- **无 API 路由变更**：本次改造不涉及任何 API 路由重构
