## 1. 公共骨架组件

- [x] 1.1 创建 `src/components/ui/skeleton.tsx`，导出 `SkeletonBlock` 和 `SkeletonCard` 原语组件（`animate-pulse bg-slate-100 rounded-lg`）
- [x] 1.2 创建 `src/components/ui/panel-skeleton.tsx`，导出各面板专用骨架：`StrategyBoardSkeleton`、`OverviewPanelSkeleton`、`CompetitorsPanelSkeleton`、`PerformancePanelSkeleton`、`AuditHistoryPanelSkeleton`、`IntegrationsPanelSkeleton`

## 2. 添加 loading.tsx — 立即消除白屏

- [x] 2.1 创建 `src/app/(protected)/loading.tsx`（根层级兜底骨架：header + sidebar 占位 + 内容区占位）
- [x] 2.2 创建 `src/app/(protected)/dashboard/loading.tsx`（dashboard 主页骨架：3 个统计卡片 + checklist 占位）
- [x] 2.3 创建 `src/app/(protected)/dashboard/site-intelligence/loading.tsx`（站点列表骨架：3 个站点卡片）
- [x] 2.4 创建 `src/app/(protected)/dashboard/site-intelligence/[siteId]/loading.tsx`（详情页骨架：Tab bar + 面板区域）
- [x] 2.5 创建 `src/app/(protected)/dashboard/site-intelligence/instant-audit/loading.tsx`（替换现有文字占位为骨架 UI）
- [x] 2.6 创建 `src/app/(protected)/dashboard/library/loading.tsx`（文章列表骨架：5 行条目）
- [x] 2.7 创建 `src/app/(protected)/dashboard/billing/loading.tsx`（账单骨架：积分卡片 + 交易列表）
- [x] 2.8 创建 `src/app/(protected)/dashboard/tools/loading.tsx`（工具卡片骨架：3 列网格）
- [x] 2.9 创建 `src/app/(protected)/dashboard/settings/loading.tsx`（设置表单骨架）

## 3. 添加 error.tsx — 配合 loading.tsx 完整兜底

- [x] 3.1 确认 `src/app/(protected)/dashboard/site-intelligence/[siteId]/error.tsx` 存在，若无则创建（显示「加载失败，请刷新」）
- [x] 3.2 确认其他缺少 `error.tsx` 的路由段并补充（library、billing、tools）

## 4. Layout Server Wrapper — 消除 useEffect sites fetch

- [x] 4.1 在 `src/app/(protected)/layout.tsx` 中，将 sites 列表 fetch 逻辑提取为独立的服务端数据获取函数 `getInitialSites(userId)`
- [x] 4.2 将 `(protected)` layout 拆分：外层 `layout.tsx` 改为 Server Component（负责 session 获取 + sites fetch），内层 `DashboardShell.tsx` 保持 Client Component（负责 sidebar 交互、低积分 banner 等）
- [x] 4.3 通过 props 将 `initialSites` 传入 `DashboardShell`，移除 Shell 内的 `useEffect` sites fetch
- [x] 4.4 验证：登录后刷新任意 dashboard 页面，Network 面板不再出现 `/api/sites` 的客户端请求

## 5. 侧边栏导航 Prefetch

- [x] 5.1 在 `DashboardShell`（或侧边栏组件）中为每个主导航项添加 `onMouseEnter` → `router.prefetch(href)`
- [x] 5.2 验证：鼠标 hover 导航项后 Network 面板出现对应路由的预加载请求

## 6. Site Intelligence [siteId] — Server Component 改造

- [x] 6.1 将 `src/app/(protected)/dashboard/site-intelligence/[siteId]/page.tsx` 改为 async Server Component，服务端获取站点基础信息（`getSiteById`）
- [x] 6.2 将 Tab 切换状态（`activeTab`）提取到独立的 `TabContainer` Client Component
- [x] 6.3 在 `TabContainer` 内用 `<Suspense fallback={<PanelSkeleton />}>` 包裹各面板渲染位置
- [x] 6.4 验证：进入详情页时，站点名称/基础信息随 HTML 到达，Tab 面板显示骨架后再加载

## 7. Tab 面板 Dynamic Import

- [x] 7.1 将 `StrategyBoard` 改为 `dynamic(() => import('./panels/StrategyBoard'), { loading: () => <StrategyBoardSkeleton />, ssr: false })`
- [x] 7.2 将 `OverviewPanel` 改为 dynamic import（`ssr: false`，loading: `OverviewPanelSkeleton`）
- [x] 7.3 将 `CompetitorsPanel` 改为 dynamic import
- [x] 7.4 将 `PerformanceDashboard` 改为 dynamic import
- [x] 7.5 将 `AuditHistoryPanel` 改为 dynamic import
- [x] 7.6 将 `IntegrationsPanel` 改为 dynamic import
- [x] 7.7 验证：打开 Network 面板，首次进入详情页只加载默认 Tab 的 JS，切换 Tab 时按需加载其他 bundle

## 8. 验收测试

- [x] 8.1 在 production build（`npm run build && npm run start`）下测试所有 dashboard 路由，导航 时立即看到骨架，无白屏
- [x] 8.2 打开 Chrome DevTools → Network → 过滤 JS，确认 Site Intelligence 详情页首屏 JS 体积相比改造前减少
- [x] 8.3 切换所有 Tab，确认每个 Tab 首次激活时显示骨架，内容正确加载
- [x] 8.4 测试 sites fetch 失败场景（断网后刷新），确认 Layout 降级渲染，不出现整页崩溃
- [x] 8.5 运行 `npm run lint` 确认无新增 lint 错误

