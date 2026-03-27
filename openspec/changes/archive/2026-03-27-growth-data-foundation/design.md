## Context

当前 GSC 同步（`gsc-sync/route.ts`）只拉 `dimensions: ['query']`，且每次以 upsert 方式覆盖 `SiteKeyword` 表，导致历史排名数据永久丢失。GA4 数据完全不落库，每次实时查询。两个"待集成"仪表板组件（关键词趋势、GA4 流量趋势）已有占位符但无数据支撑。`audit-delta-comparison` 的 spec 已定义完整需求，但 UI 实现尚未完成。

核心问题：**没有时序数据，就没有趋势；没有趋势，增长就无法被证明。**

## Goals / Non-Goals

**Goals:**
- 建立 `SiteKeywordSnapshot` 时序表，GSC 同步改为追加（不再覆盖）
- GSC 同步扩展 `page` 维度，为内容归因提供原料
- 实现 `audit-delta-comparison` spec 的展示层
- 将 GSC page 数据与文章 URL 匹配，在内容库展示归因指标
- 建设增长趋势仪表板三个组件（关键词趋势、流量趋势、评分历史）

**Non-Goals:**
- GA4 数据落库（复杂度高，本 change 不涉及；GA4 继续实时查询）
- 完整 rank tracker（逐日精确排名，需独立的付费数据源；GSC 平均位置已够用）
- 报告导出 / PDF 生成
- 关键词难度、搜索量等第三方数据补全

## Decisions

### 决策 1：新建 `SiteKeywordSnapshot` 表，而非修改 `SiteKeyword`

**选择**：新增快照表，`SiteKeyword` 保留作"最新状态缓存"（供语义债务分析等实时查询使用）。

**理由**：
- 语义债务、市场差距分析依赖 `SiteKeyword` 做快速 findMany，时序数据混入会增加查询复杂度
- 快照表天然支持分页、时间范围过滤，不影响现有查询路径
- 两表职责清晰：`SiteKeyword` = 当前状态，`SiteKeywordSnapshot` = 历史轨迹

**放弃的方案**：在 `SiteKeyword` 加 `snapshotDate` 字段 → 同一 keyword 会产生大量重复行，查询"最新状态"需要额外 GROUP BY，增加复杂度。

---

### 决策 2：GSC 同步频率由用户手动触发，不增加自动 cron

**选择**：维持当前"用户点击同步"的触发模式，快照在每次同步时写入。

**理由**：
- 自动 cron 需要处理 token 刷新、并发控制、用户配额，复杂度高
- 用户手动同步可预测，快照频率由用户行为决定（通常每周 1-2 次，足够趋势分析）
- 后续可在此基础上加 cron，不影响本 change 的数据模型

---

### 决策 3：page 维度数据存入同一 `SiteKeywordSnapshot` 表，用 `type` 字段区分

**选择**：`SiteKeywordSnapshot` 增加 `dimensionType: 'query' | 'page'` 字段，两类数据共表。

**理由**：
- 避免建两张结构几乎相同的表（`SiteQuerySnapshot` + `SitePageSnapshot`）
- 内容归因查询只需 `WHERE dimensionType = 'page' AND value LIKE '%/slug%'`，清晰直接
- 单表更易做时间范围聚合和趋势计算

**Schema 设计**：
```
SiteKeywordSnapshot {
  id            String   @id
  siteId        String
  dimensionType String   // 'query' | 'page'
  value         String   // keyword 文本 或 page URL
  clicks        Int
  impressions   Int
  position      Float
  snapshotDate  DateTime // 同步当天日期，精确到天
  createdAt     DateTime @default(now())

  @@index([siteId, dimensionType, snapshotDate])
  @@index([siteId, value, dimensionType])
}
```

---

### 决策 4：内容归因用 URL 后缀匹配，不做精确等值比较

**选择**：匹配逻辑为 `pageUrl.includes('/' + content.slug)`，而非精确等值。

**理由**：
- GSC 返回的 page URL 包含完整域名（`https://example.com/blog/my-post`）
- `Content.slug` 只有路径片段（`my-post`）
- 后缀匹配简单可靠，极少误匹配（slug 通常唯一）
- 精确匹配需要知道完整 URL 结构，而域名在 `Site` 表，增加 join 复杂度

---

### 决策 5：audit-delta-comparison 在前端计算，不新增 API

**选择**：沿用已有 spec 的设计——父页面传入 `audits[1].issueReport` 作为 `previousIssueReport`，diff 在 `HealthReport` 组件内计算。

**理由**：issue code set 的 diff 计算量极小（两个数组求差集），无需后端参与。spec 已明确定义此边界，直接实现即可。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|---|---|
| 快照表数据量增长（每次同步 ~1000 行 × 2 维度）| 每个 siteId 保留最近 52 个快照（约 1 年），超出后台批量清理；PostgreSQL 索引覆盖常用查询 |
| GSC page 维度 API 调用增加一次（每次同步多一个 HTTP 请求）| 两次请求串行，超时设 10s；失败不阻断 query 维度同步，独立 try/catch |
| URL 后缀匹配内容归因出现误匹配 | slug 通常唯一；极端情况（如 `/about` 匹配 `/all-about-x`）可在 slug 前加 `/` 做分隔符过滤 |
| `audit-delta-comparison` 展示层：旧格式审计（`issueReport` 为 null）触发空指针 | spec 已定义：`previousIssueReport` 为 null 时不渲染 Delta banner，防御性处理 |
| 趋势图首次上线时无历史数据，图表为空 | 空状态展示引导文案："同步一次 GSC 数据后，趋势图将在下次同步后生效" |

## Migration Plan

1. 写入 `SiteKeywordSnapshot` 新表的 Prisma migration（`prisma migrate dev`）
2. 部署新的 GSC sync 逻辑（同时写 `SiteKeyword` + `SiteKeywordSnapshot`，向后兼容）
3. 旧有 `SiteKeyword` 数据保留不动；第一次快照在用户下次手动同步时写入
4. 前端组件独立部署：`HealthReport` Delta banner、趋势图组件各自独立，不影响现有审计展示

**回滚**：前端组件功能开关可通过删除新增 props 回滚；数据层新表可保留不删（不影响现有流程）。

## Open Questions

- 趋势图时间窗口：默认展示 8 周还是 12 周？（建议 8 周，数据较新时不显示空格）
- 内容库归因入口：放在文章卡片 hover tooltip，还是常驻展示小标签？
- GA4 落库：是否在本 change 的 phase 2 纳入？（当前明确 Non-Goal，但数据模型预留扩展位）
