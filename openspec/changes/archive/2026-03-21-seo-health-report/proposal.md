## Why

星图扫描已在每次爬取中采集了 13 项页面级数据（HTTP 状态码、标题、描述、H1、加载时间、字词数、OG 图、Canonical 等），但这些数据全部被丢弃，仅用于生成星图节点的颜色和大小——用户（尤其是非技术 SEO 小白）无法从中获得任何可行动的诊断结论。同时，爬虫在 Webshare 代理池模式下的并发设置（2）与单代理相同，造成不必要的速度浪费。

## What Changes

- **新增 SEO 体检报告**：在站点控制台新增"体检报告"标签页，展示技术健康 / 内容质量 / SEO 合规三维评分，以及 15 类问题的逐条列表，每个问题附中文说明和修复指引
- **新增即时审计问题摘要**：扫描完成后，即时审计页侧边栏显示"发现问题"摘要卡片（严重 / 警告 / 提示数量 + 跳转链接）
- **新增 AuditAnalyzer 服务**：纯函数服务，接收爬虫采集的 `ScrapedPage[]`，输出 `AuditIssueReport`（评分 + 统计 + 问题列表）
- **扩展审计数据持久化**：`SiteAudit.report` JSON 中新增 `issueReport` 字段（与现有 `graphData` 并列）
- **爬虫并发提速**：区分单代理（并发 2）和 Webshare 代理池（并发 8，去除 jitter 延迟），请求超时 30s → 15s

## Capabilities

### New Capabilities

- `seo-health-report`: 站点 SEO 体检报告——问题检测、三维评分、中文说明与修复指引
- `crawler-speed-optimization`: 爬虫代理模式感知并发控制，Webshare 池模式下自动提速

### Modified Capabilities

- (none)

## Impact

**新增文件**
- `src/lib/skills/site-intelligence/audit-analyzer.ts` — 核心检测逻辑
- `src/components/dashboard/site-intelligence/HealthReport.tsx` — 体检报告 UI
- `src/components/dashboard/site-intelligence/IssueCard.tsx` — 单条问题卡片

**修改文件**
- `src/lib/skills/site-intelligence/crawler.service.ts` — 并发 + 超时优化
- `src/app/api/dashboard/site-intelligence/audit/route.ts` — `done` 事件携带 `issueReport`
- `src/app/api/dashboard/site-intelligence/save/route.ts` — 持久化 `issueReport`
- `src/app/(protected)/dashboard/site-intelligence/[siteId]/page.tsx` — 新增体检报告标签页
- `src/app/(protected)/dashboard/site-intelligence/instant-audit/page.tsx` — 侧边栏摘要

**无 schema 变更**：`SiteAudit.report` 为 `Json?` 字段，直接扩展 JSON 内容无需迁移
