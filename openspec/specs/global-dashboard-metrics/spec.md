# global-dashboard-metrics Specification

## Purpose
Provide a high-level strategic overview of content assets and semantic gaps across all managed sites on the main dashboard.

## Requirements
### Requirement: 全局大盘展示跨站点战略指标
系统 SHALL 在 `/dashboard` 主页展示具有战略价值的聚合指标，替代原有的操作级流水账。

#### Scenario: 展示内容资产总数
- **WHEN** 用户访问 `/dashboard`
- **THEN** 页面展示该用户旗下所有站点的内容资产（PlannedArticle）总数

#### Scenario: 展示高优语义债总数
- **WHEN** 用户访问 `/dashboard`
- **THEN** 页面展示跨所有站点、`priorityLabel` 含"高搜索"的语义债总条数

#### Scenario: 展示每站点置顶语义债摘要
- **WHEN** 用户访问 `/dashboard` 且至少有一个站点有语义债数据
- **THEN** 每个站点卡片显示其 `coverageScore` 最低的语义债话题名称

#### Scenario: 无站点时展示空状态引导
- **WHEN** 用户尚未创建任何站点
- **THEN** 显示引导卡片，提示用户添加第一个站点
