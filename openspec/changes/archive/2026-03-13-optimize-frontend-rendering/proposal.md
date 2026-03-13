## Why

前端客户端组件存在多处渲染性能问题：内联事件处理函数导致不必要的子组件重渲染、render 阶段直接执行 Array 过滤操作、昂贵计算（Markdown 解析）缺少 `useMemo`、以及 `useEffect` 中 fetch 请求无清理逻辑。这些问题在用户高频交互（表单输入、列表切换）时累积，造成明显卡顿。

## What Changes

- **`DashboardContent.tsx`** - 将导航 onClick 提取为 `useCallback`；将 `metrics.sitesOptions.filter()` 调用替换为 `useMemo` 预计算
- **`ArticleList.tsx`** - 将 `getStatusBadge()` 移出组件体，改为模块级常量 Map
- **`(protected)/layout.tsx`** - 为 `useEffect` 内 fetch 请求添加 AbortController 清理，防止内存泄漏
- **`LibraryEditor.tsx`** - 将 `parseMarkdownToSections()` 和 `calculateHumanScore()` 的计算结果用 `useMemo` 缓存
- **`dashboard/page.tsx`（Server Component）** - Prisma 查询从 `include: { gscConnections, ga4Connections }` 改为 `_count`，减少数据库过度获取
- **`CompetitorsPanel.tsx`** - 展平嵌套 `useCallback` 依赖链，避免 `siteId` 变化触发多层级联重渲染

## Capabilities

### New Capabilities
<!-- 本次为性能优化，无新增用户可见能力 -->

### Modified Capabilities
<!-- 无规范层面的行为变更，仅为实现优化 -->

## Impact

- **受影响文件**（6 个）：
  - `src/app/(protected)/dashboard/DashboardContent.tsx`
  - `src/app/(protected)/dashboard/library/ArticleList.tsx`
  - `src/app/(protected)/layout.tsx`
  - `src/app/(protected)/dashboard/library/edit/[id]/LibraryEditor.tsx`
  - `src/app/(protected)/dashboard/page.tsx`
  - `src/app/(protected)/dashboard/site-intelligence/[siteId]/components/CompetitorsPanel.tsx`
- **无 API 或数据库 schema 变更**（`_count` 是 Prisma 内置聚合，无需 migration）
- **无破坏性变更**：所有修改均为内部实现优化，UI 行为保持不变
