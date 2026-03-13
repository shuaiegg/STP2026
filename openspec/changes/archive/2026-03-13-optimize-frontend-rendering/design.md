## Context

代码库使用 Next.js 16 App Router，客户端组件通过 `'use client'` 声明。审计发现 6 个文件存在经典 React 渲染性能反模式：内联函数引用不稳定、render 内执行过滤/映射、昂贵计算未缓存、异步操作缺少清理、以及 Prisma 过度获取数据。这些问题均可通过 React 标准 hooks（`useCallback`、`useMemo`）和 Prisma `_count` 修复，风险极低。

## Goals / Non-Goals

**Goals:**
- 消除 `DashboardContent` 中不稳定的 onClick 引用和 render 内 `.filter()` 调用
- 将 `ArticleList` 中的工具函数移出组件体，避免每次渲染重建
- 为 `layout.tsx` 的 fetch 添加 AbortController，防止组件卸载后的内存泄漏
- 用 `useMemo` 缓存 `LibraryEditor` 的昂贵 Markdown 解析结果
- 将 `dashboard/page.tsx` 的 Prisma 查询改为 `_count` 聚合，减少数据传输
- 展平 `CompetitorsPanel` 的嵌套 `useCallback` 依赖链

**Non-Goals:**
- 不重构 `geo-writer/page.tsx`（1721行）或 `EditForm.tsx`（908行）— 范围太大，另立变更
- 不添加 Suspense 边界（需要更大架构调整）
- 不引入任何新依赖

## Decisions

**决策 1：使用 `useCallback` 而非提取到组件外**
- 导航 handler 需要访问 `router` 和 `localStorage`，不能是纯模块级函数
- 使用 `useCallback(fn, [router])` 确保依赖稳定时引用不变

**决策 2：`getStatusBadge` 改为模块级 Map 常量而非 `useCallback`**
- 该函数是纯映射（status string → JSX），无需访问组件状态
- 用 `const STATUS_BADGE_MAP: Record<string, ReactNode> = {...}` 替代，完全消除重建开销

**决策 3：`LibraryEditor` 用 `useMemo` 替代 `useEffect + setState`**
- 当前模式：`useEffect` 计算 → `setState` → 触发额外渲染
- 改为：`useMemo` 直接在渲染时返回计算结果，消除一次额外渲染
- 注意：`calculateHumanScore` 依赖 `contentSections`，串联 `useMemo` 即可

**决策 4：Prisma `_count` 替代 `include`**
- `include: { gscConnections: true }` 会拉取所有连接行的全部字段
- `_count: { select: { gscConnections: true, ga4Connections: true } }` 只返回计数
- 仅影响 `dashboard/page.tsx` 的数据读取逻辑，`metrics` 对象结构不变

**决策 5：CompetitorsPanel 展平为单个 `useCallback`**
- 将 `fetchCompetitors` 和 `fetchMarketGap` 的逻辑内联到一个 `fetchData` 中
- 只保留 `[siteId]` 作为依赖，消除中间层级联

## Risks / Trade-offs

- [风险] `useMemo` 替代 `useEffect+setState` 后，Markdown 解析在每次渲染时同步执行 → 缓解：`useMemo` 只在依赖变化时重新计算，与之前 `useEffect` 的触发时机一致，且少一次渲染
- [风险] AbortController 取消 fetch 可能使错误处理逻辑触发 → 缓解：在 catch 中判断 `err.name === 'AbortError'` 直接 return
- [风险] `_count` 查询方式变更后 `metrics` 中计数字段需对应更新 → 缓解：`hasGsc`/`hasGa4` 的判断从 `gscConnections.length > 0` 改为 `_count.gscConnections > 0`，逻辑等价
