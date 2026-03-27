## ADDED Requirements

### Requirement: SiteKeywordSnapshot 时序表存储 GSC 快照

系统 SHALL 维护 `SiteKeywordSnapshot` Prisma 模型，用于存储每次 GSC 同步时的关键词与页面性能快照。每条记录代表特定 siteId、特定 value（关键词文本或页面 URL）、特定同步日期的性能数据。

Schema:
- `id` String @id @default(cuid())
- `siteId` String（关联 Site）
- `dimensionType` String — `'query'` 或 `'page'`
- `value` String — 关键词文本（query）或完整页面 URL（page）
- `clicks` Int
- `impressions` Int
- `position` Float
- `snapshotDate` DateTime — 精确到天（当天 UTC 00:00:00）
- `createdAt` DateTime @default(now())

索引：`@@index([siteId, dimensionType, snapshotDate])`、`@@index([siteId, value, dimensionType])`

#### Scenario: 首次同步写入快照
- **WHEN** 用户触发 GSC 同步且当天尚无该 siteId 的快照
- **THEN** 系统 SHALL 为每个 query 行创建一条 `dimensionType = 'query'` 快照记录
- **AND** 为每个 page 行创建一条 `dimensionType = 'page'` 快照记录
- **AND** `snapshotDate` 设为当天 UTC 日期的午夜（`new Date().toISOString().split('T')[0] + 'T00:00:00.000Z'`）

#### Scenario: 同一天重复同步不重复写入
- **WHEN** 用户在同一天内再次触发 GSC 同步
- **THEN** 系统 SHALL 跳过快照写入（检测条件：同 siteId + snapshotDate + dimensionType 已有记录）
- **AND** 仍然更新 `SiteKeyword` 表（最新状态缓存照常 upsert）

#### Scenario: 跨天同步追加新快照
- **WHEN** 用户在距上次快照超过 24 小时后触发同步
- **THEN** 系统 SHALL 追加新一批快照记录（不覆盖历史）
- **AND** 历史快照数据完整保留

### Requirement: GSC 同步扩展 page 维度

GSC 同步路由 SHALL 在现有 `dimensions: ['query']` 请求之后，额外发起一次 `dimensions: ['page']` 的 GSC API 请求，并将结果写入 `SiteKeywordSnapshot`（`dimensionType = 'page'`）。

#### Scenario: page 维度同步成功
- **WHEN** GSC 同步触发且 OAuth token 有效
- **THEN** 系统 SHALL 同时拉取 query 和 page 两个维度的数据（rowLimit 各 500）
- **AND** page 数据写入 `SiteKeywordSnapshot`（`dimensionType = 'page'`）
- **AND** query 数据同时写入 `SiteKeyword`（upsert）和 `SiteKeywordSnapshot`（`dimensionType = 'query'`）

#### Scenario: page 维度请求失败不阻断 query 同步
- **WHEN** page 维度 API 请求抛出异常（如 403、超时）
- **THEN** 系统 SHALL catch 该异常并记录 console.error
- **AND** query 维度同步照常完成并返回成功
- **AND** 响应体包含 `pagesSynced: 0` 和 `pagesError: <message>`

### Requirement: 快照数据量控制

系统 SHALL 在每次快照写入完成后，检查该 siteId 的快照总数，若超过 104 批次（约 2 年），删除最旧的一批快照。

#### Scenario: 快照批次超限触发清理
- **WHEN** 快照写入后，同一 siteId 的 distinct snapshotDate 数量超过 104
- **THEN** 系统 SHALL 删除最早 snapshotDate 对应的所有快照行
- **AND** 清理操作在同步响应返回后异步执行（不阻断响应）
