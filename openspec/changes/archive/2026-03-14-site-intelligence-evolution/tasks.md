## 1. 数据模型拆分（前置基础，其他任务依赖）

- [x] 1.1 在 `prisma/schema.prisma` 中新增 `SiteOntology` 模型（id, siteId,
      version, coreOfferings, targetAudience, painPointsSolved, logicChains
      Json?, idealTopicMap Json, createdAt）
- [x] 1.2 在 `prisma/schema.prisma` 中新增 `SemanticDebt` 模型（id, siteId,
      ontologyId, topic, subtopics, relevance, coverageScore Int?, proofDensity
      Int?, gscImpressions Int?, gscClicks Int?, priorityLabel String?,
      createdAt）
- [x] 1.3 在 `prisma/schema.prisma` 中为 `Site` 添加 `ontologies SiteOntology[]`
      和 `semanticDebts SemanticDebt[]` 关系
- [x] 1.4 在 `StrategyStatus` 枚举中新增 `REFACTORING_NEEDED` 值
- [x] 1.5 运行
      `npx prisma migrate dev --name add-ontology-semantic-debt-refactoring`
      生成迁移文件
- [x] 1.6 编写数据迁移脚本 `scripts/migrate-ontology.ts`：遍历所有 `Site`
      记录，将非空的 `businessOntology` JSON 解析写入 `SiteOntology` +
      `SemanticDebt` 表
- [x] 1.7 运行迁移脚本并验证数据完整性

## 2. 本体提取 API 升级

- [x] 2.1 升级 `/api/dashboard/sites/[siteId]/ontology/route.ts` 的 LLM
      prompt：增加识别 "Problem → Solution → Proof" 逻辑链的指令，要求输出
      `logicChains: { problem, solution, proof }[]`
- [x] 2.2 将 ontology API 的写操作从更新 `Site.businessOntology` JSON 改为创建新
      `SiteOntology` 记录（version 自动递增），同时保留双写 JSON
      字段（兼容过渡期）
- [x] 2.3 验证 ontology API 返回 `logicChains` 字段

## 3. 语义债量化评分

- [x] 3.1 升级 `/api/dashboard/sites/[siteId]/semantic-gap/route.ts` 的 LLM
      prompt：要求对每条语义债输出 `coverageScore`（0-100）和
      `proofDensity`（0-100），在 prompt 中提供锚点示例
- [x] 3.2 将 semantic-gap API 的写操作改为写入 `SemanticDebt` 表记录（关联最新
      `SiteOntology.id`），同时双写 JSON 字段
- [x] 3.3 在 `OverviewPanel.tsx` 中为每条语义债展示 `coverageScore` 和
      `proofDensity` 数值，低于 30 的 coverageScore 显示红色

## 4. Ghost Nodes

- [x] 4.1 新建 `/api/dashboard/sites/[siteId]/ghost-nodes/route.ts`：读取最新
      `SiteOntology.idealTopicMap`，与最新审计 `graphData.nodes`
      对比，用关键词匹配判断覆盖情况
- [x] 4.2 为未覆盖话题生成 Ghost Node 坐标（基于相关已有节点重心偏移或随机分布）
- [x] 4.3 无本体数据时返回 `{ nodes: [] }`
- [x] 4.4 在 `GalaxyMap.tsx` 中请求 ghost-nodes API，将结果合并到图谱数据
- [x] 4.5 为 Ghost Nodes 设置独立渲染样式：`nodeColor` 紫色
      `#a78bfa`，`nodeOpacity` 0.35，`nodeRelSize` 缩小 30%
- [x] 4.6 验证 Ghost Nodes 与实体节点在 3D 视图中共存不冲突

## 5. 看板批量持久化修复

- [x] 5.1 新增
      `POST /api/dashboard/sites/[siteId]/strategy/articles/reorder/route.ts`：接受
      `{ updates: { id, kanbanOrder, contentPlanId }[] }`，用
      `prisma.$transaction` 批量执行 update
- [x] 5.2 修改 `StrategyBoard.tsx` 的 `onDragEnd`
      处理函数：在乐观更新后，收集目标列和源列全部文章的新排序，调用批量 reorder
      端点
- [x] 5.3 在 reorder API 失败时，`StrategyBoard.tsx` 回滚 UI 状态至拖拽前
- [x] 5.4 在 `/strategy/generate/route.ts` 中添加重复检测：执行前查询是否已有
      IDEATION/PLANNED 状态的 ContentPlan，若有则返回
      `{ conflict: true, existingCount: N }`
- [x] 5.5 在 `StrategyBoard.tsx` 处理 `conflict: true`
      响应：展示确认对话框，用户选择"重新生成"时将旧计划标记为 ARCHIVED 后继续

## 6. 全局大盘重构

- [x] 6.1 在 `dashboard/page.tsx` Server Component 中新增 Prisma
      查询：`SemanticDebt.count`
      统计高优语义债（`priorityLabel contains '高搜索'`）
- [x] 6.2 新增查询：每站点 `coverageScore` 最低的一条 `SemanticDebt`（使用
      groupBy 或子查询）
- [x] 6.3 新增查询：`PlannedArticle.count` 统计全用户内容资产总数
- [x] 6.4 重构 `dashboard/page.tsx` 的 UI：移除 trackedArticle
      流水账，新增战略指标卡片（总资产数、高优语义债数）
- [x] 6.5 每个站点卡片展示 `coverageScore` 最低的语义债话题名

## 7. 自愈 Cron

- [x] 7.1 在 `/api/cron/verify/route.ts` 中追加 GSC 健康检查逻辑：查询所有有 GSC
      连接的站点
- [x] 7.2 对每个站点拉取最近 2 周 GSC 数据，计算核心话题关键词的周环比
      impressions 变化
- [x] 7.3 对下跌 > 30% 的话题：更新关联 `SemanticDebt.priorityLabel` 为包含
      `⚠️ 流量下跌`
- [x] 7.4 对下跌 > 30% 的话题：更新 keyword 匹配的 `PlannedArticle.status` 为
      `REFACTORING_NEEDED`
- [x] 7.5 单站点 GSC 请求失败时 catch 错误、记录日志、继续处理下一站点
- [x] 7.6 在 `StrategyBoard.tsx` 的文章卡片中：`REFACTORING_NEEDED`
      状态显示橙色警告角标 `⚠️`，区别于其他状态样式

## 8. 收尾与双写清理

- [x] 8.1 确认所有 API 路由已从读 `Site.businessOntology` JSON 切换为查
      `SiteOntology` / `SemanticDebt` 表
- [x] 8.2 在 `prisma/schema.prisma` 中将 `Site.businessOntology`
      字段标记为可选（`@deprecated` 注释）
- [x] 8.3 移除 ontology 和 semantic-gap API 中的双写逻辑
- [x] 8.4 运行 `npm run build` 确认无 TypeScript 编译错误
