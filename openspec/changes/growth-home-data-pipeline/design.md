## Context

存在两个互相打架的"家"：

```
        onboarding 完
              │
              ▼
   /dashboard  =  GrowthHome (教练层)      ← 激活核心面，但：无导航入口、无图表、Pulse 全 0
              │ 招式/loop 全部深链到 ↓
              ▼
   /site-intelligence/[siteId]  (8 tab)    ← 真正的数据/图表都堆在这
   overview│strategy│competitors│performance│traffic│audit│audits│integrations
```

且 GSC 数据流是断的：

```
连 GSC: handleConnectGSC → OAuth → 选 property
            ↓
     select route 只存 propertyId + revalidate   ❌ 不触发 sync
            ↓
     gsc-sync（填 SiteKeywordSnapshot）只在 OverviewPanel 触发  ← 在详情页
            ↓
GrowthHome 读 impressions30d ← snapshot 仍空 → stage 恒 0 → Pulse 恒 0
```

相关代码：`classifyStage` / `collectStageSignals`（[lib/coach/lifecycle.ts](src/lib/coach/lifecycle.ts)）、`getGrowthHomeData`（[lib/coach/home.ts](src/lib/coach/home.ts)）、`PerformanceDashboard`（site-detail，已实现且功能完整）、`gsc-sync` POST（[gsc-sync/route.ts](src/app/api/dashboard/sites/[siteId]/gsc-sync/route.ts)）。

## Goals / Non-Goals

**Goals:**
- 用户能从导航显式回到 GrowthHome。
- 连 GSC 后无需任何额外操作，数据自动开始回填并最终出现在主页。
- 主页第一次出现属于"我"的真实搜索表现图，且全部使用 brand token。
- 连 GSC → 出数据这段有 `syncing` 中间态与首数据揭晓，不再是"连了像没连"。

**Non-Goals:**
- 不重构 site-detail 的 8 个 tab（属 P4，需待本变更确定"主页 vs 详情"分工后再做）。
- 不改 GSC OAuth 流程本身。
- 不改 `classifyStage` 的阶段阈值逻辑（只确保它读到的快照不再恒空）。
- 不做真空期竞品对标 / 每周简报（属 P3）。

## Decisions

### 决策 1：GSC 首次同步在 `select` 路由 fire-and-forget 触发

property 选定是"用户表达了要这个数据源"的明确信号，是触发首拉的正确时机。实现为不阻塞响应的后台调用（fire-and-forget，失败不阻断 select 成功返回；错误进日志）。

| 方案 | 结论 |
|------|------|
| select 后 fire-and-forget 触发 gsc-sync | ✅ 选用：时机正确、不阻塞、对所有入口生效 |
| 仅在 GrowthHome 渲染时惰性触发 | ❌ 渲染路径应零写入（与 coach 现有约定冲突） |
| 让用户手动点"同步" | ❌ 即当前隐性现状，正是要消除的断裂 |
| 定时 cron 全量同步 | 后续补充（cron 已有 GSC 健康检查），但首次体验不能等下一个 cron 窗口 |

### 决策 2：导航把 GrowthHome 设为一级入口

`primaryLinks` 最前插入"增长主页"，图标用 `Sparkles`（呼应洞察卡）或 `Home`；`isActive: pathname === '/dashboard'`。导航顺序成为 总览 → 诊断 → 生产 → 衡量，主页是 loop 的起点与归处。logo 保留跳转但不再是唯一入口。无站点时仍指向 onboarding（沿用现有 `homeHref` 防 307 循环逻辑）。

### 决策 3：主页数据卡 = PerformanceDashboard 的精简版（抽取复用，不重写）

从 `PerformanceDashboard` 抽出"摘要 + 趋势图"为可复用精简组件（sparkline/area + top queries 缩略），主页放一张；详情页 `#performance` 继续用完整版。抽取时**同步把颜色迁移到 brand token**（决策 4），两处共享归正后的组件。避免主页与详情页各画一份图导致漂移。

### 决策 4：token 归正（BREAKING）

`PerformanceDashboard` 现用 `text-blue-600 / text-indigo-600 / text-emerald-600 / text-slate-* / border-slate-200` 及图表内 `#3b82f6 / #4f46e5`。全部迁移到 `--color-brand-*` / `brand-*`（图表系列色用 brand 调色，主交互/高亮用 `brand-secondary #00d4ff`）。按项目规则，CSS token / 配色变更标注为 BREAKING，需过 Design Compliance + `/web-design-guidelines`。

### 决策 5：同步态与首数据洞察落在 home 数据层

`getGrowthHomeData` 增加一个同步态判定：`hasGsc && snapshot 为空 && 距 property 选定时间较近` → `syncing`。首批快照到位后，在 `buildInsight` 已有的"啊哈"框架上补一条**真实排名发现**（基于最接近第一页的关键词），与现有 ontology/competitor/gap 洞察并存、按可得性择优。

## Risks / Trade-offs

- **fire-and-forget 失败静默**：首拉失败时用户仍会停在 `syncing`。缓解：失败入日志；保留既有的手动同步入口作兜底；`syncing` 态设合理超时回退文案。
- **GSC 数据延迟**：GSC 本身有 ~3 天数据延迟，新站可能首拉即近乎空。`syncing` 与首数据洞察需对"已同步但确实没什么展示"给出诚实文案，而非永远转圈。
- **token 迁移视觉回归**：配色变更可能影响图表可读性。缓解：迁移后人工核对图表对比度（WCAG AA）+ 跑 `/web-design-guidelines`。
- **组件抽取的耦合**：精简版与完整版共享代码需谨慎，避免改一处崩两处。缓解：抽纯展示子组件，数据获取各自保留。
