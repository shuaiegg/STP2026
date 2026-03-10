# STP2026 Development Log - Sprint 5

> **最后更新**: 2026-03-10
> **当前状态**: 已完成 (Verified)

## 🏁 目标：Competitor Tracking & Market Gap Analysis

### 1. 竞品管理数据层 (Data Layer)
- **竞品 CRUD API**: 新增 `GET`, `POST`, `DELETE` 路由于 `/api/dashboard/sites/[siteId]/competitors`，允许用户为每个站点追踪最多 5 个竞争对手域名。
- **Prisma Schema 更新**: 利用原生的 `Competitor` 数据模型持久化保存竞品信息及其核心 `topics`。

### 2. 界面与路由重构 (UI & Routing)
- **顶级路由提升**: 将原先深层叠放的 `/dashboard/tools/site-intelligence` 路由重构并提升为 `/dashboard/site-intelligence`，解决侧边栏导航激活状态冲突问题。
- **动态站点面板 (`[siteId]`)**: 新增了细粒度的动态路由，为每个独立的 Site 打造包含「概览」「审计历史」「竞争对手追踪」三个 Tab 页的专属控制台。
- **UI 交互增强**: 引入竞品列表框，提供裸域名输入保护、额度可视化指示器 (x/5)、以及流畅的删除交互。

### 3. 市场情报扫描引擎 (Intelligence Engine)
- **智能爬网探测 API**: 开发了 `POST /api/dashboard/sites/[siteId]/competitors/[competitorId]/scan`，一键连接 `CrawlerService`，抓取竞品网页内容并基于词频或 LLM 启发式算法提炼出核心业务标签 (Topics)。
- **市场空白计算 API**: 开发了 `GET /api/dashboard/sites/[siteId]/market-gap`，动态比对主站点的已知 Keywords 与所有竞品 Topics。
- **情报提纯透视屏**: 在 Competitor UI 下方新增可视化面板，渲染出两大核心洞察模块：
  - 🔴 **竞品有，而我们没有的 (Market Gaps)**：标注被多少个竞品共同覆盖，揭示亟待补充的内容方向。
  - 🟢 **我们的绝对优势 (Our Strengths)**：主站点独有，竞品尚未涉足的话题。

---

**Status**: Sprint 5 COMPLETED.
**Next Step**: Sprint 6 - Content Generation Integration (Bridging Market Gaps with GEO Writer).
