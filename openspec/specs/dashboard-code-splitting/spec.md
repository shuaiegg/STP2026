# dashboard-code-splitting Specification

## Purpose
Reduce initial JS bundle size for the Site Intelligence detail page by dynamically importing Tab panel components on demand, improving first-load performance.

## Requirements

### Requirement: Site Intelligence 详情页 Tab 面板使用动态导入
Site Intelligence `[siteId]` 页面的所有 Tab 面板组件 SHALL 通过 `next/dynamic` 动态导入，仅在对应 Tab 被激活时加载该面板的 JS bundle，不在首屏打包进入。

#### Scenario: 用户首次进入详情页
- **WHEN** 用户访问 `/dashboard/site-intelligence/[siteId]`，默认 Tab 为「概览」
- **THEN** 仅加载 OverviewPanel 的 JS bundle，其余 7 个面板（StrategyBoard、CompetitorsPanel 等）不被下载

#### Scenario: 用户切换到策略 Tab
- **WHEN** 用户点击「内容策略」Tab
- **THEN** 浏览器按需下载 StrategyBoard 的 JS bundle，切换期间显示 PanelSkeleton 占位

#### Scenario: 用户再次切换已加载的 Tab
- **WHEN** 用户切换到已加载过的 Tab
- **THEN** 直接显示已缓存的组件，不重新发起网络请求

### Requirement: 动态导入面板在加载期间显示骨架
每个动态导入的 Tab 面板 SHALL 在加载期间（`loading` 阶段）显示与面板内容区域尺寸接近的骨架占位，不出现内容区域空白或布局跳动。

#### Scenario: StrategyBoard 动态加载中
- **WHEN** StrategyBoard JS bundle 正在下载
- **THEN** 面板区域显示 3 列看板骨架（animate-pulse 风格）

#### Scenario: OverviewPanel 动态加载中
- **WHEN** OverviewPanel JS bundle 正在下载
- **THEN** 面板区域显示 4 个统计卡片骨架

#### Scenario: 加载失败的处理
- **WHEN** 动态 import 因网络原因失败
- **THEN** 面板区域显示错误提示，不影响其他 Tab 的正常使用

### Requirement: 动态导入不使用 SSR 渲染
依赖浏览器 API 或图表库的 Tab 面板（如 StrategyBoard、PerformanceDashboard）的 dynamic import SHALL 设置 `ssr: false`，避免服务端渲染复杂度和 hydration 不匹配问题。

#### Scenario: 服务端渲染时面板不输出 HTML
- **WHEN** 服务端渲染 Site Intelligence 详情页
- **THEN** Tab 面板区域输出骨架占位 HTML，不执行面板组件的服务端逻辑
