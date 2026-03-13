## 1. DashboardContent.tsx — 稳定引用 & 预计算

- [x] 1.1 在 `DashboardContent` 中导入 `useCallback` 和 `useMemo`
- [x] 1.2 将导航卡片的 onClick 内联 handler 提取为 `useCallback(fn, [router])`
- [x] 1.3 用 `useMemo` 预计算 `gscCount` 和 `ga4Count`（替换 JSX 内的 `.filter()` 调用）

## 2. ArticleList.tsx — 模块级工具函数

- [x] 2.1 将 `getStatusBadge()` 函数移出组件体，改为模块级 `const STATUS_BADGE: Record<string, ReactNode>` Map 对象
- [x] 2.2 更新组件内对 `getStatusBadge(status)` 的调用为 `STATUS_BADGE[status]`

## 3. (protected)/layout.tsx — fetch 清理

- [x] 3.1 在 `useEffect` 中创建 `AbortController`，将 `signal` 传入 `fetch` 请求
- [x] 3.2 在 cleanup 函数中调用 `controller.abort()`
- [x] 3.3 在 `.catch()` 中处理 `AbortError`（直接 return，不更新 state）

## 4. LibraryEditor.tsx — useMemo 替代 useEffect+setState

- [x] 4.1 将 `parseMarkdownToSections(initialArticle.optimizedContent)` 改为 `useMemo`，依赖 `[initialArticle.optimizedContent]`
- [x] 4.2 将 `calculateHumanScore(joinSectionsToMarkdown(contentSections))` 改为 `useMemo`，依赖 `[contentSections]`
- [x] 4.3 删除这两个计算对应的 `useEffect` 钩子（共 2 个）
- [x] 4.4 更新 `setContentSections` 的初始值直接使用 `useMemo` 结果（如需要）

## 5. dashboard/page.tsx — Prisma _count 优化

- [x] 5.1 将 `include: { gscConnections: true, ga4Connections: true }` 替换为 `_count: { select: { gscConnections: true, ga4Connections: true } }`
- [x] 5.2 更新 `metrics` 中 `hasGsc` 和 `hasGa4` 的判断：从 `.gscConnections?.length > 0` 改为 `._count.gscConnections > 0`
- [x] 5.3 更新 TypeScript 类型（如有显式类型注解需更新）

## 6. CompetitorsPanel.tsx — 展平 useCallback 依赖

- [x] 6.1 删除独立的 `fetchCompetitors` 和 `fetchMarketGap` 两个 `useCallback`
- [x] 6.2 将两者逻辑合并到单个 `fetchData = useCallback(async () => { ... }, [siteId])` 中
- [x] 6.3 验证 `useEffect(() => { fetchData() }, [fetchData])` 仍正常工作
