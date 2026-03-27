## ADDED Requirements

### Requirement: 文章卡片展示 GSC 归因指标

内容库（`/dashboard/library`）的文章卡片 SHALL 展示该文章页面在 GSC 中最新一次快照的点击数、展示量和平均排名。归因通过 URL 后缀匹配实现：`snapshot.value` 包含 `'/' + content.slug` 即视为匹配。

展示字段：
- `clicks`：点击数（整数）
- `impressions`：展示量（整数）
- `position`：平均排名（保留 1 位小数，格式：`#8.3`）

#### Scenario: 有 GSC 数据的文章显示归因指标
- **WHEN** 内容库加载文章列表
- **AND** 文章的 slug 在 `SiteKeywordSnapshot`（`dimensionType = 'page'`）中有匹配记录
- **THEN** 文章卡片 SHALL 显示该 slug 最新 snapshotDate 对应的 clicks、impressions、position
- **AND** 数据以紧凑标签形式展示（图标 + 数字），不占用卡片主要阅读区域

#### Scenario: 无 GSC 数据的文章不显示归因区域
- **WHEN** 文章 slug 在 SiteKeywordSnapshot 中无匹配
- **OR** 用户尚未连接 GSC
- **THEN** 文章卡片 SHALL 不显示归因标签区域（隐藏，不显示占位或破折号）

#### Scenario: 多条匹配记录取最新快照
- **WHEN** 同一文章 slug 在 SiteKeywordSnapshot 中存在多个 snapshotDate 的记录
- **THEN** 系统 SHALL 仅使用 `snapshotDate` 最新一条记录的数据

### Requirement: 归因数据服务端查询

文章列表 Server Component SHALL 在加载文章列表时，并行查询该 site 最新快照日期的 page 维度数据，并在服务端完成 slug → snapshot 的匹配，将结果作为 prop 传入卡片组件。

#### Scenario: 归因查询与文章列表查询并行
- **WHEN** 服务端渲染内容库页面
- **AND** 当前用户有已连接的 GSC 且 siteId 存在
- **THEN** 系统 SHALL 在同一 `Promise.all` 中并行执行文章查询和快照查询
- **AND** 快照查询仅取最新 snapshotDate 的 page 维度数据（最多 500 行）

#### Scenario: 快照查询失败不阻断页面渲染
- **WHEN** 快照查询抛出异常
- **THEN** 文章列表 SHALL 正常渲染，归因数据缺失时按"无 GSC 数据"处理

### Requirement: TrackedArticle 同样展示归因指标

`TrackedArticle`（GEO Writer 生成的文章）SHALL 与 `Content` 采用同样的归因逻辑，通过 URL 字段匹配 GSC page 快照。

#### Scenario: TrackedArticle 归因匹配
- **WHEN** TrackedArticle 有 url 字段
- **AND** url 在 SiteKeywordSnapshot 中有匹配的 page 快照
- **THEN** 文章卡片 SHALL 展示对应 clicks、impressions、position
