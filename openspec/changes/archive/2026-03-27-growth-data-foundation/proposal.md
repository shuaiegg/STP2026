## Why

网站负责人无法用平台追溯增长路径：GSC 同步覆盖历史数据、GA4 不落库、文章与流量两套数据互不关联、审计分数变化只能肉眼比对。当前平台是"拍照工具"，不是"摄像机"——用户只能看到当下，无法证明任何策略在生效。

## What Changes

- **快赢**：实现已定义但未上线的 `audit-delta-comparison` spec，让每次审计自动对比上次结果（新增/修复了多少问题，分数涨跌）
- **数据基础**：新增 `SiteKeywordSnapshot` 时序表，GSC 同步改为追加快照而非覆盖；同时扩展 GSC 同步拉取 `page` 维度数据，为内容归因提供原料
- **内容归因**：将 GSC page 数据与 `Content` / `TrackedArticle` 的 URL 关联，在内容库文章卡片上展示"带来 X 次点击，平均排名 #N"
- **增长仪表板**：建设两个标注"待集成"的空组件——关键词排名趋势折线图、流量趋势面积图——以及审计评分历史趋势线

## Capabilities

### New Capabilities

- `keyword-history-snapshots`：GSC 关键词与页面数据的时序快照存储——新 Prisma 模型、同步策略改为追加、支持 query + page 双维度
- `content-traffic-attribution`：基于 GSC page 维度数据，将页面点击/展示/排名与文章记录关联，在内容库卡片上展示归因指标
- `growth-trend-dashboard`：增长仪表板可视化组件——关键词排名趋势折线图（过去 N 周）、有机流量面积图（月环比）、审计评分历史趋势线

### Modified Capabilities

- `audit-delta-comparison`：Spec 已定义，本 change 完成其实现——在 HealthReport 展示 Delta banner，在审计历史列表展示 ↑/↓ 评分箭头

## Impact

- **数据库 Schema**：新增 `SiteKeywordSnapshot` 表（需 `prisma migrate dev`）；`SiteKeyword` 保留作最新状态缓存
- **API**：`/api/dashboard/sites/[siteId]/gsc-sync/route.ts` 扩展 page 维度查询；新增 `/api/dashboard/sites/[siteId]/keyword-snapshots` 查询接口
- **组件**：`HealthReport`（加 Delta banner）、`AuditHistoryPanel`（加评分趋势）、`OverviewPanel`（填充待集成组件）、`LibraryCard`（加归因数据）
- **依赖**：无新外部依赖；GSC OAuth 权限范围不变（`webmasters.readonly` 已覆盖 page 维度）
