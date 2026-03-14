## Context

Site Intelligence 当前架构：`Site.businessOntology` 是一个不断膨胀的 JSON 字段，语义债、本体数据、分析时间戳全部混入其中。前端有 3D 星图（`react-force-graph-3d`）但图谱节点只来自爬虫，没有"预测节点"能力。Kanban 看板的 `kanbanOrder` 在拖拽后只更新被移动的卡片，导致排序数据逐渐漂移。全局大盘（`/dashboard`）展示的是操作级流水账，无战略价值。Cron job 只做 GEO 引用验证，没有 GSC 健康监控。

## Goals / Non-Goals

**Goals:**
- 拆分 `businessOntology` JSON 为独立的 `SiteOntology` + `SemanticDebt` 数据模型（带历史版本）
- 在 3D 星图中渲染半透明 Ghost Nodes（预测的逻辑缺口）
- 为语义债增加 `coverageScore` + `proofDensity` 量化评分
- 修复看板拖拽批量持久化问题
- 重构全局大盘为跨站点战略指标
- 自愈 Cron：GSC 周环比下跌 > 30% 自动标记文章为 REFACTORING_NEEDED

**Non-Goals:**
- 不实现 Ghost Node 点击派发 GEO Writer 任务（P0，另立 change）
- 不接入 Google Ads / Meta Ads（Phase 2，roadmap 后期）
- 不实现竞品扫描 API（P0 范围）
- 不做实时协作（WebSocket）

## Decisions

### D1：数据模型拆分策略

**选择**：新建 `SiteOntology`（本体快照，支持多版本）和 `SemanticDebt`（独立行，可查询、可历史追踪）。`Site.businessOntology` 字段保留但标记 deprecated，迁移期双写，待所有消费方切换后再删除。

```prisma
model SiteOntology {
  id               String   @id @default(uuid())
  siteId           String
  version          Int      @default(1)
  coreOfferings    String[]
  targetAudience   String[]
  painPointsSolved String[]
  logicChains      Json?    // Problem→Solution→Proof 结构
  idealTopicMap    Json     // { topic, subtopics }[]
  createdAt        DateTime @default(now())
  site             Site     @relation(...)
  @@index([siteId, version])
}

model SemanticDebt {
  id             String   @id @default(uuid())
  siteId         String
  ontologyId     String   // 关联到哪个版本的本体
  topic          String
  subtopics      String[]
  relevance      String   // high/medium/low
  coverageScore  Int?     // 0-100
  proofDensity   Int?     // 0-100
  gscImpressions Int?
  gscClicks      Int?
  priorityLabel  String?
  createdAt      DateTime @default(now())
  site           Site     @relation(...)
  @@index([siteId])
  @@index([coverageScore])
}
```

**理由**：JSON blob 无法按 `coverageScore` 排序、无法查询高优债务数量（全局大盘需要）、无法保留历史版本。拆表是后续所有功能的数据基础。

**替代方案**：保留 JSON blob 并在应用层解析 — 无法满足全局大盘的跨站点聚合查询需求，舍弃。

---

### D2：Ghost Nodes 数据生成时机

**选择**：在 `/api/dashboard/sites/[siteId]/ghost-nodes` 独立端点按需计算，不嵌入审计流程。前端在 GalaxyMap 挂载时独立请求，叠加渲染在图谱之上。

**算法**：
1. 取最新 `SiteOntology.idealTopicMap`（主题列表）
2. 取最新审计的 `graphData.nodes`（已有页面节点的 label）
3. 用 LLM 或关键词匹配判断每个理想主题是否被现有节点覆盖
4. 未覆盖的主题 → 生成虚影节点，坐标基于相关已有节点的重心偏移计算
5. 返回 `{ id, label, type: 'ghost', x, y, z, relatedTopics }[]`

**前端渲染**：`react-force-graph-3d` 支持 `nodeColor` 和 `nodeOpacity` 自定义，ghost 节点设置 `color: '#a78bfa'`、`opacity: 0.35`、`nodeRelSize` 缩小 30%。

**理由**：独立端点避免审计流程变慢；按需请求避免无本体数据时报错；叠加渲染保持图谱主流程不变。

---

### D3：Coverage Score + Proof Density 计算方式

**选择**：在 `semantic-gap` API 的 LLM prompt 中直接要求模型输出 0-100 数值评分，而非后处理计算。

**Coverage Score prompt 逻辑**：
> "对于每个语义债话题，基于已爬取页面的 headings 和 meta 信息，评估该话题的内容覆盖程度（0=完全没有，100=非常充分）"

**Proof Density prompt 逻辑**：
> "评估现有内容中该话题的佐证密度：有没有案例研究、数据、客户证言（0=纯观点无佐证，100=大量具体佐证）"

