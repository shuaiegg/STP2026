# dashboard-loading-ui Specification

## Purpose
TBD - created by archiving change bundle-and-query-optimization. Update Purpose after archive.
## Requirements
### Requirement: Dashboard routes display skeleton loading UI during navigation
每个 dashboard 路由 SHALL 在页面数据加载期间展示骨架屏 loading 状态，利用 Next.js App Router Streaming 机制，避免整页空白等待。

#### Scenario: 用户导航到 dashboard 主页
- **WHEN** 用户点击导航进入 `/dashboard`
- **THEN** 页面立即显示骨架屏占位内容，不出现空白屏或旋转加载图标

#### Scenario: 用户导航到 site-intelligence 列表页
- **WHEN** 用户访问 `/dashboard/site-intelligence`
- **THEN** 页面在数据加载完成前显示卡片骨架屏

#### Scenario: 用户导航到 site-intelligence 详情页
- **WHEN** 用户访问 `/dashboard/site-intelligence/[siteId]`
- **THEN** 页面在数据加载完成前显示面板骨架屏

#### Scenario: 用户导航到 library 页
- **WHEN** 用户访问 `/dashboard/library`
- **THEN** 页面在数据加载完成前显示列表骨架屏

#### Scenario: 骨架屏被实际内容替换
- **WHEN** 页面数据加载完成
- **THEN** 骨架屏被实际内容无闪烁替换

#### Scenario: StrategyBoard REFACTORING_NEEDED 骨架屏兼容
- **WHEN** StrategyBoard loading.tsx 渲染时，实际数据包含 REFACTORING_NEEDED 状态卡片
- **THEN** 骨架屏完成后，REFACTORING_NEEDED 状态卡片正确显示橙色警告标识

### Requirement: Loading UI 使用 animate-pulse 风格占位块
骨架屏 MUST 使用 TailwindCSS `animate-pulse` 灰色占位块，与页面整体布局大致对应，无需像素级还原。

#### Scenario: 骨架屏样式一致性
- **WHEN** 任意 dashboard loading.tsx 被渲染
- **THEN** 占位块使用 `bg-gray-200 animate-pulse rounded` 类，与项目设计系统一致

### Requirement: Site Intelligence 列表页以 server component 渲染
`/dashboard/site-intelligence` 页面 SHALL 作为 server component 渲染，直接在服务端获取用户站点列表，不依赖客户端 localStorage 缓存或水合后 fetch。

#### Scenario: 用户有多个站点时加载列表
- **WHEN** 用户访问 `/dashboard/site-intelligence`
- **THEN** 站点列表由服务端直接渲染，配合 `loading.tsx` 显示骨架，不出现客户端水合后延迟

#### Scenario: 用户只有一个站点时自动跳转
- **WHEN** 用户只有一个已注册站点
- **THEN** 服务端直接调用 `redirect()` 跳转到 `/dashboard/site-intelligence/${siteId}`，无客户端 JS 参与

#### Scenario: 用户没有站点时显示引导界面
- **WHEN** 用户没有任何已注册站点
- **THEN** 服务端渲染「添加第一个站点」空状态页面

### Requirement: Site Intelligence 详情页使用单站点 API
`/dashboard/site-intelligence/[siteId]` 页面 SHALL 使用 `GET /api/dashboard/sites/${siteId}` 获取当前站点数据，而非获取全部站点列表后在客户端筛选。

#### Scenario: 进入详情页时获取站点数据
- **WHEN** 用户访问 `/dashboard/site-intelligence/[siteId]`
- **THEN** 页面仅请求当前站点的数据，请求数量为 O(1) 而非 O(N)

#### Scenario: 站点不存在时的处理
- **WHEN** 请求的 siteId 不属于当前用户
- **THEN** 页面跳转至 `/dashboard/site-intelligence`，与原有行为一致

