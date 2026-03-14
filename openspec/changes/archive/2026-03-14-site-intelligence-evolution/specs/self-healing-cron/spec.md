## ADDED Requirements

### Requirement: Cron job 检测 GSC 周环比流量下跌并自动标记
系统 SHALL 在定时任务中检查每个已连接 GSC 站点的搜索表现周环比变化，对核心话题流量下跌超过阈值的情况自动触发标记。

#### Scenario: 话题流量周环比下跌超过 30%
- **WHEN** Cron job 执行，某站点核心话题关键词的 GSC impressions 周环比下跌 > 30%
- **THEN** 关联的 `SemanticDebt` 记录的 `priorityLabel` 更新为包含 `⚠️ 流量下跌`

#### Scenario: 关联文章被标记为 REFACTORING_NEEDED
- **WHEN** 语义债话题被标记为流量下跌
- **THEN** keyword 与该话题相关的 `PlannedArticle` status 更新为 `REFACTORING_NEEDED`

#### Scenario: 无 GSC 连接的站点跳过检查
- **WHEN** Cron job 执行，某站点未连接 GSC
- **THEN** 该站点跳过 GSC 健康检查，不影响其他站点处理

#### Scenario: 单站点 GSC 请求失败时不中断整体 Cron
- **WHEN** 某站点的 GSC API 请求超时或返回错误
- **THEN** 该站点记录错误日志后继续处理下一个站点

### Requirement: StrategyBoard 展示 REFACTORING_NEEDED 状态标识
系统 SHALL 在看板卡片上为 `REFACTORING_NEEDED` 状态的文章展示醒目的视觉标识，提示用户该内容需要更新。

#### Scenario: REFACTORING_NEEDED 卡片视觉标识
- **WHEN** PlannedArticle.status 为 REFACTORING_NEEDED
- **THEN** 看板卡片显示橙色警告角标或 `⚠️` 标签，区别于其他状态卡片
