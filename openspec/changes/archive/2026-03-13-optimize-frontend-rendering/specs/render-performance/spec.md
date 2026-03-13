## ADDED Requirements

### Requirement: 事件处理函数引用稳定
客户端组件中传递给子组件的事件处理函数 SHALL 使用 `useCallback` 包裹，确保在父组件重渲染时引用稳定，避免触发子组件不必要的重渲染。

#### Scenario: DashboardContent 导航 handler 稳定
- **WHEN** `DashboardContent` 父组件因其他状态变化重渲染
- **THEN** 导航卡片的 onClick handler 引用不变，不触发卡片重渲染

### Requirement: Render 阶段无内联数组操作
客户端组件 SHALL NOT 在 JSX 表达式中直接调用 `.filter()`、`.map()` 或其他产生新数组引用的操作。此类计算 SHALL 使用 `useMemo` 预计算。

#### Scenario: DashboardContent 连接数统计预计算
- **WHEN** `metrics.sitesOptions` 数组未发生变化
- **THEN** `gscCount` 和 `ga4Count` 不重新计算，沿用上次缓存值

### Requirement: 纯工具函数定义在组件体外
不依赖组件状态或 props 的工具函数 SHALL 定义为模块级常量（Map 或纯函数），不得在组件函数体内定义。

#### Scenario: ArticleList 状态徽章不随渲染重建
- **WHEN** `ArticleList` 组件重渲染
- **THEN** 状态徽章映射对象为模块级常量，不重新创建

### Requirement: useEffect 中的异步请求必须可取消
客户端组件在 `useEffect` 中发起的 `fetch` 请求 SHALL 使用 `AbortController`，并在 cleanup 函数中调用 `abort()`，防止组件卸载后触发 state 更新。

#### Scenario: 布局组件卸载时取消 fetch
- **WHEN** `(protected)/layout` 组件在 fetch 完成前卸载
- **THEN** fetch 请求被取消，不触发 setState，不产生内存泄漏警告

### Requirement: 昂贵的同步计算使用 useMemo 缓存
依赖输入数据、执行时间超过 1ms 的同步计算 SHALL 使用 `useMemo` 缓存，仅在依赖变化时重新计算。

#### Scenario: LibraryEditor Markdown 解析仅在内容变化时执行
- **WHEN** `LibraryEditor` 重渲染但 `initialArticle.optimizedContent` 未变化
- **THEN** `parseMarkdownToSections()` 不重新执行，直接返回缓存结果

#### Scenario: 人类评分仅在内容变化时重新计算
- **WHEN** `contentSections` 未发生变化
- **THEN** `calculateHumanScore()` 不重新执行

### Requirement: Server Component 不过度获取关联数据
当 Server Component 仅需关联记录的数量时，Prisma 查询 SHALL 使用 `_count` 聚合而非 `include` 完整关联。

#### Scenario: Dashboard 查询仅获取连接数量
- **WHEN** `getUserData()` 查询 Site 列表
- **THEN** Prisma 使用 `_count: { select: { gscConnections: true, ga4Connections: true } }` 而非拉取全部连接记录
