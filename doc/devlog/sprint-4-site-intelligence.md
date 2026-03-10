# STP2026 Development Log - Sprint 4

> **最后更新**: 2026-03-08
> **当前分支**: `roadmap`

## 🏁 目标：Site Intelligence 数据持久化与站点管理

### 1. 数据持久化 (API Layer)
- **站点自动存储**: `POST /api/dashboard/site-intelligence/audit` 在完成抓取后，自动通过 Prisma 检查 `userId + domain` 并 `create` 或复用 `Site` 实体。
- **审计记录全景保存**: 抓取生成的带有坐标和元数据的 `GraphData` 以 JSON 格式存入 `SiteAudit` 记录中。
- **Tech Score 计算**: 根据全站平均加载时间自动计算技术得分 (≤500ms = 100分)，存入 `SiteAudit.techScore`。
- **查询路由**: 新增 `GET /api/dashboard/sites`（全站快照）和 `GET /api/dashboard/sites/[siteId]/audits`（单站历史）。

### 2. 站点管理 Dashboard
- **新增核心入口页**: 设计了全新的 `/dashboard/tools/site-intelligence` 管理面板，用于罗列用户所有被审计的网站。
- **卡片式状态管家**: 列出站点时嵌套提取最近一次审计的关键指标：
  - 收录页数 (Pages)
  - 技术表现评级 (Tech Score Badge)
  - 最近诊断发生时间 (Last Scan)
  - 操作按钮 (View Map / Re-scan)

### 3. 主界面 UX 纵深升级 (Instant Audit 组件)
- **URL 查询状态保持**: 支持读取 URL `?site=domain&rescan=1` 参数，可以从站点管理页一键穿透直达扫描状态并立即工作。
- **保存确认反馈**: 扫描流结束后响应中携带数据库生成的 `siteId` 与 `auditId`，并在左侧触发短暂的绿色 Toast 提示："✓ Audit saved to your sites"。
- **侧边栏历史时间旅行 (Audit History)**: 在该站点的环境上下文下，自动拉取历史的 5 次审计记录；点击任意一条历史记录，即可将已储存的 JSON `GraphData` 完全倒灌进 Galaxy Map 组件中闪电重绘，实现无缝对比。
- **框架鲁棒性**: 通过 `Suspense` 隔离层解决了 `useSearchParams()` 脱水阶段（Dehydration）报错问题。

---

**Status**: Sprint 4 COMPLETED.
**Next Step**: Sprint 5 - Competitor Tracking & Market Gap Analysis.