**理由**：LLM 已具备语义理解能力，让模型直接输出评分比写启发式规则（统计关键词密度等）更准确，也更易维护。后续可用真实 GSC CTR 数据校验评分准确性。

---

### D4：看板批量 kanbanOrder 更新

**选择**：新增 `POST /api/dashboard/sites/[siteId]/strategy/articles/reorder` 批量端点，接受 `{ updates: { id, kanbanOrder, contentPlanId }[] }`，用 Prisma `$transaction` 批量 update。

**理由**：现有的 PATCH 单条接口语义清晰，不应改变；批量操作单独抽一个端点语义更明确，也方便前端在拖拽结束的 `onDragEnd` 里一次性提交整列的新排序。

---

### D5：全局大盘数据查询

**选择**：在 `dashboard/page.tsx`（Server Component）新增两个 Prisma 查询：
```typescript
// 跨站点高优语义债数
const highPriorityDebtCount = await prisma.semanticDebt.count({
  where: { site: { userId }, priorityLabel: { contains: '高搜索' } }
})

// 每站点最新语义债摘要（只取 topic + coverageScore，不拉全部字段）
const siteDebts = await prisma.semanticDebt.findMany({
  where: { site: { userId } },
  orderBy: { coverageScore: 'asc' },
  take: 1, // per site — 需要 groupBy 或子查询
  select: { topic: true, coverageScore: true, siteId: true }
})
```

**理由**：拆表后可直接 SQL 聚合，无需在应用层解析 JSON。

---

### D6：自愈 Cron 实现

**选择**：扩展现有 `/api/cron/verify` 路由，在 GEO 引用验证后追加 GSC 健康检查逻辑：

1. 查所有有 GSC 连接且有语义债的站点
2. 对每个站点拉 GSC 最近 2 周数据（已有 `getGscClient`）
3. 计算核心话题关键词的周环比 impressions 变化
4. 下跌 > 30% 的话题 → 找关联的 `SemanticDebt` 记录 → 更新 `priorityLabel` 为 `⚠️ 流量下跌`
5. 找关联的 `PlannedArticle`（keyword 匹配）→ 更新 status 为 `REFACTORING_NEEDED`

**StrategyStatus 枚举扩展**：
```prisma
enum StrategyStatus {
  IDEATION
  PLANNED
  IN_PROGRESS
  COMPLETED
  ARCHIVED
  REFACTORING_NEEDED  // 新增
}
```

**理由**：复用现有 cron 基础设施，不引入新的调度系统；`getGscClient` 已封装好 OAuth token 刷新逻辑，直接复用。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| JSON blob 迁移期双写增加写放大 | 迁移 script 一次性迁移历史数据；新写入双写仅持续到消费方切换完毕（约 1 个迭代周期） |
| Ghost Nodes 坐标计算可能与图谱布局不一致 | `react-force-graph-3d` 有 physics 引擎，初始坐标只是起点，引擎会自动布局；ghost 节点重力设为 0 防止聚集在中心 |
| LLM 评分主观性强，0-100 范围可能漂移 | prompt 中给出锚点示例（"50 = 有 1-2 篇浅层介绍文章，80 = 有完整指南+案例"），后续用 GSC CTR 做校正 |
| Cron GSC API 调用量随站点数增加线性增长 | 添加 `lastGscHealthCheckAt` 字段，每 7 天检查一次；单次超时时跳过该站点不中断整体 cron |
| `StrategyStatus` 新增枚举值可能影响已有 UI 过滤逻辑 | 检查所有 `status` switch/filter 语句，确保有 default/fallback 分支 |

## Migration Plan

1. **Schema 迁移**：`npx prisma migrate dev --name add-ontology-and-semantic-debt-tables`
2. **数据迁移 script**：遍历所有 `Site` 记录，将 `businessOntology` JSON 解析写入新表
3. **双写期**：API 写新表同时保留写 JSON 字段（兼容旧前端）
4. **切换消费方**：逐个更新 API 路由从 JSON 字段改为查新表
5. **清理**：确认所有消费方切换后，执行 `prisma migrate dev` 删除 `Site.businessOntology` 字段

**回滚**：任何阶段前均可 `git revert`；schema 回滚用 `prisma migrate dev --name rollback-ontology`（down migration 自动生成）。

## Open Questions

- Ghost Nodes 是否需要持久化存储（每次按需计算 vs 存入 DB）？当前选择按需计算，但若 LLM 调用成本高可考虑缓存到 `SiteOntology` 的 `ghostNodes` JSON 字段
- `SemanticDebt` 是否需要软删除？当本体重新分析后旧债务如何处理——当前方案是按 `ontologyId` 版本隔离，旧版本债务自然沉底
