## Context

`site-intelligence-evolution` 完成后，`SiteOntology` 和 `SemanticDebt` 已独立建表，`ontology` API 和 `semantic-gap` API 均已切换到新表读写。`Site.businessOntology Json?` 字段已加 `@deprecated` 注释，但：

1. 数据库列仍然存在（占用存储，造成 schema 混乱）
2. `semantic-gap` API 在响应体中使用 `businessOntology` 作为 key 名返回 `SiteOntology` 对象，与废弃的 DB 字段同名，阅读代码时极易混淆

## Goals / Non-Goals

**Goals:**
- 从 schema 和数据库中彻底删除 `Site.businessOntology` 列
- 将 `semantic-gap` 响应 key 改为语义准确的 `ontology`
- 更新 OverviewPanel 中对应的读取引用

**Non-Goals:**
- 不涉及任何业务逻辑变更
- 不修改 `SiteOntology`、`SemanticDebt` 模型结构
- 不影响其他 API 路由

## Decisions

### D1：直接删除 businessOntology 字段

**选择**：从 schema 删除字段后直接 `prisma migrate dev`，不做软迁移。

**理由**：已确认无任何代码向该字段写入（ontology API 只写 `SiteOntology` 表，不更新 `Site.businessOntology`）。历史数据可能存在于老记录中，但新架构不依赖，可安全丢弃。

**前置确认**：执行前用 `SELECT COUNT(*) FROM "Site" WHERE "businessOntology" IS NOT NULL` 确认影响行数，如有历史数据需告知用户。

### D2：response key 改名为 ontology

**选择**：在 `semantic-gap` 路由的两处 `NextResponse.json` 中将 `businessOntology: latestOntology` 改为 `ontology: latestOntology`，OverviewPanel 同步更新读取 key。

**理由**：该 key 返回的是 `SiteOntology` 表的记录对象，叫 `ontology` 语义准确。改名范围极小（2 处 API + 3 处前端引用），风险极低。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 老 Site 记录的 `businessOntology` 历史数据永久丢失 | migration 前执行 SQL 确认现有数据量；如有数据运行 `scripts/migrate-ontology.ts` 补跑一次 |
| OverviewPanel key 改名后漏改导致 UI 空白 | 改名后全局搜索 `businessOntology` 确认无残留引用 |
