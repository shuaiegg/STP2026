## ADDED Requirements

### Requirement: 看板拖拽后批量更新同列所有文章的排序
系统 SHALL 在文章拖拽结束时，将目标列中所有文章的 `kanbanOrder` 以原子事务批量更新，确保数据库排序与 UI 完全一致。

#### Scenario: 同列内拖拽重排
- **WHEN** 用户在同一 Pillar 列内拖拽文章改变顺序
- **THEN** 该列所有文章的 `kanbanOrder` 被批量更新，顺序与 UI 一致

#### Scenario: 跨列拖拽
- **WHEN** 用户将文章从 Pillar A 拖拽到 Pillar B
- **THEN** 原列和目标列的所有文章 `kanbanOrder` + `contentPlanId` 均被批量更新

#### Scenario: 网络失败时回滚 UI
- **WHEN** 批量更新 API 请求失败
- **THEN** StrategyBoard UI 回滚到拖拽前的排列状态，并显示错误提示

### Requirement: 策略生成防止重复计划累积
系统 SHALL 在 `/strategy/generate` 执行前检查是否已存在活跃的内容计划，若存在则提示用户确认是否覆盖，而非静默追加。

#### Scenario: 已有计划时生成新策略
- **WHEN** 站点已有 ContentPlan 记录时用户触发生成
- **THEN** 系统返回 `{ conflict: true, existingCount: N }`，前端展示确认对话框

#### Scenario: 用户确认覆盖
- **WHEN** 用户在确认对话框中选择"重新生成"
- **THEN** 旧计划状态更新为 ARCHIVED，生成新计划