### Requirement: Site Intelligence Tab 面板显示内部骨架
Site Intelligence 详情页的所有 Tab 面板组件 SHALL 在数据加载期间显示内部骨架，不出现空白区域。骨架 MUST 使用 `animate-pulse` + `bg-slate-100` 风格与项目规范一致。

#### Scenario: StrategyBoard 数据加载中
- **WHEN** StrategyBoard 组件挂载并等待 `/strategy` API 响应
- **THEN** 面板区域显示看板列占位骨架（3 列 × 多行卡片形状）

#### Scenario: OverviewPanel 数据加载中
- **WHEN** OverviewPanel 挂载并等待 4 个并行 API 响应
- **THEN** 面板区域显示概览统计卡片 + 进度条占位骨架

#### Scenario: CompetitorsPanel 数据加载中
- **WHEN** CompetitorsPanel 挂载并等待竞争对手数据
- **THEN** 面板区域显示竞争对手卡片列表占位骨架

#### Scenario: PerformanceDashboard 数据加载中
- **WHEN** PerformanceDashboard 挂载
- **THEN** 面板区域显示关键词表格 + 图表占位骨架

#### Scenario: AuditHistoryPanel 数据加载中
- **WHEN** AuditHistoryPanel 挂载
- **THEN** 面板区域显示审计历史时间线骨架

#### Scenario: IntegrationsPanel 数据加载中
- **WHEN** IntegrationsPanel 挂载
- **THEN** 面板区域显示 GSC/GA4 集成卡片骨架

### Requirement: Instant Audit Suspense fallback 显示骨架
`/dashboard/site-intelligence/instant-audit` 的 Suspense fallback SHALL 显示与页面布局对应的骨架，而非纯文字。

#### Scenario: Instant Audit 页面初始化中
- **WHEN** `useSearchParams` 解析期间 Suspense 触发 fallback
- **THEN** 显示包含顶部 header 区域和主内容区占位的骨架，而非 `加载中...` 文字

### Requirement: Layout 通过 Server Component 传递初始 sites 数据
`(protected)` Layout 的 sites 列表数据 SHALL 由外层 Server Component wrapper 在服务端获取，并以 props 形式传入 Layout Client Component，不依赖 `useEffect` 客户端请求。

#### Scenario: 用户进入任意 dashboard 页面
- **WHEN** 用户访问任意 `/dashboard/*` 路由
- **THEN** 侧边栏的站点列表数据随 HTML 一同到达客户端，不发起额外的客户端 fetch 请求

#### Scenario: Server wrapper fetch 失败
- **WHEN** 服务端获取 sites 数据失败
- **THEN** Layout 以空 sites 列表渲染，侧边栏显示「添加网站」入口，不阻塞页面加载

### Requirement: 侧边栏导航链接在 hover 时预加载目标路由
侧边栏所有主要导航 `<Link>` 项 SHALL 在鼠标 `onMouseEnter` 时调用 `router.prefetch()`，确保在 sidebar 折叠或 Link 不在 viewport 时仍能触发预加载。

#### Scenario: 用户鼠标悬停导航项
- **WHEN** 用户将鼠标移入侧边栏某导航项
- **THEN** 浏览器开始预加载该路由的 JS 和数据，用户点击时感知延迟 < 100ms

#### Scenario: 用户快速点击未 hover 的导航项
- **WHEN** 用户直接点击未经 hover 的导航项
- **THEN** 正常触发路由导航，`loading.tsx` 立即显示，行为与原来一致

### Requirement: (protected) 路由根层级提供 loading.tsx
`src/app/(protected)/` 根路由段 SHALL 提供 `loading.tsx`，作为所有子路由的兜底骨架，在子路由未提供独立 `loading.tsx` 时生效。

#### Scenario: 访问未单独配置 loading.tsx 的子路由
- **WHEN** 用户导航到未配置独立 `loading.tsx` 的 dashboard 子路由
- **THEN** 显示根层级 `loading.tsx` 的通用骨架，不出现空白屏
