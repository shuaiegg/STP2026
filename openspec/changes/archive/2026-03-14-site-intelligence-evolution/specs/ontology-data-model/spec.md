## ADDED Requirements

### Requirement: SiteOntology 独立模型存储本体快照
系统 SHALL 将业务本体数据存储在独立的 `SiteOntology` 表中，支持多版本历史，不再依赖 `Site.businessOntology` JSON 字段。

#### Scenario: 新建本体时创建 SiteOntology 记录
- **WHEN** 业务 DNA 提取 API 执行成功
- **THEN** 系统创建新的 `SiteOntology` 记录，`version` 字段自动递增

#### Scenario: 查询最新本体
- **WHEN** 任意 API 需要读取本体数据
- **THEN** 系统查询该站点 `version` 最高的 `SiteOntology` 记录

### Requirement: SemanticDebt 独立模型支持查询与聚合
系统 SHALL 将语义债存储在独立的 `SemanticDebt` 表中，每条记录包含 `coverageScore`、`proofDensity`、`priorityLabel`，支持跨站点聚合查询。

#### Scenario: 语义债分析结果写入 SemanticDebt 表
- **WHEN** semantic-gap API 完成分析
- **THEN** 结果写入 `SemanticDebt` 表，关联到当前最新 `SiteOntology.id`

#### Scenario: 跨站点高优语义债可聚合查询
- **WHEN** 全局大盘需要统计高优语义债总数
- **THEN** 系统可执行 `SemanticDebt.count({ where: { priorityLabel: { contains: '高搜索' }, site: { userId } } })` 无需解析 JSON

### Requirement: 历史本体数据迁移至新表
系统 MUST 在 schema 迁移后提供数据迁移脚本，将所有 `Site.businessOntology` 的现有数据写入新表。

#### Scenario: 迁移脚本执行成功
- **WHEN** 运行迁移脚本
- **THEN** 所有非空的 `Site.businessOntology` 记录在 `SiteOntology` 和 `SemanticDebt` 表中有对应记录

#### Scenario: 迁移后旧字段向后兼容
- **WHEN** 迁移完成但旧代码仍读 `Site.businessOntology`
- **THEN** 双写期内该字段仍保留数据，不破坏现有功能
