## Context

站点审计的数据管道分三层：**fetcher**（HTTP 采集原始字段）→ **audit-analyzer**（纯函数问题检测）→ **HealthReport UI**（展示层）。当前数据采集完整，但下游分析层使用率不足，且爬虫层缺乏失败隔离。本次所有改动均在现有架构内进行，无需 DB schema 变更。

## Goals / Non-Goals

**Goals:**
- 零成本利用已采集但未使用的 H2/H3、internalLinks 字段
- 新增两个 fetcher 字段（viewport meta、JSON-LD）以支持新检测项
- 实现熔断器防止积分空耗
- 修正评分公式粗糙问题
- 在现有体检报告 UI 追加 Delta 对比视图

**Non-Goals:**
- 不引入新的外部 API 依赖（如 PageSpeed Insights、Lighthouse）
- 不修改 Prisma schema（沿用 `SiteAudit.report` JSON 字段）
- 不实现按页面重要性加权评分
- 不实现 hreflang 多语言支持

## Decisions

### 1. 孤儿页检测：纯计算，单次遍历

**方案**：在 `analyzeAudit` 中构建一个 `referencedUrls: Set<string>`，遍历所有页面的 `internalLinks[]` 写入，再遍历所有页面 URL 检查是否在集合中。时间复杂度 O(n×m)，n=页面数，m=平均内链数，100 页以内完全无感知延迟。

**备选**：在爬虫层采集"被引用次数"字段。被否：爬虫层已足够复杂，分析逻辑应集中在 analyzer。

### 2. 熔断器：计数器 + 早退

**方案**：在 `crawlWithConcurrency` 的错误处理中维护一个 `consecutiveFailures` 计数器。每次成功请求重置为 0，失败递增；达到阈值 5 时抛出 `CrawlerCircuitBreakerError`，上层 `performFullAuditWithProgress` 捕获后向 SSE 推送 `{ type: 'error' }` 事件。

**阈值选择**：5 次连续失败。理由：单次失败可能是临时网络抖动；5 次连续说明站点可达性有根本问题。

**备选**：基于失败率而非连续次数。被否：对于小站点（<20 页），比例计算不稳定。

### 3. 新增 fetcher 字段：最小化侵入

两个新字段直接在 `fetchPage` 的 Cheerio 解析块内添加：
```typescript
hasViewportMeta: !!$('meta[name="viewport"]').length,
hasStructuredData: !!$('script[type="application/ld+json"]').length,
```
同步在 `ScrapedPage` 类型和 `types.ts` 中新增对应字段（均为 `boolean`，非 optional，默认 false）。

### 4. 重复内容惩罚线性化

**现有逻辑**：`has(duplicates) ? 25 : 0`（二值）

**新逻辑**：
```
duplicatePageRatio = affectedByDuplicates / totalPages
duplicatePenalty = duplicatePageRatio × 25
```
其中 `affectedByDuplicates` = 涉及重复 title 或重复 description 的页面总数（去重）。

**效果**：1 个重复对 100 页站点扣 ~0.25 分；50 页重复扣 12.5 分，比原来的一刀切 25 分更准确。

### 5. 问题排序：严重性优先，次排影响面

```typescript
severityWeight = { critical: 3, warning: 2, info: 1 }
priorityScore = severityWeight[issue.severity] * 1000 + issue.affectedPages.length
```
乘以 1000 确保严重性绝对优先于影响面，影响面仅在同严重性内排序。

### 6. Delta 对比：前端计算，无需新 API

`/api/dashboard/sites/[siteId]/audits` 已返回最近 5 次审计的 `issueReport`。在 `[siteId]/page.tsx` 中，取 `audits[1].issueReport`（上一次）与 `audits[0].issueReport`（最新）做 issue code 集合差运算：

```
newIssues = current.issues.map(i => i.code) - previous.issues.map(i => i.code)
fixedIssues = previous.issues.map(i => i.code) - current.issues.map(i => i.code)
```

结果以 props 传入 `HealthReport`，组件顶部显示 Delta banner。

## Risks / Trade-offs

- **孤儿页误报**：首页、sitemap 中的入口页可能只通过 sitemap 链接而非内页链接。`internalLinks[]` 仅包含抓取到的页面中的链接，若首页未被抓取（如超出 100 页采样），该页面可能被误判为孤儿页。→ 缓解：将根域名（root node URL）自动加入 `referencedUrls`，避免首页误报。

- **熔断假阳性**：目标站点个别路径全部 404（如 `/blog/*` 均不存在），但主站正常，可能触发熔断。→ 接受：连续 5 次 4xx/5xx 说明采样页面结构异常，终止比继续浪费积分更合理。

- **Delta 对比依赖历史数据**：首次审计或历史审计无 issueReport（旧格式）时无法对比。→ HealthReport 展示 Delta 时做 null 检查，无历史数据则隐藏 Delta banner。

- **两个新 fetcher 字段向后兼容**：旧审计记录的 issueReport 中无这两个字段。→ analyzer 中对 `hasViewportMeta ?? false` 做空值兜底，不影响历史数据展示。

## Migration Plan

无需 DB migration。所有变更为代码层面：
1. 部署后新扫描自动携带新字段和新问题类型
2. 历史审计记录保持原样，HealthReport 展示时对缺失字段做空值兜底
3. 无回滚风险，评分变化属预期行为（向用户提示"评分模型已升级"可选）
