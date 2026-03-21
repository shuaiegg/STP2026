## Why

站点审计系统已采集每页 18 项数据，但分析器仅使用约 60%；与此同时，爬虫缺乏熔断机制，一旦目标站点宕机将消耗全部用户积分。本次优化在不改动底层架构的前提下，系统性补齐数据利用率、修复评分模型粗糙度，并向用户提供历史 Delta 对比视图。

## What Changes

- **新增 `ORPHAN_PAGE` 问题类型**：利用已采集的 `internalLinks[]` 做反向引用分析，检测无任何内链指向的孤儿页（warning 级别）
- **新增爬虫熔断器**：连续失败 ≥5 次时立即终止并抛出友好错误，避免目标站点宕机时浪费用户积分
- **新增 `MISSING_H2` / `HEADING_HIERARCHY_BROKEN` 问题类型**：利用已采集的 `h2[]` / `h3[]` 字段检测正文无结构、标题层级跳跃
- **新增 `MISSING_VIEWPORT` 问题类型**：fetcher 新增一行采集 viewport meta，缺失则标记为 warning
- **新增 `MISSING_STRUCTURED_DATA` 问题类型**：fetcher 新增采集 JSON-LD 标签，缺失则标记为 info
- **重复内容惩罚线性化**：将二值惩罚（有/没有 = 固定 25 分）改为按重复率线性扣分
- **问题列表按影响面重排序**：同严重性内，影响页面数多的问题排前面
- **历史 Delta 对比视图**：体检报告标签页展示与上次审计相比新增/修复的问题数

## Capabilities

### New Capabilities

- `orphan-page-detection`: 基于已采集内链数据的孤儿页反向引用分析
- `crawler-circuit-breaker`: 爬虫连续失败熔断保护，防止积分浪费
- `heading-structure-analysis`: H2/H3 结构完整性检测（缺失 H2、层级跳跃）
- `mobile-seo-signals`: Viewport meta 和 Structured Data 采集与检测
- `audit-delta-comparison`: 历史审计 Delta 对比展示（新增/修复问题数）

### Modified Capabilities

- `seo-health-report`: 评分模型调整（重复内容惩罚线性化）、问题排序规则更新、新增 5 类问题类型

## Impact

- `src/lib/skills/site-intelligence/crawler/fetcher.ts` — 新增 `hasViewportMeta`、`hasStructuredData` 两个采集字段
- `src/lib/skills/site-intelligence/types.ts` — `ScrapedPage` 接口新增两个字段
- `src/lib/skills/site-intelligence/audit-analyzer.ts` — 新增 5 类问题、修复评分公式、新排序逻辑
- `src/lib/skills/site-intelligence/crawler.service.ts` — 熔断器计数器实现
- `src/components/dashboard/site-intelligence/HealthReport.tsx` — Delta 对比 UI
- `src/app/(protected)/dashboard/site-intelligence/[siteId]/page.tsx` — 向 HealthReport 传入上次审计数据
