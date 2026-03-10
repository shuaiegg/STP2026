# STP2026 Development Log - Sprint 1 & 2

> **最后更新**: 2026-03-07
> **当前分支**: `roadmap`

## 🏁 目标：Site Intelligence 核心引擎与视觉化落地

### 1. 数据库基座 (Prisma)
- **模型落地**: 成功注入 `Site`, `SiteAudit`, `SiteKeyword`, `Competitor`, `ContentPlan`, `PlannedArticle`, `GscConnection`。
- **关联关系**: 建立了 `User -> Site` 的一对多关联，确保用户数据的隔离性。

### 2. 探测引擎 (Crawler Service)
- **技术栈**: `axios` + `cheerio`。
- **特性**: 
    - **Sitemap 解析**: 支持标准 XML Sitemap 提取。
    - **蜘蛛模式**: 当 Sitemap 缺失时，自动回退到首页链接递归爬取（Spider Mode）。
    - **元数据提取**: 精准抓取 Title, H1, Meta Description 及页面加载耗时。
    - **网络适配**: 集成了 Verge Mihomo (7897) 代理，解决服务端抓取拦截问题。
    - **极速模式**: 新增 `fastScan` 方法，支持秒级 URL 探测以驱动前端实时渲染。

### 3. 星图引擎与视觉化 (Visualizer)
- **数据转换**: `GraphGeneratorService` 将审计结果转化为 3D 力导向图 JSON（Nodes/Links）。
- **前端组件**: `GalaxyMap.tsx` 核心组件开发。
    - **环境自适应**: 自动检测 WebGL 支持情况，支持 **3D (Three.js)** 与 **2D (Canvas)** 无感降级切换，解决了特定环境下的 WebGL Renderer 报错。
    - **极致 UX**: 集成了“雷达扫描”加载动画与“物体探测”实时计数。
- **业务集成**: 
    - **路径**：`/dashboard/tools/site-intelligence/instant-audit`
    - **计费**：集成 `chargeUser` 逻辑，关联技能 `SITE_AUDIT_BASIC` (Cost: 0)。
    - **鉴权**：完全适配项目原生的 **Better-Auth** (`auth.api.getSession`) 鉴权体系。

### 4. 验证方式
- **API 端点**: `POST /api/dashboard/site-intelligence/audit`
- **本地验证**: 抓取 `localhost:3000` 成功生成包含 12 个节点、11 条连线的星图数据，SEO 元数据提取完整。

---
**Status**: Sprint 1 & Sprint 2 Core Features COMPLETED.
**Next Step**: Sprint 3 - Data Persistence & Site Management Dashboard.
