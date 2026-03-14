# ontology-data-model Specification

## Purpose
Transition from unstructured JSON storage to a relational model for business ontology and semantic debts, enabling historical tracking and cross-site aggregation.

## Requirements
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

**变更内容**：`Site.businessOntology` 字段已从 schema 中删除，数据库列不再存在。迁移脚本 `scripts/migrate-ontology.ts` 为历史数据迁移工具，已完成使命。

#### Scenario: businessOntology 字段不再存在于数据库
- **WHEN** 查询 Site 表结构
- **THEN** 不存在 `businessOntology` 列

#### Scenario: semantic-gap API 响应使用 ontology key
- **WHEN** 前端请求 `GET /api/dashboard/sites/[siteId]/semantic-gap`
- **THEN** 响应体为 `{ success: true, data: { ontology: SiteOntology, semanticDebts: SemanticDebt[] } }`，不含 `businessOntology` key

#### Scenario: OverviewPanel 正确读取 ontology 数据
- **WHEN** OverviewPanel 渲染业务 DNA 区块
- **THEN** 从 `semanticData.ontology.coreOfferings` 和 `semanticData.ontology.painPointsSolved` 读取展示，页面无空白
