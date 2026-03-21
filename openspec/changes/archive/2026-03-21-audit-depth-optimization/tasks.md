## 1. Fetcher 新字段采集（P1 前置）

- [x] 1.1 在 `crawler/fetcher.ts` 的 Cheerio 解析块中新增 `hasViewportMeta: !!$('meta[name="viewport"]').length`
- [x] 1.2 在 `crawler/fetcher.ts` 中新增 `hasStructuredData: !!$('script[type="application/ld+json"]').length`
- [x] 1.3 在 `types.ts` 的 `ScrapedPage` 接口中新增 `hasViewportMeta: boolean` 和 `hasStructuredData: boolean`

## 2. 爬虫熔断器（P0）

- [x] 2.1 在 `crawler.service.ts` 的 `crawlWithConcurrency` 中声明 `let consecutiveFailures = 0` 计数器
- [x] 2.2 在请求成功时重置计数器为 0，在网络错误/超时/HTTP 5xx 时递增
- [x] 2.3 当 `consecutiveFailures >= 5` 时抛出包含中文提示的 `CrawlerCircuitBreakerError`
- [x] 2.4 在 `performFullAuditWithProgress` 中捕获 `CrawlerCircuitBreakerError`，向 SSE 推送 `{ type: 'error', error: '站点无法访问，已停止扫描以保护您的积分' }`
- [x] 2.5 确保 HTTP 4xx 不触发熔断计数器（只记为 DEAD_LINK）

## 3. audit-analyzer 新增问题类型（P0/P1）

- [x] 3.1 新增 `ORPHAN_PAGE`（warning）：构建 `referencedUrls Set`，遍历所有页面 `internalLinks[]`，检测未被引用的非根域名页面
- [x] 3.2 确保根域名 URL 自动加入 `referencedUrls`，不被误报为孤儿页
- [x] 3.3 新增 `MISSING_H2`（warning）：`wordCount > 100 && h2.length === 0` 时报告
- [x] 3.4 新增 `HEADING_HIERARCHY_BROKEN`（info）：`h1非空 && h2.length === 0 && h3.length > 0` 时报告
- [x] 3.5 新增 `MISSING_VIEWPORT`（warning）：`(hasViewportMeta ?? false) === false` 时报告
- [x] 3.6 新增 `MISSING_STRUCTURED_DATA`（info）：`(hasStructuredData ?? false) === false` 时报告
- [x] 3.7 为每个新问题类型添加中文 `title`、`explanation`、`howToFix` 说明

## 4. 评分模型修复（P1）

- [x] 4.1 将 `seoScore` 中的重复内容惩罚从二值（`hasDuplicates ? 25 : 0`）改为线性 ：`(affectedByDuplicates / totalPages) × 25`
- [x] 4.2 `affectedByDuplicates` = 涉及重复 title 或重复 description 的页面集合大小（Set去重）

## 5. 问题排序优化（P2）

- [x] 5.1 将 `issues` 的排序逻辑改为：先按 `severityWeight`（critical=3, warning=2, info=1）降序，再按 `affectedPages.length` 降序
- [x] 5.2 排序公式：`severityWeight × 1000 + affectedPages.length`，确保严重性绝对 优先

## 6. HealthReport Delta 对比视图（P3）

- [x] 6.1 在 `HealthReport` 组件接口新增 `previousIssueReport?: HealthReportProps['issueReport']` prop
- [x] 6.2 在组件内计算 `newIssues`（当前有、上次无的 issue codes）和 `fixedIssues` （上次有、当前无的 issue codes）
- [x] 6.3 当 `previousIssueReport` 非空时，在三维评分卡上方渲染 Delta banner，显示"比上次新增 N 个问题，修复了 M 个问题"
- [x] 6.4 无变化时显示\"与上次审计相比无变化\"；全部修复时显示绿色提示
- [x] 6.5 在 `[siteId]/page.tsx` 中取 `audits[1]?.issueReport ?? null` 作为 `previousIssueReport` 传入 `HealthReport`
