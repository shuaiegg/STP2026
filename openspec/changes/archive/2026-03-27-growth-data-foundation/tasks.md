## 1. 快赢：审计 Delta 对比（audit-delta-comparison）

- [x] 1.1 在 `[siteId]/page.tsx` 的审计数据查询中，确保返回至少 2 条审计记录（含 `issueReport`），并取 `audits[1].issueReport` 作为 `previousIssueReport`
- [x] 1.2 修改 `HealthReport` 组件，接受可选 `previousIssueReport` prop，在组件内计算 issue code 差集（新增 N 个 / 修复 M 个）
- [x] 1.3 实现 Delta banner UI："比上次新增 N 个问题，修复了 M 个问题"，全部修复时显示绿色，无变化时显示中性文案，无 `previousIssueReport` 时不渲染
- [x] 1.4 在审计历史列表（`AuditHistoryPanel`）的每条记录旁展示 ↑/↓ 评分箭头及分差（与前一条记录的 `techScore` 比较）

## 2. 数据模型：SiteKeywordSnapshot 表

- [x] 2.1 在 `prisma/schema.prisma` 中新增 `SiteKeywordSnapshot` 模型（字段：id、siteId、dimensionType、value、clicks、impressions、position、snapshotDate、createdAt），添加两个复合索引
- [ ] 2.2 运行 `npx prisma migrate dev --name add-site-keyword-snapshot` 创建迁移文件
- [ ] 2.3 运行 `npx prisma generate` 更新客户端

## 3. GSC 同步扩展：追加快照 + page 维度

- [x] 3.1 修改 `gsc-sync/route.ts`：在现有 query 维度 upsert 逻辑后，增加"当天是否已有快照"检测（按 siteId + snapshotDate + dimensionType 查重）
- [x] 3.2 若无当天快照，将 query 维度数据批量写入 `SiteKeywordSnapshot`（`dimensionType = 'query'`），`snapshotDate` 设为当天 UTC 日期
- [x] 3.3 新增 page 维度 GSC API 请求（`dimensions: ['page']`，rowLimit 500），用独立 try/catch 包裹，失败不阻断主流程
- [x] 3.4 将 page 维度结果写入 `SiteKeywordSnapshot`（`dimensionType = 'page'`）
- [x] 3.5 同步完成后异步检查快照批次总数，超过 104 批次时删除最旧一批（按 siteId distinct snapshotDate 计数）
- [x] 3.6 更新同步 API 响应体，包含 `queriesSynced`、`pagesSynced`、`snapshotCreated`（布尔）字段

## 4. 内容归因：文章卡片展示 GSC 指标

- [x] 4.1 新增 `/api/dashboard/sites/[siteId]/keyword-snapshots/page-attribution` 接口，返回该站点最新 snapshotDate 的 page 维度快照列表（value + clicks + impressions + position）
- [x] 4.2 修改内容库 Server Component（`/dashboard/library/page.tsx`），并行查询文章列表和 page 快照，在服务端完成 slug → snapshot URL 后缀匹配
- [x] 4.3 更新文章卡片组件，接受可选 `attribution` prop（`{ clicks, impressions, position } | null`），有数据时展示紧凑归因标签（点击图标 + 数字、排名图标 + #N.N）
- [x] 4.4 对 `TrackedArticle` 列表做同样的归因匹配（通过 `TrackedArticle.url` 字段）
- [x] 4.5 无 GSC 连接或无匹配数据时，卡片不渲染归因区域（不显示占位符）

## 5. 增长仪表板：关键词排名趋势图

- [x] 5.1 新增 `/api/dashboard/sites/[siteId]/keyword-snapshots/trends` 接口，接受 `topN`（默认 5）和 `limit`（默认 8 个快照点）参数，返回按点击数排名前 N 的关键词的历史排名数据
- [x] 5.2 创建 `KeywordTrendChart` 客户端组件（使用 Recharts `LineChart`），X 轴为快照日期，Y 轴倒置（1 在顶部），每条线代表一个关键词
- [x] 5.3 替换 `OverviewPanel` 中"关键词趋势组件待集成"占位，接入 `KeywordTrendChart`
- [x] 5.4 实现空状态（< 2 个快照）：显示引导文案 + "立即同步"按钮；未连接 GSC 时显示连接引导

## 6. 增长仪表板：有机流量趋势面积图

- [x] 6.1 创建 `OrganicTrafficChart` 客户端组件（使用 Recharts `AreaChart`），数据来源复用现有 `/api/dashboard/sites/[siteId]/gsc/performance` 的 `daily` 数组
- [x] 6.2 图表顶部展示三个 KPI 标签：总点击数、总展示量、平均 CTR
- [x] 6.3 替换 `OverviewPanel` 中"GA4 流量组件待集成"占位，接入 `OrganicTrafficChart`
- [x] 6.4 未连接 GSC 时显示统一空状态（与关键词趋势图保持一致的文案和引导）

## 7. 增长仪表板：审计评分 Sparkline

- [x] 7.1 创建 `AuditScoreSparkline` 客户端组件（使用 Recharts `LineChart` 精简版），高度固定 40px，线条颜色根据最新与前一次评分涨跌决定（绿/红）
- [x] 7.2 在 `AuditHistoryPanel` 顶部嵌入 `AuditScoreSparkline`，数据从已有的 `audits` 数组提取 `techScore` 序列
- [x] 7.3 少于 3 条审计记录时不渲染 sparkline（无空图表）

## 8. 收尾验收

- [ ] 8.1 在本地数据库验证：触发 GSC 同步后，`SiteKeywordSnapshot` 表有新记录（query + page 两个维度）
- [ ] 8.2 验证：同一天二次同步不重复写入快照
- [ ] 8.3 验证：内容库文章卡片正确展示归因数据（或正确隐藏归因区域）
- [ ] 8.4 验证：概览面板关键词趋势图、流量趋势面积图、审计 sparkline 均正常渲染
- [ ] 8.5 验证：审计 Delta banner 在两次审计对比场景下正确显示新增/修复数
- [ ] 8.6 运行 `npm run lint` 和 `npm run build` 确保无类型错误和编译错误
