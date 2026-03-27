## ADDED Requirements

### Requirement: 关键词排名趋势折线图

站点工作台概览面板（`OverviewPanel`）中的"关键词趋势"占位组件 SHALL 替换为真实的排名趋势折线图，展示用户指定关键词在过去 N 次快照中的平均排名位置变化。

图表规格：
- 数据源：`SiteKeywordSnapshot`（`dimensionType = 'query'`），按 snapshotDate 排序
- 默认展示：点击数最高的前 5 个关键词
- X 轴：快照日期（显示最近 8 个快照点）
- Y 轴：排名位置（**倒置**，1 在顶部，数值越小越靠上）
- 交互：hover 显示 tooltip（关键词、日期、位置、点击数）

#### Scenario: 有两个及以上快照时渲染趋势图
- **WHEN** 用户打开站点工作台概览面板
- **AND** `SiteKeywordSnapshot` 中该 siteId 存在至少 2 个不同 snapshotDate 的 query 数据
- **THEN** 系统 SHALL 渲染折线图，每条线代表一个关键词的排名历史
- **AND** Y 轴倒置（position 1 显示在最高点）

#### Scenario: 仅有一个快照时显示引导空状态
- **WHEN** `SiteKeywordSnapshot` 中该 siteId 仅有 1 个 snapshotDate 或无数据
- **THEN** 系统 SHALL 显示空状态文案："再同步一次 GSC 数据，趋势图将在此显示"
- **AND** 提供"立即同步"按钮，触发 GSC 同步

#### Scenario: 未连接 GSC 时显示连接引导
- **WHEN** 用户未连接 GSC
- **THEN** 组件 SHALL 显示："连接 Google Search Console 后追踪关键词排名趋势"
- **AND** 提供"连接 GSC"按钮，导航至集成配置页

### Requirement: 有机流量趋势面积图

站点工作台概览面板 SHALL 将"GA4 流量组件待集成"占位替换为基于 GSC 日点击数据的有机流量趋势面积图。

说明：本组件基于 GSC 的每日点击数（`dimensions: ['date']`），不依赖 GA4 落库。数据来源为 `/api/dashboard/sites/[siteId]/gsc/performance` 实时查询返回的 `daily` 数组。

图表规格：
- X 轴：日期（最近 30 天）
- Y 轴：每日点击数
- 图表类型：面积图（Area chart），填充色使用 `brand-secondary`（`#00d4ff`）透明度 20%

#### Scenario: GSC 已连接时渲染流量面积图
- **WHEN** 用户连接了 GSC 且 performance 接口返回有效数据
- **THEN** 系统 SHALL 渲染面积图展示过去 30 天每日点击趋势
- **AND** 图表顶部展示：总点击数、总展示量、平均 CTR 三个 KPI 指标

#### Scenario: 未连接 GSC 时显示空状态
- **WHEN** 用户未连接 GSC
- **THEN** 组件 SHALL 显示空状态（与关键词趋势图保持一致的引导文案）

### Requirement: 审计评分历史趋势线

审计历史面板（`AuditHistoryPanel`）SHALL 在现有审计列表上方增加一条迷你趋势线（sparkline），展示 `techScore` 随时间的变化轨迹。

#### Scenario: 有 3 个及以上审计时显示趋势线
- **WHEN** 该 siteId 存在至少 3 条 `SiteAudit` 记录
- **THEN** 审计历史面板顶部 SHALL 渲染 sparkline，X 轴为时间，Y 轴为 techScore（0-100）
- **AND** sparkline 宽度自适应容器，高度 40px
- **AND** 最新审计点高亮标注（实心圆点 + 分数标签）

#### Scenario: 少于 3 个审计时不显示趋势线
- **WHEN** SiteAudit 记录少于 3 条
- **THEN** 趋势线区域 SHALL 不渲染（不显示空图表）

#### Scenario: 评分上升显示绿色，下降显示红色
- **WHEN** 最新审计 techScore 高于前一次
- **THEN** sparkline 线条颜色 SHALL 为 `brand-primary`（emerald，`#10b981`）
- **WHEN** 最新审计 techScore 低于前一次
- **THEN** sparkline 线条颜色 SHALL 为 `#ef4444`（red-500）
