## Why

新用户 onboarding 后落地 `/dashboard`（GrowthHome，激活核心面），但当前体验有三处断裂，叠加导致"做了动作却没反馈"：

1. **主页是孤岛，没有显式入口**。侧边栏主导航 Diagnose / Measure 都直接指向 `site-intelligence`，绕过 GrowthHome（[SidebarNav.tsx:127](src/components/dashboard/SidebarNav.tsx#L127)）。回主页的唯一路径是点左上角 logo（[SidebarNav.tsx:179](src/components/dashboard/SidebarNav.tsx#L179)），用户发现不了。激活漏斗事件 `first_coach_moment_viewed` 因此被严重低估。

2. **连了 GSC，数据永远到不了主页**（真 bug）。选定 GSC property 的 `select` 路由只存 `propertyId` + revalidate，**不触发任何数据同步**（[gsc/properties/select/route.ts](src/app/api/dashboard/sites/[siteId]/gsc/properties/select/route.ts)）。真正拉数据的 `gsc-sync` 只在 site-detail 的 OverviewPanel 里触发——而教练 loop 不会把刚连完 GSC 的用户带去那个面。结果：`SiteKeywordSnapshot` 为空 → `classifyStage` 一直判 stage `0` → 主页 Pulse 展示量恒为 `0`。"我加了 GSC 但教练层没反应"的根因就在这。

3. **主页没有一张图**。GrowthHome 的 Pulse 只有 3 个裸数字（[GrowthHome.tsx:176](src/components/coach/GrowthHome.tsx#L176)），而丰富的可视化组件（`PerformanceDashboard`、`KeywordTrendChart`）全锁在 site-detail 的 `#performance` tab 里。这违背了产品"Data is the hero / Stripe-style chart-forward"的设计原则。且 `PerformanceDashboard` 大量使用硬编码色（`text-blue-600`、`text-slate-500`、`border-slate-200`、图表 `#3b82f6`/`#4f46e5`），违反 token 纪律，连出来也"像半成品"。

本变更把 GrowthHome 扶正成"真正的家"：有入口能回家 → 在家连 GSC 就能自动拿到数据 → 在家就能看到自己真实搜索表现的图。

## What Changes

- **GSC 自动首次同步**（bug fix）：在 GSC property 选定（`select` 路由）成功后，fire-and-forget 触发一次 `gsc-sync`，使快照数据立即开始回填，不再依赖用户手动进入某个 tab。
- **主页导航入口**：侧边栏主导航最前面新增"增长主页 / Growth"项，指向 `/dashboard`，`isActive` 判定 `pathname === '/dashboard'`；导航语义变为 总览 → 诊断 → 生产 → 衡量。
- **真实数据上主页**：将 `PerformanceDashboard` 的精简版（近 30 天展示量 sparkline + top movers/queries）作为一张卡片引入 GrowthHome，替换/增强当前的裸数字 Pulse。
- **同步中间态 + 首数据揭晓**：当 GSC 已连但快照仍在回填时，主页显示 `syncing` 中间态；首批数据到位后，给一条真实发现型洞察（如"您已在 N 个关键词上有展示，其中『X』最接近第一页"），把"连 GSC"变成有回报的事件。
- **token 归正**：被复用到主页的 `PerformanceDashboard`（及其精简版）的所有颜色改为 `--color-brand-*` / `brand-*` token。

## Capabilities

### New Capabilities

- `gsc-auto-sync` — GSC property 选定后自动触发首次数据同步。
- `growth-home-navigation` — GrowthHome 作为仪表盘一级导航入口。
- `growth-home-data-surface` — GrowthHome 呈现真实 GSC 表现图 + 同步中间态 + 首数据洞察。

### Modified Capabilities

- 教练主页（GrowthHome）渲染契约：Pulse 由"裸数字 + 0/需连接"升级为"图表 + 同步态"。

## Impact

- **定位**：本变更全部在 **dashboard（仪表盘，非公开、中文 UI）**，无双语 / i18n 路由影响（沿用 `User.locale` 注入的 next-intl）。
- **BREAKING（token）**：`PerformanceDashboard` 颜色从硬编码 Tailwind/hex 迁移到 brand token——按项目规则标注为 token 变更，需走 Design Compliance 校验。
- **文件**（预估）：`gsc/properties/select/route.ts`（触发 sync）、`SidebarNav.tsx`（导航项）、`GrowthHome.tsx` + `lib/coach/home.ts`（数据/中间态/洞察）、`PerformanceDashboard.tsx`（token + 精简版抽取）、可能复用 `gsc/performance` 与 `keyword-snapshots/trends` API。
- **依赖**：建议在 `activation-funnel-instrumentation`（P0）埋点就位后实施，以度量本变更对激活/留存的实际提升。
