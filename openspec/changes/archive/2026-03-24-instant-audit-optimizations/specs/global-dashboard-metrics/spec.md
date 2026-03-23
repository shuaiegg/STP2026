## MODIFIED Requirements

### Requirement: 全局大盘展示跨站点战略指标
系统 SHALL 在 `/dashboard` 主页展示具有战略价值的聚合指标，并根据用户数据状态（EMPTY / SETUP / ACTIVE）条件渲染不同 UI。The system SHALL explicitly exclude sites marked as `isCompetitor: true` from all aggregate metrics.

#### Scenario: 展示内容资产总数
- **WHEN** 用户访问 `/dashboard`
- **THEN** 页面展示该用户旗下所有站点 (`isCompetitor: false`) 的内容资产（PlannedArticle）总数

#### Scenario: 展示高优语义债总数
- **WHEN** 用户访问 `/dashboard`
- **THEN** 页面展示跨所有站点 (`isCompetitor: false`)、`priorityLabel` 含"高搜索"的语义债总条数

#### Scenario: 展示每站点置顶语义债摘要
- **WHEN** 用户访问 `/dashboard` 且至少有一个非竞品站点有语义债数据
- **THEN** 每个非竞品站点卡片显示其 `coverageScore` 最低的语义债话题名称

#### Scenario: 无站点时展示欢迎空状态（EMPTY 态）
- **WHEN** 用户尚未创建任何非竞品站点（`totalSites === 0`）
- **THEN** 显示欢迎空状态 UI（详见 dashboard-onboarding-checklist spec），不显示空统计数字
