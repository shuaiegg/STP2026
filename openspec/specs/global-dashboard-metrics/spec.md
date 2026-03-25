# global-dashboard-metrics Specification

## Purpose
Provide a high-level strategic overview of content assets and semantic gaps across all managed sites on the main dashboard.

## Requirements
### Requirement: `/dashboard` 主页根据站点数量执行智能路由
系统 SHALL 在服务端渲染 `/dashboard` 时，根据当前用户的站点数量执行不同的路由策略，而非始终渲染通用大盘页面。

#### Scenario: 用户无站点时跳转引导页
- **WHEN** 用户访问 `/dashboard` 且 `totalSites === 0`
- **THEN** 服务端执行 `redirect('/dashboard/onboarding')`
- **THEN** 不渲染任何大盘内容

#### Scenario: 用户有且仅有 1 个站点时跳转工作台
- **WHEN** 用户访问 `/dashboard` 且 `totalSites === 1`
- **THEN** 服务端执行 `redirect('/dashboard/site-intelligence/${siteId}')`
- **THEN** 不渲染大盘页面，减少一次用户点击

#### Scenario: 用户有多个站点时显示站点选择器
- **WHEN** 用户访问 `/dashboard` 且 `totalSites > 1`
- **THEN** 页面渲染站点选择器，以卡片网格形式展示所有站点
- **THEN** 每张站点卡片显示：域名、最新综合健康评分（或「未评分」）、上次审计时间、「进入工作台」按钮
- **THEN** 页面顶部提供「添加新站点」按钮，链接至 `/dashboard/onboarding`

#### Scenario: 站点选择器卡片点击进入工作台
- **WHEN** 用户点击任意站点卡片的「进入工作台」
- **THEN** 跳转至 `/dashboard/site-intelligence/[siteId]`

### Requirement: Dashboard 数据层包含审计计数
系统 SHALL 在服务端 `getUserData` 函数中并行查询当前用户的 `SiteAudit` 总数，并将其作为 `auditCount` 传入客户端组件。

#### Scenario: auditCount 与其他 metrics 并行查询
- **WHEN** 服务端渲染 `/dashboard` 页面
- **THEN** `prisma.siteAudit.count({ where: { site: { userId } } })` 与其他 7 个 query 在同一 `Promise.all` 中执行

#### Scenario: auditCount 正确传入 DashboardContent
- **WHEN** `getUserData` 返回结果
- **THEN** `auditCount` 作为独立 prop 传入 `DashboardContent`，类型为 `number`，默认值 `0`
