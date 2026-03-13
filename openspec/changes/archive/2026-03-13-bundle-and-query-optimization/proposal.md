## Why

随着项目功能迭代，前端积累了多处 bundle 膨胀问题（Mermaid、Recharts 静态引入）、博客核心页面 LCP 指标受损（原生 `<img>`）、以及 Prisma 查询过度拉取数据，这些问题在用户量增长后会显著影响页面性能和数据库负载。

## What Changes

- **`src/app/(public)/blog/[slug]/page.tsx`** — 将封面图、Markdown 正文图、相关文章缩略图的原生 `<img>` 全部替换为 Next.js `<Image>` 组件，添加 `width`/`height`/`priority`
- **`src/components/ui/Mermaid.tsx`** — 将顶层静态 `import mermaid from 'mermaid'` 改为运行时动态加载，消除 ~500KB 初始 bundle
- **5 个 Recharts 图表组件** — 将 `PerformanceDashboard`、`Ga4PerformanceDashboard`、`CompetitorRadarChart`、`SEOScoreDashboard`、`KeywordOpportunityMatrix` 改为 `dynamic()` 懒加载，Tab 未激活时不加载
- **`src/app/(protected)/layout.tsx` + `site-intelligence/page.tsx`** — 消除重复的 `/api/dashboard/sites` 请求，page.tsx 改为复用 layout 已缓存数据
- **`src/app/(protected)/dashboard/page.tsx`** — 为 Site 查询添加 `select` 排除 `businessOntology` 大字段；`trackedArticle.findMany()` 添加 `select` 只取列表所需字段
- **8 个 dashboard 路由** — 添加 `loading.tsx` 启用 Next.js Streaming + 骨架屏
- **`src/app/api/generate-stream/route.ts`** — 将流式生成过程中 3-4 次独立 `prisma.update()` 合并为流结束后的单次写入

## Capabilities

### New Capabilities
- `dashboard-loading-ui`: 为所有 dashboard 路由添加 Next.js Streaming 骨架屏 loading 状态

### Modified Capabilities
<!-- 本次均为实现层优化，无规范层行为变更 -->

## Impact

- **受影响文件**（15 个）：
  - `src/app/(public)/blog/[slug]/page.tsx`
  - `src/components/ui/Mermaid.tsx`
  - `src/app/(protected)/dashboard/site-intelligence/[siteId]/components/PerformanceDashboard.tsx`
  - `src/app/(protected)/dashboard/site-intelligence/[siteId]/components/Ga4PerformanceDashboard.tsx`
  - `src/components/charts/CompetitorRadarChart.tsx`
  - `src/components/charts/SEOScoreDashboard.tsx`
  - `src/components/charts/KeywordOpportunityMatrix.tsx`
  - `src/app/(protected)/layout.tsx`
  - `src/app/(protected)/dashboard/site-intelligence/page.tsx`
  - `src/app/(protected)/dashboard/page.tsx`
  - `src/app/api/generate-stream/route.ts`
  - 新增：8 个 `loading.tsx` 文件（各 dashboard 路由）
- **无 API 或数据库 schema 变更**
- **无破坏性变更**：所有修改均为内部实现优化，UI 行为保持不变
- **预期收益**：博客页面 LCP 改善、初始 JS bundle 减少约 500KB+（Mermaid）+ Recharts 按需加载、dashboard 数据库查询数据量降低
