## Why

Site Intelligence 已完成基础数据层（审计、GSC/GA4、竞品、语义债展示），但核心的"业务逻辑可视化"与"数据驱动决策"能力缺失：3D 星图看不到逻辑缺口、语义债停留在定性描述、看板数据漂移、全局大盘无战略价值——这些是从"数据展示工具"跨越到"智能战略合伙人"的关键障碍。

## What Changes

- **`GalaxyMap.tsx` + 新 API** — 在 3D 星图中渲染半透明虚影节点（Ghost Nodes），代表业务逻辑缺口；后端计算 `MissingLogicPoints[]` 并注入图谱数据
- **`/api/.../semantic-gap` + OverviewPanel** — 为每条语义债增加 `coverageScore`（0-100）和 `proofDensity`（0-100）量化指标；本体提取 prompt 升级为识别 "Problem → Solution → Proof" 逻辑链
- **`StrategyBoard.tsx` + `/api/.../strategy/articles/[id]`** — 修复拖拽后仅更新单条记录的问题，改为批量更新同列所有文章的 `kanbanOrder`；`/strategy/generate` 增加重复计划检测
- **`/dashboard/page.tsx`** — 全局大盘重构：替换操作流水账为跨站点战略指标（内容资产总数、高优语义债数、每站点置顶语义债摘要）
- **Prisma schema** — `**BREAKING**` 新增 `SiteOntology` 和 `SemanticDebt` 独立模型，将 `Site.businessOntology` JSON blob 拆表；迁移现有数据
- **`/api/cron/verify` + `StrategyStatus` enum** — 自愈闭环：cron job 检测 GSC 周环比流量下跌 >30% 的核心话题，自动标记关联文章为 `REFACTORING_NEEDED`；StrategyBoard 展示标记状态

## Capabilities

### New Capabilities
- `ghost-nodes`: 3D 星图虚影节点——基于业务 DNA 预测并可视化逻辑缺口节点
- `semantic-debt-scoring`: 语义债量化评分——Coverage Score + Proof Density 数值指标与逻辑链识别
- `strategy-board-persistence`: 看板正确持久化——批量 kanbanOrder 更新与重复计划防护
- `global-dashboard-metrics`: 全局大盘战略指标——跨站点语义债聚合与内容资产统计
- `ontology-data-model`: 本体数据模型拆表——SiteOntology + SemanticDebt 独立模型替代 JSON blob
- `self-healing-cron`: 自愈 Cron——GSC 流量下跌自动触发内容优化标记

### Modified Capabilities
- `dashboard-loading-ui`: StrategyBoard 新增 `REFACTORING_NEEDED` 状态的视觉标识，扩展现有加载骨架屏范围

## Impact

- **受影响文件（约 18 个）**：
  - `prisma/schema.prisma` — 新增 2 个模型（需 migration）
  - `src/app/(protected)/dashboard/page.tsx` — 大盘重构
  - `src/app/(protected)/dashboard/site-intelligence/[siteId]/components/GalaxyMap.tsx` — Ghost Nodes 渲染
  - `src/app/(protected)/dashboard/site-intelligence/[siteId]/components/OverviewPanel.tsx` — 量化指标展示
  - `src/app/(protected)/dashboard/site-intelligence/[siteId]/components/StrategyBoard.tsx` — 批量持久化 + REFACTORING 标记
  - `src/app/api/dashboard/sites/[siteId]/ontology/route.ts` — 升级 prompt
  - `src/app/api/dashboard/sites/[siteId]/semantic-gap/route.ts` — 新增评分计算
  - `src/app/api/dashboard/sites/[siteId]/strategy/generate/route.ts` — 重复检测
  - `src/app/api/dashboard/sites/[siteId]/strategy/articles/[articleId]/route.ts` — 批量更新
  - `src/app/api/cron/verify/route.ts` — 自愈逻辑
  - 新增：`src/app/api/dashboard/sites/[siteId]/ghost-nodes/route.ts`
  - 新增：数据迁移 script
- **破坏性变更**：`Site.businessOntology` JSON 字段废弃，所有读写该字段的代码需同步更新
- **数据库变更**：需要 `prisma migrate dev`（新增表 + 数据迁移）
- **无外部新依赖**
