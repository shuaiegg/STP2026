## Context

`/dashboard` 是用户注册后的第一个落地页。当前 `DashboardContent.tsx` 假设用户已有站点和数据，对 0 站点的新用户展示三个空数字 + 专业术语，激活路径缺失。

`sonner` 已安装（`toast.success()` 在 settings/page.tsx:77 已调用），但根 layout 未挂载 `<Toaster />`，导致全站 toast 静默失效。

## Goals / Non-Goals

**Goals:**
- 新用户注册后在现有 `/dashboard` 页内看到清晰的第一步引导
- 修复全站 toast 通知不显示的问题
- 不引入新路由、不改数据库 schema

**Non-Goals:**
- 独立的 onboarding 向导页（`/dashboard/onboarding`）
- 多步骤弹窗流程
- 邮件/Push 触发的激活提醒

## Decisions

### D1：三态渲染策略（条件渲染 vs 独立组件）

选择在 `DashboardContent.tsx` 内部用三态条件渲染，不拆独立路由。

```
状态          判断条件                        渲染
─────────────────────────────────────────────────────
EMPTY        totalSites === 0               欢迎空状态（替换整个 stats + sites 区域）
SETUP        totalSites > 0 &&              Checklist 横幅 + 正常 Dashboard
             (auditCount === 0 ||
              !checklistDismissed)
ACTIVE       totalSites > 0 &&              正常 Dashboard（无 Checklist）
             auditCount > 0 &&
             checklistDismissed
```

**为何不拆路由**：注册后重定向逻辑改动影响面大，且 inline 方案对用户更自然（不感知页面跳转）。

### D2：Checklist 持久化用 localStorage，不用数据库

步骤：添加站点（必须）→ 运行首次审计（必须）→ 连接 GSC（可选，可跳过）→ 查看战略看板（必须）

关闭状态存 `localStorage` key `stp_checklist_dismissed`。

**为何不用 DB**：避免 schema 变更，优先验证 UX 价值；后续可迁移到 `User.onboardingDismissedAt`。

**风险**：跨设备不同步。可接受——Checklist 是辅助引导，非核心功能。

### D3：auditCount 加入服务端 data fetch

在 `page.tsx` 的 `getUserData()` 中加一条：

```ts
prisma.siteAudit.count({ where: { site: { userId } } })
```

**为何在服务端而非客户端**：与其他 metrics 一起 `Promise.all` 并行，无额外 waterfall；客户端获取需要额外 API route，违反 Server Component 优先原则。

### D4：`<Toaster />` 挂载在根 layout

在 `src/app/layout.tsx` 的 `<body>` 底部加 `<Toaster position="top-right" richColors />`。

**为何是根 layout 而非 protected layout**：toast 在 settings（protected）、可能未来在 public 页面（错误提示）均需使用，根 layout 覆盖最广，且 Sonner 性能开销极小。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| localStorage 在 SSR 时不可用 | Checklist 组件标记 `'use client'`，读取在 `useEffect` 中执行 |
| auditCount = 0 但用户已熟悉工具（老用户清空数据） | Checklist 可手动关闭（一键 dismiss），不强制显示 |
| `<Toaster />` 在根 layout 影响所有页面 | 无副作用——未调用 `toast()` 时不渲染任何 DOM |
| DashboardContent props 接口变更 | `auditCount` 加默认值 `0`，向后兼容 |
