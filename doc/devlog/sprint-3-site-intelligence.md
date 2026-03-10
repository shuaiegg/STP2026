# STP2026 Development Log - Sprint 3

> **最后更新**: 2026-03-07
> **当前分支**: `roadmap`

## 🏁 目标：Site Intelligence 生产稳定化 & UX 深化

### 1. 生产稳定性修复

- **代理环境变量化**: `CrawlerService` 不再硬编码 `127.0.0.1:7897`，改为从 `CRAWLER_PROXY_HOST` / `CRAWLER_PROXY_PORT` 读取。生产环境留空则不走代理，兼容 Vercel 部署。
- **并发爬取**: 以 `Promise.allSettled` + 5并发批次替代原来的串行 `for...of` 循环，平均耗时从 300s 降至约 15-30s，解除 API Route 60s 超时瓶颈。
- **Domain 规范化**: `CrawlerService.normalizeDomain()` 统一处理：自动补全 `https://`，去除尾部斜杠，前后端共用。

### 2. 实时进度流（SSE）

- **API 升级**: `POST /api/dashboard/site-intelligence/audit` 从 JSON 响应升级为 **Server-Sent Events 流**，每爬取一批页面推送 `{type: 'progress', scanned, total, page}` 事件，扫描完成推送 `{type: 'done', graphData}`。
- **前端接入**: `page.tsx` 改用 `fetch` + `ReadableStream` 读取 SSE 流，实时更新进度条（已扫 X/Y 页，百分比）。

### 3. 前端 HUD 节点详情

- **星图节点点击**: 点击 `GalaxyMap` 中任意节点，右侧 HUD 即时展示该页完整 SEO 元数据：Title、H1、Meta Description、加载时间、词数、内链数、是否有 OG Image。

### 4. 数据层强化

- **`types.ts` 扩展**: `ScrapedPage` 新增 `wordCount`、`internalLinks`、`canonicalUrl`、`hasOgImage` 字段，`AuditProgressEvent` 接口用于 SSE 类型安全。
- **图谱拓扑重构**: `GraphGeneratorService` 从「全页连根」的星形拓扑升级为基于 **URL 路径层级** 的 Topic Cluster 树：根节点 → 一级 pillar → 深层 cluster，颜色语义化（紫/金/绿）。

### 5. Bug 修复

- `test-intelligence/route.ts`：修复了过期的 `@/lib/services` 导入路径（应为 `@/lib/skills`）。
- `GalaxyMap.tsx`：修复 `useRef<any>()` 缺少初始值导致的 TypeScript 严格模式报错。

---

**Status**: Sprint 3 COMPLETED.
**Next Step**: Sprint 4 - Data Persistence, Site Management Dashboard & Competitor Analysis.
