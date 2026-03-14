## MODIFIED Requirements

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
