## MODIFIED Requirements

### Requirement: Dashboard routes display skeleton loading UI during navigation
每个 dashboard 路由 SHALL 在页面数据加载期间展示骨架屏 loading 状态，利用 Next.js App Router Streaming 机制，避免整页空白等待。

#### Scenario: 用户导航到 dashboard 主页
- **WHEN** 用户点击导航进入 `/dashboard`
- **THEN** 页面立即显示骨架屏占位内容，不出现空白屏或旋转加载图标

#### Scenario: 用户导航到 site-intelligence 列表页
- **WHEN** 用户访问 `/dashboard/site-intelligence`
- **THEN** 页面在数据加载完成前显示卡片骨架屏

#### Scenario: 用户导航到 site-intelligence 详情页
- **WHEN** 用户访问 `/dashboard/site-intelligence/[siteId]`
- **THEN** 页面在数据加载完成前显示面板骨架屏

#### Scenario: 用户导航到 library 页
- **WHEN** 用户访问 `/dashboard/library`
- **THEN** 页面在数据加载完成前显示列表骨架屏

#### Scenario: 骨架屏被实际内容替换
- **WHEN** 页面数据加载完成
- **THEN** 骨架屏被实际内容无闪烁替换

#### Scenario: StrategyBoard REFACTORING_NEEDED 骨架屏兼容
- **WHEN** StrategyBoard loading.tsx 渲染时，实际数据包含 REFACTORING_NEEDED 状态卡片
- **THEN** 骨架屏完成后，REFACTORING_NEEDED 状态卡片正确显示橙色警告标识

### Requirement: Loading UI 使用 animate-pulse 风格占位块
骨架屏 MUST 使用 TailwindCSS `animate-pulse` 灰色占位块，与页面整体布局大致对应，无需像素级还原。

#### Scenario: 骨架屏样式一致性
- **WHEN** 任意 dashboard loading.tsx 被渲染
- **THEN** 占位块使用 `bg-gray-200 animate-pulse rounded` 类，与项目设计系统一致
