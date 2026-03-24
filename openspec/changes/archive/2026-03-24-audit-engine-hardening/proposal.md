## Why

通过对自身站点（scaletotop.com）运行站点审计工具进行横向验证，发现审计引擎存在 **3 个代码级 bug、5 个逻辑设计缺陷、4 个 UX 交互问题**，导致：

1. **中文站点词数统计系统性误报**：按空格分词对中文失效，所有中文内容页均被标记为"薄内容"
2. **积分白扣**：审计失败无退款逻辑，熔断器触发后用户积分消失
3. **数据丢失**：扫描完成无自动保存，关闭 Tab 则审计结果丢失（同样无积分补偿）
4. **Business DNA 功能完全静默失败**：正则双重转义导致 JSON 永远匹配不到
5. **历史审计链接断开**：`AuditHistoryPanel` 使用错误的 URL 参数，从站点详情页跳转即时审计后显示空状态

本次变更在不修改 DB schema、不引入新依赖的前提下，系统性修复上述问题。

## What Changes

### Bug 修复（P0）

- **CJK 词数统计修复**：`parser.ts` 的 `wordCount` 改为对中文字符用字符数估算（1 中文字符 ≈ 0.6 英文词），解决所有中文页面的 `THIN_CONTENT` 系统性误报
- **Business DNA 正则修复**：`crawler.service.ts:343` 将 `/\\{[\\s\\S]*\\}/` 修正为 `/\{[\s\S]*\}/`，与 `clusterPages` 的正则对齐
- **AuditHistoryPanel URL 参数修复**：将 `?site=` 改为 `?siteId=`，恢复从站点历史页跳转即时审计的功能

### 积分保护（P0）

- **审计失败自动退款**：爬虫熔断器触发时，在 SSE error 事件推送后调用退款逻辑，归还本次审计积分
- **审计完成自动保存**：`done` 事件收到后自动触发 `handleSaveSite`，无需用户手动点"持久化同步"；如站点未绑定则提示用户保存

### 逻辑修复（P1）

- **MISSING_SITEMAP 新增检测项**：`CrawlerStrategy.crawlSitemap` 返回空时，在 `issueReport` 中新增 warning 级别的 `MISSING_SITEMAP` 问题
- **Canonical 扣分迁移**：将 `techScore` 中的 `canonicalMissingRate × 30` 扣分移至 `seoScore`，技术分仅衡量可访问性与性能
- **LLM 聚类前过滤**：`clusterPages` 调用前用 `isBlacklistedTopic` 对 URL path 进行预筛选，移除登录页、隐私页等无效页面
- **TOPIC_BLACKLIST 中文扩充**：补充常见中文 boilerplate 路径关键词（登录、注册、隐私、条款等）
- **ORPHAN_PAGE 排除 sitemap 页面**：`analyzeAudit` 接收 sitemap URL 列表，sitemap 已收录的页面不标记为孤儿
- **sampleUrls 改为确定性采样**：用 URL 字符串哈希替换 `Math.random()`，同一站点两次审计采样结果一致，历史分数可比

### UX 打磨（P2）

- **状态文案本地化**：将 `status` 枚举值映射为中文说明（"正在探测站点结构…"、"页面扫描中…"等），不再显示原始常量
- **历史记录无数据态处理**：第 6 条以后的历史记录显示"点击重新加载"按钮，触发单条审计 fetch，而非静默无反应
- **错误提示 Toast 化**：将 `alert()` 替换为 `toast.error()`，与全站 `sonner` 体系一致
- **节点详情关联 issue**：选中星图节点时，侧边面板展示该 URL 命中的具体 SEO 问题列表（从 `issueReport.issues` 过滤）
- **Delta 对比增强**：在 issue code 出现/消失的基础上，新增对受影响页面数变化的对比（如"DUPLICATE_TITLE 受影响页面从 5 页减少到 2 页"）
- **历史审计趋势修正**：`scoreTrend` 改为与被查看审计的"前一条"比较，而非始终与 `auditHistory[1]` 比较

## Capabilities

### New Capabilities

- `missing-sitemap-detection`：sitemap 缺失检测，warning 级别，引导用户生成 sitemap
- `audit-autosave`：审计完成自动保存，保护积分与数据不丢失
- `audit-failure-refund`：熔断器触发时自动退还积分

### Modified Capabilities

- `cjk-wordcount`：词数统计支持 CJK 混合内容，THIN_CONTENT 阈值和计算方式同步调整
- `seo-health-report`：评分模型修正（canonical 移入 seoScore）、新增 MISSING_SITEMAP、ORPHAN_PAGE 排除 sitemap 页面
- `llm-page-clustering`：聚类前预过滤 boilerplate 页面，节省 LLM token 消耗
- `audit-history-ux`：历史记录链接修复、按需加载、趋势计算修正
- `node-detail-panel`：节点点击详情与 issueReport 数据联动
- `audit-delta-comparison`：Delta 对比粒度从 issue code 增强到受影响页面数

## Impact

- `src/lib/skills/site-intelligence/crawler/parser.ts` — wordCount CJK 修复
- `src/lib/skills/site-intelligence/crawler.service.ts` — DNA 正则修复、clusterPages 预过滤、sampleUrls 确定性采样
- `src/lib/skills/site-intelligence/crawler/strategy.ts` — sitemap 发现状态透传
- `src/lib/skills/site-intelligence/audit-analyzer.ts` — MISSING_SITEMAP、ORPHAN_PAGE sitemap 感知、canonical 扣分迁移
- `src/lib/skills/site-intelligence/constants.ts` — TOPIC_BLACKLIST 中文扩充
- `src/lib/skills/site-intelligence/types.ts` — AuditProgressEvent / SiteAuditResult 新增 sitemapFound 字段
- `src/app/api/dashboard/site-intelligence/audit/route.ts` — 失败退款逻辑
- `src/app/(protected)/dashboard/site-intelligence/instant-audit/page.tsx` — 自动保存、状态文案、趋势修正
- `src/app/(protected)/dashboard/site-intelligence/[siteId]/components/AuditHistoryPanel.tsx` — URL 参数修复、按需加载
- `src/components/dashboard/site-intelligence/HealthReport.tsx` — Delta 增强
- `src/components/dashboard/site-intelligence/IssueCard.tsx` — 节点 issue 联动复用
