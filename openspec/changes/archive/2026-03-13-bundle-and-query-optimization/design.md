## Context

项目博客（公开页面）和用户 dashboard（受保护页面）共享同一 Next.js 应用。目前存在两类性能负债：

1. **Bundle 层**：Mermaid (~500KB) 和 Recharts 在顶层静态引入，无论页面是否需要都会打包进初始 JS。Five 个 Recharts 组件嵌套在 Tab 面板内，未激活 Tab 也会阻塞首次渲染。
2. **数据层**：博客封面图使用原生 `<img>` 丢失 Next.js 图片优化；Prisma 查询缺少 `select` 导致大字段（`businessOntology` JSON）无谓传输；layout 和 page 重复调用同一 API。

## Goals / Non-Goals

**Goals:**
- 博客页面替换 `<img>` → `<Image>`，改善 LCP 和 CLS
- Mermaid / Recharts 改为 `dynamic()` 减少初始 bundle
- 消除 dashboard 重复 API 请求
- Prisma 查询添加 `select` 减少数据传输
- 8 个 dashboard 路由添加 `loading.tsx` 启用 Streaming

**Non-Goals:**
- 不引入新的状态管理库或缓存中间件
- 不修改 API 路由响应结构（Site 模型字段不变）
- 不涉及 Notion Sync 流程

## Decisions

### D1：Mermaid 动态加载策略

**选择**：在 `Mermaid.tsx` 内部使用 `useEffect` + 动态 `import('mermaid')` 替代顶层静态引入。

**理由**：`next/dynamic` 适合组件级懒加载，但 Mermaid 需要在 DOM 挂载后调用 `mermaid.run()`，本身已是 effect-driven 模式，直接在 `useEffect` 内 `import()` 更自然，无需包裹额外组件层。

**替代方案**：用 `next/dynamic` 把整个 `Mermaid` 组件懒加载 — 可行但会引入额外的 loading wrapper，当前设计更简洁。

---

### D2：Recharts 懒加载粒度

**选择**：在各图表组件文件内，将 recharts 的具名导入改为动态导入，以组件为单位用 `next/dynamic` 包裹。

**理由**：Recharts 各 Chart 类型（LineChart、BarChart 等）共享同一包，不能拆分，只能整体懒加载。以组件为粒度包裹，保持调用方无感知（父组件不需要改变 import 方式）。

**替代方案**：在 Tab 父组件层用 `dynamic()` 懒加载整个面板 — 粒度更粗，会导致 Tab 切换时有明显延迟，体验更差。

---

### D3：消除重复 API 请求

**选择**：`site-intelligence/page.tsx` 改为从 `localStorage` 读取 layout 已缓存的站点数据，移除独立的 `useEffect` fetch。

**理由**：layout 已在 `localStorage` 写入 `stp_sites_cache`（含 `stp_sites_cache_time` TTL）。page.tsx 只需读取该缓存，无需重新请求。缓存失效时 layout 会自动刷新，page.tsx 监听 storage 事件或在 mount 时读取即可。

**替代方案**：引入 React Context 跨组件共享数据 — 需要重构 layout 为 Context Provider，改动范围更大，与当前架构不一致。

---

### D4：Prisma select 字段裁剪

**选择**：在 `dashboard/page.tsx` 中对两个查询显式加 `select`：
- Site：只选 `id`、`domain`、`name`、`_count`
- TrackedArticle：只选 `id`、`title`、`status`、`createdAt`、`citationSource`

**理由**：`businessOntology` 是 JSON 大字段，列表展示不需要；TrackedArticle 的 `optimizedContent`/`contentHtml` 字段可能很大，列表只需标题和状态。

---

### D5：generate-stream DB 更新合并

**选择**：移除流式过程中的中间 `prisma.update()` 进度调用，仅保留流结束（`finally` 块）的单次最终更新。

**理由**：中间进度更新对用户不可见（前端通过 stream chunk 感知进度，不依赖 DB 状态），仅增加数据库写压力。最终状态写入一次即可保证数据完整性。

---

### D6：loading.tsx 内容策略

**选择**：8 个 dashboard 路由各添加一个轻量骨架屏 `loading.tsx`，使用 TailwindCSS `animate-pulse` 占位块，无需引入额外组件库。

**理由**：Next.js App Router 的 Streaming 依赖 `loading.tsx` 文件存在，骨架屏与页面结构保持粗略对应即可，不需要像素级还原。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| `next/image` 要求配置 `remotePatterns`（Supabase URL、picsum 等） | 提前检查 `next.config.ts`，确认已有 Supabase 域名配置；添加缺失域名 |
| Mermaid 动态加载后首次渲染有短暂空白 | 保持现有 `loading` 状态展示，用户体验不变 |
| Recharts `dynamic()` 在 SSR 阶段无法渲染（`ssr: false`） | 这些组件已在 `'use client'` 文件中，本身不做 SSR，无影响 |
| localStorage 缓存读取有 TTL 风险（过期数据） | 沿用 layout 现有 TTL 逻辑（`stp_sites_cache_time`），page.tsx 遵循同样失效判断 |
| generate-stream 移除中间更新后，异常中断时 execution 状态可能卡在 pending | 在 `finally` 块中判断是否已写入，确保 error 分支也执行最终更新 |

## Migration Plan

1. 所有变更均为前端/查询层，无数据库 schema 迁移
2. 可逐文件独立部署，无相互依赖（除 D3 需 layout + page.tsx 同时更新）
3. 回滚：git revert 对应文件，无副作用
