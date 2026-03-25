## Context

Phase 1 完成后，所有 dashboard 路由已有 `loading.tsx` 骨架，`site-intelligence/[siteId]` 已是 Server Component + Suspense 结构，Tab 面板已动态导入。Phase 2 在此基础上重构视觉层次和信息架构，不再触碰性能层。

**核心约束**：保留所有现有 URL 路径，Phase 1 的 `loading.tsx` 文件路径不变（可能更新骨架形状）。

## Goals / Non-Goals

**Goals:**
- 新用户进入 dashboard 在 2 步内完成「添加网站 → 看到分析结果」
- 站点工作台首屏信息优先级与用户决策路径一致（流量 → 策略 → 待办 → 健康 → 审计）
- 新用户（无 GSC/GA4）看到完整、有意义的 UI，不出现空数据区域
- 多站点用户有清晰的切换入口

**Non-Goals:**
- 不重构 Admin 路由和 Admin 页面布局（单独规划）
- 不实现多语言（i18n 架构已就绪，后续再接入）
- 不修改 API 路由、数据库结构、计费逻辑

## Decisions

### 决策 1：新用户引导页路由选择

**选择**：新建 `/dashboard/onboarding` 独立路由，而非在 `/dashboard` 主页内联展示引导表单。

**理由**：
- 引导页有独立的 UI 状态（URL 输入、加载进度、完成态），内联在主页会污染主页逻辑
- 独立路由可配置独立的 `loading.tsx` 和 `error.tsx`
- 未来可以直接从营销页 CTA 深链到 `/dashboard/onboarding?url=example.com`

**引导页复用 instant-audit 的流式 API**（`/api/dashboard/site-intelligence/audit`），完成后自动注册站点并跳转到工作台。

**放弃的方案**：Modal 弹窗引导——与 URL 路由不兼容，刷新后丢失状态。

### 决策 2：用全局 Top Nav 替换 Sidebar

**选择**：移除现有左侧 Sidebar，改为全宽顶部导航栏（Top Nav），内容区获得完整宽度。站点工作台在 Top Nav 下方增加一层 Tab bar 用于功能维度切换。

```
┌─────────────────────────────────────────────────────────────┐
│ Logo │ example.com ▾ │ 内容库  工具箱  积分       [头像]    │ ← Top Nav（全宽）
├─────────────────────────────────────────────────────────────┤
│ 概览 │ 内容策略 │ 竞争分析 │ 性能数据 │ 审计报告  [运行审计] │ ← Tab bar（仅站点页）
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [完整宽度内容区 — 比原 Sidebar 布局多 ~240px]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Top Nav 结构（左 → 右）：**
- 左：Logo（链接到 `/dashboard`）
- 左中：站点切换器（当前站点域名 + `▾` 下拉，列出所有站点 + 「添加新站点」入口）
- 右中：全局功能链接（内容库、工具箱、积分）
- 右：用户头像下拉（设置、退出）

**非站点页面**（Library、Tools、Billing、Settings）：只显示 Top Nav，不显示 Tab bar。

**理由**：
- 内容区宽度增加约 240px，数据卡片和图表有更充裕的展示空间，视觉冲击更强
- 站点切换在 Top Nav 下拉中完成，比 Sidebar 折叠列表更直觉
- 与 Ahrefs、Semrush 等专业 SEO 工具的布局模式一致，降低新用户学习成本

**影响**：
- `DashboardShell.tsx` 需重构：移除 Sidebar，新增 `TopNav` 组件
- 所有 `loading.tsx` 骨架需更新：去掉左侧 sidebar 占位，顶部加 Top Nav 骨架
- Phase 1 中 Sidebar prefetch 逻辑迁移至 Top Nav 链接

**放弃的方案**：保留 Sidebar + 站点页内加 Tab——内容区宽度不变，改造效果有限，视觉提升不明显。

### 决策 3：概览 Tab 的自适应内容策略

概览 Tab 根据用户集成状态渲染不同内容：

```
状态判断树：
  有 GSC 数据？
    是 → 显示关键词表现卡（印象、点击、Top 关键词）
    否 → 显示「连接 GSC 解锁关键词数据」引导卡

  有 GA4 数据？
    是 → 显示流量趋势卡
    否 → 显示「连接 GA4 解锁流量数据」引导卡

  有内容计划？
    是 → 显示内容策略进度卡
    否 → 显示「创建内容计划」引导卡

  始终显示：健康评分卡 + 待办事项卡
```

引导卡样式：灰色虚线边框 + 图标 + 一句说明 + CTA 按钮，明显区别于实际数据卡片，不让用户误以为是空数据。

### 决策 4：`/dashboard` 主页的重定向逻辑

```
访问 /dashboard
  ├── totalSites === 0 → redirect /dashboard/onboarding
  ├── totalSites === 1 → redirect /dashboard/site-intelligence/{siteId}
  └── totalSites > 1  → 渲染站点选择器（卡片网格）
```

站点选择器展示：域名、最新健康分、上次审计时间、快速操作入口。

**放弃的方案**：保留大盘聚合数据页——对单站点用户是冗余层级，增加一次跳转。

### 决策 5：「建议下一步」卡片的展示时机

Onboarding 完成后，进入工作台时在概览 Tab 顶部展示「建议下一步」横幅（可关闭），包含：

1. 连接 Google Search Console（解锁关键词数据）
2. 连接 Google Analytics 4（解锁流量数据）
3. 添加竞争对手（开启竞争分析）

横幅写入 `localStorage` key `stp_next_steps_dismissed_${siteId}`，关闭后不再显示。这是对现有 `dashboard-onboarding-checklist` spec 的自然延伸，聚焦在站点层级而非全局层级。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| Onboarding 引导页复用 instant-audit API，若 API 改动影响两处 | 两个入口共享同一 API，耦合已存在，非新增风险 |
| `/dashboard` 主页改为 redirect 后，直接访问主页的用户体验改变 | 多站点用户保留站点选择器，单站点用户减少一次点击，整体改善 |
| 移除 Sidebar 影响所有 dashboard 页面，改动面广 | Migration Plan 第 1 步先做 TopNav，统一替换后再做其他任务，保持每步可独立回滚 |
| Phase 1 的 `loading.tsx` 骨架形状（含 sidebar 占位）与新布局不匹配 | Phase 2 任务中统一更新所有骨架，去掉 sidebar 列，加 Top Nav 行 |
| 自适应布局的「引导卡」与「实际数据卡」视觉区分不清 | 引导卡使用虚线边框 + 灰色背景，与实际数据卡的实线边框 + 白色背景明显区分 |

## Migration Plan

1. 重构 `DashboardShell.tsx`：移除 Sidebar，新增 `TopNav` 组件（**先做，影响所有页面**）
2. 更新所有 `loading.tsx` 骨架：去掉 sidebar 占位，顶部改为 Top Nav 骨架
3. 新建 `/dashboard/onboarding` 路由
4. 修改 `/dashboard` 主页重定向逻辑
5. 重构 `site-intelligence/[siteId]`：在 Top Nav 下方插入 Tab bar + Site Header
6. 实现概览 Tab 的自适应内容卡片

每步独立可回滚。无数据库变更。

## Open Questions

- Onboarding 页面中，用户输入 URL 后「立即分析」是否需要登录？（当前 instant-audit 需要登录，若 onboarding 作为登录后首屏则无问题）
- 站点选择器（多站点用户）是否需要支持「添加新站点」入口？建议保留。
