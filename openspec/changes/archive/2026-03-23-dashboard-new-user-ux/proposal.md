## Why

新用户注册后进入 `/dashboard`，看到的是全为零的统计数字、专业术语（语义债、战略枢纽），以及一个没有任何上下文的空站点列表——没有引导，没有下一步，激活路径完全缺失。同时，`toast` 通知基础设施未完成（`<Toaster />` 未挂载），导致密码修改成功等反馈对用户不可见。

## What Changes

- **新增**：Dashboard 用户状态检测（EMPTY / SETUP / ACTIVE 三态）
- **新增**：EMPTY 态（0 个站点）全替换欢迎空状态 UI，含单一主 CTA
- **新增**：SETUP 态可关闭的 Checklist 横幅，引导用户完成关键设置步骤
- **新增**：Checklist 步骤：添加站点 → 运行首次审计 → 连接 GSC（可选）→ 查看战略看板
- **新增**：`page.tsx` 中加入 `auditCount` Prisma query，用于判断审计是否已执行
- **新增**：Checklist 关闭状态持久化至 `localStorage`
- **新增**：根 layout 挂载 `<Toaster />`（sonner），修复全站 toast 不显示问题

## Capabilities

### New Capabilities

- `dashboard-onboarding-checklist`：新用户激活引导，含三态检测逻辑、欢迎空状态、可关闭步骤清单，及 localStorage 持久化

### Modified Capabilities

- `global-dashboard-metrics`：`getUserData` 新增 `auditCount` 字段（Prisma query），`DashboardContent` props 扩展以支持三态渲染

## Impact

- `src/app/(protected)/dashboard/page.tsx` — 新增 `auditCount` query，传入 `DashboardContent`
- `src/app/(protected)/dashboard/DashboardContent.tsx` — 新增三态逻辑、欢迎空状态组件、Checklist 组件
- `src/app/layout.tsx` — 新增 `<Toaster />` 挂载（影响全站所有 toast 通知）
- 无 schema 变更，无新路由，无 API 变更
