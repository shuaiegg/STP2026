## 1. 博客图片优化 — next/image 替换

- [x] 1.1 检查 `next.config.ts` 的 `images.remotePatterns`，确认 Supabase 域名已配置；添加 `picsum.photos` 兜底域名
- [x] 1.2 将 `blog/[slug]/page.tsx` 封面图原生 `<img>` 替换为 `<Image>`，加 `priority`、`fill` 或显式 `width/height`
- [x] 1.3 将正文 ReactMarkdown 的 `img` renderer 替换为 `<Image>`，设置 `width={800} height={450}` 占位尺寸并保留 `loading="lazy"`
- [x] 1.4 将相关文章缩略图 `<img>` 替换为 `<Image>`，添加 `loading="lazy"`

## 2. Mermaid 动态加载

- [x] 2.1 在 `src/components/ui/Mermaid.tsx` 中移除顶层 `import mermaid from 'mermaid'`
- [x] 2.2 在 `useEffect` 内改为 `const mermaid = await import('mermaid')` 动态加载
- [x] 2.3 确认 `mermaid.default.initialize()` 和 `mermaid.default.run()` 调用方式正确

## 3. Recharts 懒加载 — 5 个图表组件

- [x] 3.1 将 `PerformanceDashboard.tsx` 中 recharts 导入改为 `next/dynamic` 包裹的动态组件，加 `ssr: false` 和骨架屏 fallback
- [x] 3.2 将 `Ga4PerformanceDashboard.tsx` 同上处理
- [x] 3.3 将 `CompetitorRadarChart.tsx` 同上处理
- [x] 3.4 将 `SEOScoreDashboard.tsx` 同上处理
- [x] 3.5 将 `KeywordOpportunityMatrix.tsx` 同上处理

## 4. 消除重复 API 请求

- [x] 4.1 阅读 `src/app/(protected)/layout.tsx` 中 `localStorage` 缓存键名（`stp_sites_cache` / `stp_sites_cache_time`）和 TTL 逻辑
- [x] 4.2 在 `site-intelligence/page.tsx` 中移除独立的 `useEffect` fetch `/api/dashboard/sites`
- [x] 4.3 改为在 mount 时读取 `localStorage.getItem('stp_sites_cache')`，解析并设置 sites 状态
- [x] 4.4 验证页面在 layout 缓存未过期时不再发出额外网络请求

## 5. Prisma 查询字段裁剪

- [x] 5.1 在 `dashboard/page.tsx` 的 `prisma.site.findMany()` 中添加 `select: { id: true, domain: true, name: true, _count: { select: { gscConnections: true, ga4Connections: true } } }`
- [x] 5.2 在 `dashboard/page.tsx` 的 `prisma.trackedArticle.findMany()` 中添加 `select: { id: true, title: true, status: true, createdAt: true, citationSource: true }`
- [x] 5.3 更新 TypeScript 类型推断，确认下游使用这两个查询结果的代码无类型错误

## 6. Dashboard 路由 loading.tsx

- [x] 6.1 在 `src/app/(protected)/dashboard/` 创建 `loading.tsx`（主页骨架屏：stats 卡片 + 列表占位）
- [x] 6.2 在 `src/app/(protected)/dashboard/site-intelligence/` 创建 `loading.tsx`（站点卡片列表骨架屏）
- [x] 6.3 在 `src/app/(protected)/dashboard/site-intelligence/[siteId]/` 创建 `loading.tsx`（Tab 面板骨架屏）
- [x] 6.4 在 `src/app/(protected)/dashboard/site-intelligence/instant-audit/` 创建 `loading.tsx`
- [x] 6.5 在 `src/app/(protected)/dashboard/library/` 创建 `loading.tsx`（文章列表骨架屏）
- [x] 6.6 在 `src/app/(protected)/dashboard/library/edit/[id]/` 创建 `loading.tsx`
- [x] 6.7 在 `src/app/(protected)/dashboard/billing/` 创建 `loading.tsx`
- [x] 6.8 在 `src/app/(protected)/dashboard/settings/` 创建 `loading.tsx`
- [x] 6.9 在 `src/app/(protected)/dashboard/tools/` 创建 `loading.tsx`

## 7. generate-stream DB 更新合并

- [x] 7.1 阅读 `src/app/api/generate-stream/route.ts`，标记所有 `prisma.skillExecution.update()` 调用位置
- [x] 7.2 移除流式生成过程中的中间进度 `update()` 调用（保留 execution 创建的初始 `create()`）
- [x] 7.3 在 `finally` 块中确保单次最终 `update()`，写入 `status`、`output`、`tokensUsed`、`executionTimeMs`
- [x] 7.4 在 `catch` 分支中同样执行最终 `update({ status: 'error', errorMessage })`，防止 execution 卡在 pending
