# dashboard-site-workbench-layout Specification

## Purpose
Define the layout and navigation structure for the Site Intelligence workbench, replacing the left Sidebar with a top navigation bar and introducing a horizontal Tab system for the site detail page.

## Requirements

### Requirement: 站点工作台顶部展示 Site Header
`/dashboard/site-intelligence/[siteId]` SHALL 在页面顶部（Tab bar 上方）展示站点标识区域，包含域名、综合健康评分徽章和快捷操作按钮。

#### Scenario: Site Header 正常渲染
- **WHEN** 用户进入任意站点工作台页面
- **THEN** 页面顶部显示：站点域名（`font-display text-xl`）、健康评分徽章（绿/黄/红色，依分值）、「运行新审计」快捷按钮
- **THEN** Site Header 在所有 Tab 切换时保持可见，不随 Tab 内容滚动

#### Scenario: 健康评分徽章颜色语义
- **WHEN** 综合健康评分 ≥ 80
- **THEN** 徽章背景色使用 `--color-brand-primary`（绿色），文字为白色
- **WHEN** 综合健康评分 60–79
- **THEN** 徽章背景色使用 `--color-brand-accent`（琥珀色），文字为白色
- **WHEN** 综合健康评分 < 60
- **THEN** 徽章背景色使用 `text-red-600 bg-red-50`，文字为红色

#### Scenario: 无审计记录时健康评分展示
- **WHEN** 站点尚无任何审计记录
- **THEN** 徽章显示「未评分」灰色占位，并提供「立即评分」文字链接

### Requirement: 站点工作台使用横向 Tab 导航
`/dashboard/site-intelligence/[siteId]` SHALL 使用横向 Tab bar 作为功能维度导航，Tab 项包含：概览、内容策略、竞争分析、性能数据、审计报告。

#### Scenario: 默认激活「概览」Tab
- **WHEN** 用户首次进入站点工作台
- **THEN** 「概览」Tab 处于激活状态，对应内容区渲染

#### Scenario: Tab 切换时 URL hash 更新
- **WHEN** 用户点击「内容策略」Tab
- **THEN** URL 更新为 `/dashboard/site-intelligence/[siteId]#strategy`（不触发页面刷新）
- **THEN** 刷新页面后自动激活对应 Tab

#### Scenario: Tab 激活样式
- **WHEN** 某 Tab 处于激活状态
- **THEN** Tab 下方显示 `--color-brand-secondary`（#00d4ff）2px 底部指示线
- **THEN** Tab 文字颜色变深（`text-gray-900`），非激活 Tab 为 `text-gray-500`

### Requirement: 概览 Tab 根据集成状态自适应渲染
概览 Tab 的内容区 SHALL 根据用户当前集成状态（GSC、GA4、内容计划）条件渲染数据卡片或引导卡片，按优先级纵向排布。

#### Scenario: 已连接 GSC 时显示关键词表现卡
- **WHEN** 站点已连接 GSC 且有关键词数据
- **THEN** 概览第一区域显示关键词表现卡：总印象数、总点击数、平均排名、Top 3 关键词列表（含排名变化箭头）

#### Scenario: 未连接 GSC 时显示引导卡
- **WHEN** 站点未连接 GSC
- **THEN** 概览第一区域显示引导卡：灰色虚线边框、锁图标、「连接 GSC 解锁关键词数据」说明、「立即连接」CTA 按钮（链接至集成设置页）

#### Scenario: 已连接 GA4 时显示流量趋势卡
- **WHEN** 站点已连接 GA4 且有流量数据
- **THEN** 概览第二区域显示流量趋势卡：过去 30 天会话数、用户数、跳出率、迷你折线图

#### Scenario: 未连接 GA4 时显示引导卡
- **WHEN** 站点未连接 GA4
- **THEN** 概览第二区域显示引导卡：「连接 GA4 解锁流量数据」

#### Scenario: 有内容计划时显示策略进度卡
- **WHEN** 站点有 PlannedArticle 记录
- **THEN** 概览第三区域显示内容策略进度卡：计划篇数、已发布篇数、进度百分比条

#### Scenario: 无内容计划时显示引导卡
- **WHEN** 站点无任何 PlannedArticle
- **THEN** 概览第三区域显示引导卡：「开始你的内容计划」

#### Scenario: 始终显示健康评分详情卡和待办事项卡
- **WHEN** 概览 Tab 渲染
- **THEN** 健康评分详情卡（tech/content/GEO 三维分项）和待办事项卡（高优先级 Action Items）始终显示，不依赖集成状态

### Requirement: 全局 Top Nav 替代 Sidebar 提供站点切换和全局导航
Dashboard 所有页面 SHALL 使用全宽顶部导航栏（Top Nav）作为唯一全局导航，移除左侧 Sidebar。Top Nav 包含：Logo、站点切换器、全局功能链接、用户头像菜单。

#### Scenario: Top Nav 基础结构渲染
- **WHEN** 已登录用户访问任意 dashboard 页面
- **THEN** 页面顶部渲染全宽 Top Nav，高度 56px，包含：左侧 Logo、站点切换器、右侧功能链接（内容库/工具箱/积分）、用户头像下拉
- **THEN** 页面不渲染左侧 Sidebar

#### Scenario: 站点切换器显示当前站点
- **WHEN** 用户处于任意站点工作台页面
- **THEN** Top Nav 的站点切换器显示当前站点域名 + 下拉箭头图标

#### Scenario: 站点切换器下拉列出所有站点
- **WHEN** 用户点击站点切换器
- **THEN** 下拉菜单显示用户所有站点（域名 + 最新健康评分徽章）
- **THEN** 当前激活站点显示勾选标记
- **THEN** 列表底部固定显示「+ 添加新站点」入口，链接至 `/dashboard/onboarding`

#### Scenario: 切换站点后跳转对应工作台
- **WHEN** 用户在下拉菜单中选择另一个站点
- **THEN** 跳转至 `/dashboard/site-intelligence/[newSiteId]`，激活「概览」Tab

#### Scenario: 无站点时站点切换器显示引导文案
- **WHEN** 用户尚无任何站点
- **THEN** 站点切换器显示「添加你的网站」文字，点击跳转 `/dashboard/onboarding`

#### Scenario: 非站点页面（Library、Tools、Billing）不显示 Tab bar
- **WHEN** 用户访问 `/dashboard/library`、`/dashboard/tools`、`/dashboard/billing`
- **THEN** 页面仅显示 Top Nav，不显示站点 Tab bar
- **THEN** 对应全局功能链接在 Top Nav 中处于激活样式
