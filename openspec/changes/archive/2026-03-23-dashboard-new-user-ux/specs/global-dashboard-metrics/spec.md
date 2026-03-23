## MODIFIED Requirements

### Requirement: 全局大盘展示跨站点战略指标
系统 SHALL 在 `/dashboard` 主页展示具有战略价值的聚合指标，并根据用户数据状态（EMPTY / SETUP / ACTIVE）条件渲染不同 UI。

#### Scenario: 展示内容资产总数
- **WHEN** 用户访问 `/dashboard`
- **THEN** 页面展示该用户旗下所有站点的内容资产（PlannedArticle）总数

#### Scenario: 展示高优语义债总数
- **WHEN** 用户访问 `/dashboard`
- **THEN** 页面展示跨所有站点、`priorityLabel` 含"高搜索"的语义债总条数

#### Scenario: 展示每站点置顶语义债摘要
- **WHEN** 用户访问 `/dashboard` 且至少有一个站点有语义债数据
- **THEN** 每个站点卡片显示其 `coverageScore` 最低的语义债话题名称

#### Scenario: 无站点时展示欢迎空状态（EMPTY 态）
- **WHEN** 用户尚未创建任何站点（`totalSites === 0`）
- **THEN** 显示欢迎空状态 UI（详见 dashboard-onboarding-checklist spec），不显示空统计数字

### Requirement: Dashboard 数据层包含审计计数
系统 SHALL 在服务端 `getUserData` 函数中并行查询当前用户的 `SiteAudit` 总数，并将其作为 `auditCount` 传入客户端组件。

#### Scenario: auditCount 与其他 metrics 并行查询
- **WHEN** 服务端渲染 `/dashboard` 页面
- **THEN** `prisma.siteAudit.count({ where: { site: { userId } } })` 与其他 7 个 query 在同一 `Promise.all` 中执行

#### Scenario: auditCount 正确传入 DashboardContent
- **WHEN** `getUserData` 返回结果
- **THEN** `auditCount` 作为独立 prop 传入 `DashboardContent`，类型为 `number`，默认值 `0`
