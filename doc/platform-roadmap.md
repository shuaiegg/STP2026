# STP2026 Platform Roadmap
> 版本：v1.1 | 更新日期：2026-03-07
> 更新记录：校准 Dashboard (用户端) 与 Admin (超管端) 架构

## 🎯 平台定位

一站式 AI 内容增长引擎，覆盖从「网站诊断 → 内容规划 → AI 写作 → 多平台发布 → 效果追踪」的完整闭环。

```
Site Intelligence（诊断+规划）
        ↓ 品牌知识库 + 内容计划
GEO Writer（AI 写作）
        ↓ 生成文章
一键发布（WordPress / Webflow / Shopify）
        ↓ 发布后
Search Console + 排名追踪（效果反馈）
        ↓ 数据回流
Site Intelligence（持续优化）
```

---

## 🗂️ 数据模型（核心）

> 所有功能共享同一数据库，需优先完成 Schema 设计。

```prisma
model Site {
  id            String   @id @default(uuid())
  userId        String
  domain        String
  name          String?
  targetMarkets String[]  // 目标市场（国家/语言）
  seedKeywords  String[]  // 主营关键词
  createdAt     DateTime @default(now())

  audits        SiteAudit[]
  keywords      SiteKeyword[]
  competitors   Competitor[]
  contentPlans  ContentPlan[]
  gscConnections GscConnection[]
}

model SiteAudit {
  id          String   @id @default(uuid())
  siteId      String
  site        Site     @relation(fields: [siteId], references: [id])
  status      String   // queued / running / done / failed
  techScore   Int?     // 技术SEO总分
  contentScore Int?    // 内容质量总分
  geoScore    Int?     // GEO / AIO 分数
  report      Json?    // 完整审计报告 JSON
  createdAt   DateTime @default(now())
}

model SiteKeyword {
  id          String   @id @default(uuid())
  siteId      String
  keyword     String
  volume      Int?
  difficulty  Int?
  position    Int?     // 当前排名
  clicks      Int?     // GSC 点击量
  impressions Int?     // GSC 曝光量
  language    String?  // 所属语言版本
  updatedAt   DateTime @updatedAt
}

model Competitor {
  id      String @id @default(uuid())
  siteId  String
  domain  String
  topics  String[]  // 竞品覆盖的主题
}

model ContentPlan {
  id       String          @id @default(uuid())
  siteId   String
  title    String          // 计划名称（如「2026 Q1 英文SEO计划」）
  articles PlannedArticle[]
  createdAt DateTime @default(now())
}

model PlannedArticle {
  id            String      @id @default(uuid())
  contentPlanId String
  contentPlan   ContentPlan @relation(fields: [contentPlanId], references: [id])
  title         String      // 建议文章标题
  keyword       String      // 目标关键词
  volume        Int?        // 搜索量
  language      String      // 语言版本
  pillar        Boolean     @default(false)  // 是否为 Pillar Page
  clusterOf     String?     // 所属 Pillar 的 ID
  priority      Int         @default(0)
  status        String      @default("planned")  // planned / generating / done
  articleId     String?     // 生成后关联的 Content ID
}

model GscConnection {
  id           String @id @default(uuid())
  siteId       String
  accessToken  String
  refreshToken String
  expiresAt    DateTime
  lastSyncAt   DateTime?
}
```

---

## 🖥️ 界面架构规划

### 1. 用户工作台 (Dashboard)
> **路径**：`/dashboard`
> **面向对象**：最终用户（站长/SEO 客户）

```
/dashboard
├── /sites                         - 站点管理列表
├── /sites/[id]                    - 站点详情中心
│   ├── /overview                  - 3D 集群地图 + 关键指标
│   ├── /audit                     - 技术 SEO 详细审计报告
│   ├── /keywords                  - 关键词排名雷达
│   └── /competitors               - 竞品分析 + Gap 挖掘
├── /content-plan                  - 内容计划中心
│   └── /[id]                      - 具体计划视图（星图关联视图）
└── /content                       - GEO Writer 已生成内容库
```

### 2. 超管指挥部 (Admin)
> **路径**：`/admin`
> **面向对象**：ScaleToTop 内部运营团队

```
/admin
├── /dashboard                     - 全系统数据总览（Credits/Users/Revenue）
├── /audit-queue                   - 审计流水线监视器（实时爬虫状态监控）
├── /users                         - 用户权限与积分点数管理
└── /settings                      - 系统全局 AI 策略配置
```

---

## 🚀 开发优先级 & 时间线

### Sprint 1（第 1 周）- 核心基座
- [ ] 数据库 Schema 对齐 + Prisma Migration (Dashboard 专用模型)
- [ ] 后端爬虫引擎开发 (Cheerio 基础全站抓取)
- [ ] Dashboard 站点管理界面骨架开发
- [ ] Google Search Console OAuth 基础链路

### Sprint 2（第 2 周）- 智能层
- [ ] 3D 集群地图原型加载 (D3.js / Three.js)
- [ ] 品牌知识库生成逻辑（从 Site Intelligence 注入）
- [ ] 内容计划自动化算法开发

... (后续模块保持不变) ...
