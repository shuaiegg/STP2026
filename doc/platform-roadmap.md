# STP2026 Platform Roadmap
> 版本：v1.0 | 更新日期：2026-03-07

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
  id            String   @id @default(cuid())
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
  id          String   @id @default(cuid())
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
  id          String   @id @default(cuid())
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
  id      String @id @default(cuid())
  siteId  String
  domain  String
  topics  String[]  // 竞品覆盖的主题
}

model ContentPlan {
  id       String          @id @default(cuid())
  siteId   String
  title    String          // 计划名称（如「2026 Q1 英文SEO计划」）
  articles PlannedArticle[]
  createdAt DateTime @default(now())
}

model PlannedArticle {
  id            String      @id @default(cuid())
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
  id           String @id @default(cuid())
  siteId       String
  accessToken  String
  refreshToken String
  expiresAt    DateTime
  lastSyncAt   DateTime?
}
```

---

## 📦 功能模块规划

### Module 1: GEO Writer 强化（当前工具）
**状态：进行中**

| 功能 | 状态 | 说明 |
|---|---|---|
| 多代理审阅循环（Auditor+Editor）| ✅ 完成 | 集成进 generate-enrich |
| FAQ 多语言本地化 | ✅ 完成 | 中英自动切换 |
| 内链建议重构 | ✅ 完成 | 主题集群 4 条建议 |
| LLM 自动降级保护 | ✅ 完成 | vps-proxy.ts 统一管理 |
| 图片自动插入 | ✅ 完成 | Unsplash autoVisuals |
| 品牌知识库注入 | 📋 待开发 | 从 Site Intelligence 获取数据 |
| 实时分数仪表盘 | 📋 待开发 | 流式生成时预估分数 |
| 异步任务队列 | 📋 待开发 | 解决 Prisma 超时问题 |

---

### Module 2: Site Intelligence（新工具）
**状态：规划中**

#### Phase 1 — MVP（爬取 + 审计 + 集群地图）
预估工期：5-7 天

| 功能 | 说明 |
|---|---|
| 全站爬取（sitemap.xml）| Cheerio 解析，提取所有页面 URL |
| 技术 SEO 审计 | meta/H1/alt/Schema/内链/速度 |
| 内容 SEO 审计 | 每篇文章质量评分、关键词覆盖 |
| 主题集群地图生成 | AI 根据现有内容 + 竞品生成 Pillar+Cluster 结构 |
| 品牌知识库生成 | 审计结果自动写入品牌档案，供 GEO Writer 使用 |

#### Phase 2 — 情报层
预估工期：5-7 天

| 功能 | 说明 |
|---|---|
| 竞争对手自动发现 | SERP 分析找到覆盖相同关键词的竞品站 |
| Gap 分析 | 竞品有、我没有的话题 → 纳入内容计划 |
| AIO 引用检测 | 查询 Perplexity API，检测文章是否被 AI 引用 |
| 内容重叠检测 | 扫描现有文章，发现关键词蚕食风险 |

#### Phase 3 — 数据接入层
预估工期：3-5 天

| 功能 | API | 说明 |
|---|---|---|
| Google Search Console | OAuth + webmasters.readonly | 真实排名/点击/曝光数据 |
| Google Keyword Planner | Google Ads API | 搜索量/CPC/竞争度 |
| 反链分析 | DataForSEO Backlinks API | 外链数量/DR/锚文字 |

---

### Module 3: 内容计划 Admin 模块（新功能）
**状态：规划中**
预估工期：3-5 天

#### 界面规划

```
Admin 左侧导航（新增）
├── 📊 Dashboard（现有）
├── 📝 内容管理（现有）
├── 🗺️ 内容计划        ← 新增
│   ├── 计划列表
│   ├── 主题集群视图
│   └── 内容日历
├── 🔍 Site Intelligence ← 新增
│   ├── 我的网站
│   ├── 审计报告
│   └── 竞品分析
└── ⚙️ 设置（现有）
```

#### 内容计划页面功能
- 主题集群可视化图（Pillar → Cluster 树状结构）
- 每篇文章卡片：标题 / 关键词 / 搜索量 / 优先级 / 状态
- 批量选择 → 一键排队生成（调用 GEO Writer）
- 导出 CSV
- 内容日历视图（按月排期）

---

### Module 4: 多语言内容矩阵
**状态：规划中**
预估工期：3-4 天

| 功能 | 说明 |
|---|---|
| 语言矩阵规划 | 同一话题 × 多语言（中/英/西班牙语等）|
| 批量多语言生成 | 选一篇文章 → 一键生成 N 个语言版本 |
| 语言版本追踪 | 哪些话题已有英文，还缺中文？ |

---

### Module 5: 一键发布集成
**状态：规划中**
预估工期：2-3 天/平台

| CMS | API | 优先级 |
|---|---|---|
| WordPress | REST API + App Password | 🔥 P0 |
| Webflow | Webflow CMS API | P1 |
| Shopify Blog | Admin API | P1 |
| Contentful | Content Management API | P2 |
| 自定义 Webhook | 推送 JSON | P2 |

---

## 🖥️ 后台界面规划

### 现有界面（Admin）
```
/admin
├── /dashboard       - 数据总览
├── /content         - 内容管理
├── /users           - 用户管理
└── /settings        - 系统设置
```

### 新增界面规划

#### 🔍 Site Intelligence 页面
```
/admin/sites
├── /admin/sites/[id]              - 网站详情
│   ├── /overview                  - 总体评分 + 关键指标
│   ├── /audit                     - 技术 SEO 审计报告
│   │   ├── tech-score            - 技术分 + 逐项检测
│   │   ├── content-score         - 内容分
│   │   └── geo-score             - AIO 引用情况
│   ├── /keywords                  - 关键词排名列表
│   ├── /competitors               - 竞品分析 + Gap
│   └── /connect                   - 连接 GSC / Keyword Planner
```

#### 🗺️ 内容计划页面
```
/admin/content-plan
├── /admin/content-plan/[id]       - 具体计划详情
│   ├── /cluster-map               - 主题集群可视化
│   ├── /article-list              - 文章列表（表格视图）
│   └── /calendar                  - 内容日历
```

#### 📊 GSC 数据页面
```
/admin/analytics
├── /ranking                       - 关键词排名趋势
├── /pages                         - 各页面表现
└── /opportunities                 - 排名提升机会
```

---

## 🚀 开发优先级 & 时间线

### Sprint 1（第 1 周）
- [ ] 数据库 Schema 设计 + Prisma Migration
- [ ] Google Search Console OAuth 接入
- [ ] Site Intelligence Phase 1 MVP（爬取 + 技术审计）

### Sprint 2（第 2 周）
- [ ] Site Intelligence Phase 1 完成（集群地图生成）
- [ ] 品牌知识库 → GEO Writer 自动注入
- [ ] Admin 内容计划模块 UI

### Sprint 3（第 3 周）
- [ ] Google Keyword Planner 接入
- [ ] 竞品自动发现 + Gap 分析
- [ ] AIO 引用检测（Perplexity API）

### Sprint 4（第 4 周）
- [ ] 内容重叠检测
- [ ] WordPress 一键发布
- [ ] 多语言矩阵基础功能

### Sprint 5（第 5-6 周）
- [ ] 反链分析（DataForSEO Backlinks）
- [ ] 排名追踪 + 内容更新提醒
- [ ] 其他 CMS 接入（Webflow / Shopify）

---

## 💰 成本估算（每次完整审计）

| 模块 | 成本 |
|---|---|
| 网站爬取 | 免费（自建）|
| 技术 SEO 分析 | 免费（纯计算）|
| DataForSEO SERP（竞品发现）| ~$0.05-0.15 |
| AIO 引用检测（Perplexity）| ~$0.02-0.10 |
| LLM 集群生成（VPS Proxy）| ~$0.02-0.05 |
| Google Search Console | 免费 |
| Google Keyword Planner | 免费（需 Ads 账号）|
| **每次审计总成本** | **~$0.09-0.30** |

**建议定价：$5-15/次 或 高级套餐（$49+/月）包含月度审计**

---

## 🛠️ 技术选型

| 层面 | 方案 |
|---|---|
| 全站爬取 | Cheerio + node-fetch（轻量）/ Playwright（JS 渲染）|
| 异步任务 | Database polling（自建）/ Inngest（serverless）|
| 数据可视化 | Recharts（排名趋势）/ D3.js（集群地图）|
| AIO 检测 | Perplexity pplx-api |
| GSC 集成 | googleapis npm package |
| Keyword Planner | google-ads-api npm package |
| 一键发布（WordPress）| WP REST API |
