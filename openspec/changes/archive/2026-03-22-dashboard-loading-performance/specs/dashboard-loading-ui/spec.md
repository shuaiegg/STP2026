## ADDED Requirements

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
