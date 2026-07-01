# 技术 Backlog

> 归档时间：2026-06-12  
> 说明：业务基础已就绪，转向内容与营销阶段。以下技术任务按触发条件分类，有空或有需求时再启动。

---

## 🔧 随时可做（< 1 天，无前置条件）

| 任务 | 来源 | 说明 | 状态 |
|---|---|---|---|
| Geo-writer 加公开导航入口 + 首页工具区块 | Sprint 4.1 | 30 分钟，提升工具曝光 | ✅ 导航已加/首页推迟到 `homepage-plg-repositioning` |
| PostHog：工具页访问追踪 | Sprint 1.2.4 | `geo-writer` 页面加 `posthog.capture` | ✅ 已完成 |
| PostHog：`content_plan_created` 事件 | Sprint 1.4.4 | Strategy Board 里补一行 | ✅ 已完成 |
| PostHog：`article_saved_to_library` 事件 | Sprint 1.6.2 | Library 保存时补追踪 | ✅ 已完成 |
| 验证密码重置邮件流程 | Sprint 2.2.2 | 手动测试，无需写代码 | ✅ 已完成 |
| `npm run build` 全量验证 | AI 模型管理 1.6.5 | 确认生产构建无报错 | ✅ 已完成 |

---

## ⚡ 有触发条件时启动

### 当 Coolify 有运维时间时
- **MinIO 反代修复（Sprint 0.1.5）**  
  修复 `media.scaletotop.com` → MinIO S3 端口 9000 的 Coolify 反向代理配置。  
  修好后解锁：0.5.2（Notion 图片同步验证）+ 0.5.3（博客封面图）

- **VPS Postgres 自动备份**（retire-notion-content-cleanup 0.1）  
  配置 pg_dump cron + 异地存储 / Coolify 备份。Notion 退役后 DB 是内容唯一副本，需在有运维窗口时完成。  
  完成后执行一次手动全量备份并确认可恢复（retire-notion 0.2）。

### 当 systeme.io 自动化规则需要配置时
- **Sprint 2.4.4**：在 systeme.io 平台配置 `registered` 标签 → 7 天引导序列（纯平台操作，无需写代码）

### 当有 n8n 实例可用时
- **Sprint 2.5.1**：每日 cron → 注册 7 天且 siteCount=0 → 打 `inactive_7d` 标签  
- **Sprint 2.5.2**：每日 cron → 注册 14 天无 credits 消耗 → 打 `inactive_14d` 标签

### 当有发布文章 + 真实用户时
- **Sprint 3：RAG 知识库 + AI 客服**（~4 天）  
  pgvector 知识库 + n8n embedding 同步 + AI 问答工作流  
  依赖：已有文章内容 + `GeminiEmbeddingProvider`（已实现）

### 当用户量增长需要产品黏性时
- **Sprint 5：MCP Server**（~8 天）  
  让用户通过 Claude Desktop / Cursor 接入 ScaletoTop  
  关键工具：`get_site_audit`, `get_keywords`, `generate_article`

---

## 📅 中长期（需专项规划）

| Sprint | 内容 | 依赖 |
|---|---|---|
| Sprint 6 | Google Ads 数据分析（OAuth + 看板） | Google Ads 客户有需求时 |
| Sprint 7 | Meta Ads 数据分析（Marketing API） | Meta App Review 通过后（需提前申请） |

> **注意**：Meta App Review 审核约 2 周，若计划做 Sprint 7，需提前提交申请。

---

## 📝 等待内容素材

- **Sprint 4.2：Case Studies 页面**  
  需要 3 个真实匿名案例（行业 / 挑战 / 方案 / 结果数据）  
  代码结构已就绪，素材一到位即可上线

---

## ✅ PLG 首页 + 公共免费审计（2026-06-30，change: plg-homepage-and-free-audit）

- **已做**：公共审计端点 `POST /api/public-audit`（爬取+规则，无 LLM/DataForSEO，SSE 流式，IP 限流+域名缓存+20页上限）；公共审计结果页 `[locale]/(public)/audit`（含进度/评分/GEO 就绪/逐问题注册 CTA）；首页完整 PLG 重排（Hero→证明→痛点→SEO+GEO 品类教育→无注册三步骤→对比→FAQ→单一 CTA）；`HomePageCTA` 域名直入公共审计（无登录墙）；`messages` en/zh 全量更新（`home` + `publicAudit` namespace）；反订阅文案已移除；措辞诚实（"搜索排名与可见度 / GEO 就绪"）。

- **Deferred（保留）**：
  - 邮箱留资门（partial→full report）：首次诊断免费，深度报告需留邮
  - 个性化 hero（输域名后 CTA 动态化）
  - 动态社会证明（真实用户/站点计数）
  - 真证言（有了再加）
  - 深度审计的公共预览（DNA/竞品缺口）
  - 可选 Google PSI 已预留（`GOOGLE_PAGESPEED_API_KEY` env），无 key 跳过

---

## 🔭 增长主页探索收敛（2026-06-24）

> 来源：`/openspec:explore` 对"onboarding 后主页体验"的排查。已拆出三个 active change（`activation-funnel-instrumentation` / `growth-home-data-pipeline` / `business-dna-into-content`）。以下为同次探索中**确认存在但暂不启动**的项。

### ✅ GEO 引用检测名实不符 → 文案已诚实化（change: closed-content-loop，2026-06-29）
- `/api/cron/verify` 的 "Citation Verification" 实际只用 DataForSEO 查 **Google SERP**，文章 URL 进前 100 即标 `status: 'CITED'`——并未查询任何大模型。
- **已做**：library/蓝图 UI 文案全面诚实化（`citation-tracking-honesty` + `closed-content-loop`）：`PENDING(有URL)` → "表现采集中"、无 GSC 数据 → "连接 GSC 后查看真实表现"、messages 同步 en/zh。二元伪状态已退居次要。
- **仍待办（deferred）**：真做 GEO（接入大模型查询管线验证 AI 实际引用，工作量大，非 MVP）；`proofDensity` 作为真·GEO 信号已在蓝图展示。

### ✅ 文章→URL 映射原语（change: closed-content-loop，2026-06-29 部分落地）

**背景**：`TrackedArticle.url` 字段已存在，user backfill（手动回填）已上线。

**三段式解法**（进展）：
1. ✅ **用户手动回填 URL**：library 回填入口已上线（`backfillArticleUrl`）。
2. ✅ **平台博客自动回填**（`closed-content-loop`）：蓝图 → geo-writer → "保存为博客草稿" → admin 发布 → `upsertTrackedArticleFromContent` 自动找同标题孤立 TrackedArticle 回填 URL，进入 GSC 真实归因。
3. 📅 **GSC 关键词→页面 自动匹配**（deferred）：目标词在某 URL 冒头时模糊推断，降低外部发布用户的回填摩擦。
4. 📅 **直连 CMS 发布**（deferred，大、远期）：WordPress/Webflow API 直发，彻底闭环。

**避坑**：不要用"ScaletoTop 子域托管"偷 URL——内容必须在用户自有域名上才能积累其域名权重，托管在我方会伤用户 SEO。

> 依赖链：① 用户回填 URL → 解锁 A（逐文章表现）→ 喂 P3b 简报的"成果数据"；GEO 真做则在 ① 之上再接大模型查询。

### 📅 P3 真空期价值与召回（2026-06-25 explore 重塑后拆分）

> 探讨结论：P3 的"Day1 价值"不该是"竞品对标"，而是**以业务基因为核心的内容资产蓝图**（竞品/GSC 退为衡量辅助）。已拆出两个 proposal + 余项：

- ✅ **P3a → 已起 proposal `content-asset-blueprint`**：DNA 内容资产蓝图（覆盖×证据双轴、加冕下一步、领先指标、一键生成计划），激活闲置的 `proofDensity` / `logicChains`。依赖 `business-dna-governance`（P-DNA，已起 proposal）。
- 📅 **P3b · 每周增长简报邮件**（依赖 P3a + 调度器）：展示量环比 / 新缺口 / 本周该写的 PlannedArticle。**仓库现无 cron 调度配置**（`/api/cron/verify` 靠外部触发）——需先有调度器（n8n / Coolify cron）+ 简报模板 + 数据聚合 + 渠道（Resend vs systeme.io）+ 退订。

### 📅 业务类型轨（2026-06-25 explore，单独排期 · 会回调 P2）
- 给 DNA 增加业务类型轴：**B2B SaaS / B2B 服务 / B2C 电商 / 本地服务 / 内容媒体 / 其他**（先 6 类含兜底；候补：教育课程、Marketplace、高客单 Lead-gen）。
- 采集：**混合**——LLM 提取时自动判定 + 用户在 DNA 编辑里下拉确认。
- 影响面（中等，约 1 字段 + 3~4 处 prompt）：`SiteOntology` +`businessType` 字段 / DNA 提取 prompt / `strategy/generate`（内容形态）/ **`StrategyComposer` 的 `<business_dna>`（回调已归档 P2，影响 GEO 生成的内容形态：导购 vs 白皮书 vs 地域页）**。
- 单独成轨原因：横切信号，须一次性一致地穿进各 prompt，且要回调 P2，不宜零散补。

### 🧩 内容引擎其他增强（2026-06-25 explore 副产物）
- **logicChains 进写作骨架**：Problem→Solution→Proof 目前仅在蓝图展示"为什么重要"（P3a）；后续可喂进写作 prompt 让文章天然走该结构 → 同时提升 GEO 可引用度（回调 P2）。
- **蓝图"修剪/翻新"动作（攻防一体）**：当前蓝图只讲"新建"。成熟站需"强化证据 / 翻新衰减 / 去重蚕食"——接已有教练招式 `refresh_decay_content` / `internal_link_optimization`，作为蓝图的第二类动作。
- **蓝图"难度列"**（砍出 P3a MVP）：需要可靠的逐话题竞争难度源（`SiteKeyword.difficulty` 常空 / 竞品逐话题覆盖需新管线 / DataForSEO keyword difficulty）。有可靠源后作为第 4 列加回。
- **logicChains per-pillar 映射**：把站点级 Problem→Solution→Proof 对到具体支柱（需 LLM），用于蓝图更精准的"为什么重要" + 写作骨架。P3a MVP 用 `relevance` 替代。
- **持久化 `ourStrengths` 以准确计"已覆盖"**（2026-06-26）：`getSemanticGap` 只持久化缺口、不存强项。蓝图无法可靠区分"真·强项"与"join 没匹配上"，故采安全失败（无匹配 = 未覆盖，宁可多显示工作也不藏缺口）→ 成熟站的强项会被低估为缺口。修向：持久化 ourStrengths（含 coverageScore），蓝图据此准确标"已建立"。
- ✅ **Gemini 429 兜底（已完成，change: unified-llm-model-routing）**：全站 LLM 用点统一接入 `generateWithFallback` helper（`model-resolver.ts`），候选链 `[首选, vps, deepseek, claude]` 自动兜底。覆盖：DNA 提取、页面聚类、竞品 scan/suggest、内容策略、语义缺口、StellarWriter 初稿+审校、generate-stream。candidate-fallback 3 处重复已抽共享 helper 消除。
- **蓝图 join 语言一致性**（2026-06-26 已就近修）：`debt.topic` 必须与 `idealTopicMap` 同语言才能 join；已在 `ontology.ts` 给 `getSemanticGap` 传 locale。根治仍依赖 issue 1（站点内容语言）——存量错配数据需重新分析才会对齐。
- ✅ **支柱精确身份（closed-content-loop，2026-06-29）**：蓝图 geo-writer 链接新增 `pillar=<topic>`（不可编辑身份）；geo-writer 独立 `sourcePillarId` state 不随关键词漂移；`matchesPillar` 改为 sourcePillar 精确相等优先，消除多含"SEO/AI"词根支柱的过配问题。
- ✅ **真实内链双模面板（closed-content-loop，2026-06-29）**：`StellarEnricher` 新增 `realLinks`（真实 TrackedArticle URL，可一键复制 Markdown 插入）+ `clusterSuggestions`（模板话题，仅建议去写，不插正文）；`generate-enrich` 路由接受 `siteId` → 按话题相关度返回真实链接；新站无内容时仅集群建议。📅 deferred：调度器（P3b 简报）/ proofDensity 回流 / 分发闭环 / GSC 自动匹配 / 直连 CMS / 成熟站内容盘点 / 流水线看板。

### 🧬 业务基因提取质量（2026-06-26 explore 收敛 → 已起 proposal）

> issue 1（语言错配）+ issue 2（上下文太薄误判成亚马逊）已收敛成 proposal **`dna-extraction-quality`**。
> 核心理念：**DNA = 语言无关的业务本质 → 主语言干净提取一份"规范 DNA" → 输出按目标语言 LLM 桥接**（提取 O(1)，否定了"逐 locale 各提取一份"的重方案）。proposal 含：语言无关主语言检测、单语言隔离 + 业务页正文提取、统一提取器、schema 补 positioning/brandTone/sourceLocale、缺口用 sourceLocale（修蓝图 join）、glass-box、编辑保护、薄站降级。
>
> **以下为同次 explore 识别、proposal 留作扩展点 / 未来的项：**

- **飞跃1 · SERP 接地 idealTopicMap**：提取话题图谱时并入竞品/SERP 真实排名话题（DataForSEO）→ 市场接地而非 LLM 凭空想。统一提取器已留"外部话题信号"入参。
- **陈旧检测**：提取时记站点签名（关键页 hash/页数）；后续爬取显著变化 → 主动提示"刷新业务基因"。
- **竞品推断共用干净管线**：`inferCompetitors` 复用同一单语言提取上下文 + 用 DNA 反向校验竞品（否则 DNA 错会沿竞品扩散）。
- **飞跃2 · 活的 DNA（未来 epic）**：GSC 真实表现回流修正 idealTopicMap（你实际排名、图谱却没有的话题 → 补全/修正）→ DNA 从一次性快照变成被市场验证的活模型。接 [A 衡量环 + 文章→URL 原语]。
- **onboarding DNA 确认一等步骤**（高优先，单独 change）：DNA 错 → 下游全错 → 第一天激活就死。应在 onboarding 把"这是我们对您业务的理解，确认/修正"做成显眼步骤，而非埋在 #overview / 仅靠 `define_ontology` 招式事后提示。
- **展示层翻译**（决策 M 推迟）：蓝图/编辑器本期显示规范语言 + 来源标注；后续可加按后台语言的一次性缓存翻译。
- **出海定位框架**（营销/文案）：把"单一规范 DNA + 输出桥接"作为卖点——"一次读懂您的业务，帮您用目标市场语言生产内容"，天然契合中国出海客户。
- ~~完整 per-locale 多份 DNA~~：已被"单一规范 + 桥接"取代，除非将来出现"各语言真是不同业务"的客户再议。

### ✅ 已修复的既有 bug（2026-06-25 P1 真机验证时发现）
- **settings security.tips 数组渲染崩溃**：`dashboard/settings/page.tsx` 用 `t.rich("security.tips")` 渲染一个**数组**消息，next-intl 不支持数组消息 → `INVALID_MESSAGE` 报错。与 P0/P1/P2 无关的既有 bug，已改为 `t.raw(...)` + `.map()` 渲染。留痕备查。

### 🖼️ 自动配图占位图（autoVisuals）治理（2026-06-25 发现）
- 内容生成的 autoVisuals 会往正文塞 `loremflickr.com` 占位图 URL，进入发布内容后 blog 页 `next/image` 因域名未配置而**整页崩**。
- 已做的**止血**（`blog/[slug]/page.tsx` markdown 图片渲染器）：
  1. 改用普通 `<img>`（替换 `next/image`），任意外域不再整页崩；
  2. 修非法嵌套：原 `<figure>/<div>/<figcaption>` 被 ReactMarkdown 包进 `<p>` → 每图一个 hydration 错（崩溃修好后才浮现）。已全部改为 `<span className="block">`（合法的 `<p>` 内联子元素），消除 hydration 报错。
- **根因待办**：autoVisuals 不应把临时占位图（loremflickr）写进**发布**内容——应生成真实图（MinIO 上传）或在发布前替换/剔除占位图。独立排期。

### 🎨 geo-writer 全文件 i18n + token 归正（2026-06-25 发现）
- **背景变更**（`tools-placement-and-access`，2026-07-01）：geo-writer 已搬进 dashboard（`/dashboard/tools/geo-writer`），不再是公开双语页，i18n 路由问题不再适用（dashboard 单语中文）。但仍有：
  - **121 处 `slate-*` 硬编码色**：违反 token 纪律，待 `/normalize` 归正。独立排期（deferred）。
  - **文案全内联中文**：dashboard 版 locale 由 `User.locale` 决定，EN 用户写 EN 内容时界面仍是中文。待 i18n 化（deferred，低优先）。
- 对比参考：`library/edit/[id]/LibraryEditor.tsx` 已部分迁移（有 COPY + useTranslations，但仍残留 ~19 处 slate），可一并归正。

### 🧹 技术卫生（2026-06-25 记录）
- ✅ **Prisma 迁移历史漂移（2026-06-26 已解决）**：自 `20260322131429` 起整套变更（i18n / 教练层 CoachMove / 咨询系统 / ModelConfig / SiteKeywordSnapshot / Author 等整表 + 大量列 + confirmedAt）只在生产库、不在 migrations。已用**本地临时 Postgres 当 shadow** 生成精确漂移 SQL → 建 `20260626120000_baseline_drift_catchup` → 在生产 `migrate resolve --applied`（仅记录不执行，生产零变更）。现 `migrate status` = up to date（6 迁移），全新环境可完整 `migrate deploy` 重建。**今后 schema 变更走 `migrate dev`，勿再用 `db push`。**
- **`src/lib/auth.ts:107` 类型错**：`Property 'locale' does not exist`（better-auth additionalFields 的类型未声明）。`tsc --noEmit` 唯一报错，既有、不影响运行。待办：给 better-auth user 类型补 `locale` 声明。

### 💵 商业化探索：订阅分层 + 质量门 + 退额度（2026-06-27 explore，**未决，待续探**）

> 一次 explore 的完整调研,尚未拍板。以后接着挖时从这里继续。

**现状(真实数据)**：
- 积分成本：满篇文章 `GEO_WRITER_FULL=35`、审计 `5`（`src/lib/config/credit-costs.ts`）。
- Creem 套餐（一次性,`src/lib/billing/products.ts`）：50c/$9、130c/$19(荐)、300c/$39 → **一篇 ≈ $4.5–6.3**。
- 真实成本 ≈ LLM($0.005–0.1) + DataForSEO($0.05–0.2) ≈ **$0.1–0.4/篇** → **毛利 ~92–98%**(便宜模型时)。
- `User.credits 默认=0` → **注册不送积分 = 核心价值前的"转化墙"**;免费的只有 instant-audit(不计费,亏损引流)。
- 成本漏：`isRepeat=0`(同词免费重生)、`strategy/generate` 一键生成计划**免费却调 LLM**、gap/coach 的免费 LLM 操作。

**核心洞察**：质量门让"credits = 有质量保证的产出单位" → 订阅可按 **"X 篇可发布文章/月"** 计价(而非"300 积分")。质量门 + 订阅互相成就：
- 质量门是**免费层安全网**(便宜模型 + 重写救到够好 → 敢给免费、不砸招牌)→ 转化。
- 质量门是**订阅留存引擎**(稳定达标才续费)→ MRR。
- 退额度在订阅里退的是"额度单位"非现金 → 近零成本给"质量保证"+ 防薅(给重生非现金)。

**拟定订阅模型(混合：月度积分额度 + 能力闸)**:

| 层 | 价位(示意) | 站点 | 月积分(≈文章) | 能力闸 |
|---|---|---|---|---|
| 免费 | $0 | 1 | ~50(≈1篇) | 审计+蓝图只读 |
| 初创 | $19–29 | 3 | ~300(≈8篇) | 策略板生成、竞品、蓝图全功能 |
| 专业 | $49–99 | 10 | ~1000 | GSC/GA4、优质模型、批量 |
| 机构 | $199+/定制 | 不限 | 大额 | 多席位、白标、**+咨询时长**、API/MCP |

**质量门现状(Q2 调研)**：低分→重写**已部分具备**——`RefiningStudio.refine`(humanScore<60→拟人重写)+ `StellarAuditor.evaluate`(needsRevision+instructions)→`StellarEditor.revise`，覆盖 SEO/GEO/拟人三维。**缺**：信息密度/逻辑流/事实三维(需 LLM-judge)+ 统一 scorecard 80 总门 + 确认主路径重写循环。退额度机制(`CreditTransaction.REFUND` + admin)现成。

**待对齐决策(未决)**：
- A. 质量(模型)按层分?(倾向是:免费=够用、专业+=优质,质量作升级杠杆+控成本)
- B. 质量门/退额度 普适 vs 分层?(倾向普适,产品对质量负责的底线)
- C. 自动重写次数上限?(倾向 1 次,扁平订阅控成本;救不回明示分数+退额度)
- D. 免费层质量底线(够好到能转化)
- E. 对外计价用"X 篇可发布/月",内部仍 credits 记账

**MVP 时机(未决)**：
- A. MVP 先上"免费额度 + 现有积分包"(只破转化墙,最快上线),订阅作上线后第一大迭代。**(倾向)**
- B. MVP 就上极简两层(免费+专业),其余后补(recurring 是上线硬目标时选)。

**快赢(可独立先做)**：注册送 ~1 篇免费额度(改默认 credits + 一次性/邮箱验证防滥用)→ 破"0 积分转化墙",成本 ~$0.3/注册。

### 🔌 GSC 集成健壮性（2026-06-27 真机发现）

- **所有权验证不应依赖同意门控的 GTM**：GTM 现经 `CookieConsentBanner` 客户端、**仅同意 Cookie 后**注入 → 页面原始 HTML 无 GTM → Google 验证爬虫看不到 → 周期性重验时**掉所有权验证**（"之前正常突然要重验"的真因；curl 线上确认 HTML 无 GTM）。修向：提供**不受同意门控的验证**——layout `<head>` 服务端渲染 `google-site-verification` meta，或文档指引用 DNS TXT。GTM 同意门控保持不动。
- **property www/子域 选择指引 + 错配检测**：`site.domain`(scaletotop.com) 与存的 `GscConnection.propertyId`(https://www.scaletotop.com/) 可能错配 → 查询"无权限"、数据哑火。且**域名资源会扫入子域**(cool/aladdin 等不想追的)。修向：property 选择器优先建议"**主站规范主机的 URL 前缀资源**"(host 精确、排除子域)+ 标注域名资源含所有子域 + 检测 www/非www 错配并提示。
  - 业务事实(记录备查)：scaletotop **规范主机=www**(scaletotop.com 301→www);要排除 cool/aladdin 等子域 → 应选 `https://www.scaletotop.com/` 的 **URL 前缀资源**(非域名资源)。

### 📅 P4 · 站点详情 IA 重构（中长期）
- 当前 `site-intelligence/[siteId]` 有 8 个 tab，认知负荷与教练层"少决策"初衷相悖。
- 重新分组，并与 GrowthHome 的 overview 去重（可能合并）。
- 触发条件：P1 把"主页 vs 详情"的分工先定下来之后。

### 🌐 成熟站内容覆盖盲区 + 配图/抓取治理（2026-06-29 写作流程体验发现）

- **#4 成熟站主题冲突风险（需起 proposal）**：`getSemanticGap` 的"自有内容话题"只来自 `seedKeywords + GSC 关键词 + 审计实体`,**不读站点完整既有内容**。成熟站若有大量内容未进这三个信号(尚未排名/GSC 无展示)→ 蓝图可能把**已写过的主题当缺口推荐**,产生重复/冲突。
  - 缓解(现状):连 GSC 后已排名内容会以关键词计为"已覆盖"。
  - 根治:抓取站点实际内容(sitemap / 已发布文章)纳入覆盖判定 + 持久化 `ourStrengths`(与既有 ourStrengths backlog 项合并)。作为成熟站友好度的独立 proposal。
- **autoVisuals 真·配图（post-MVP)**:占位图勾选项已隐藏(`ImageFinder` 用 loremflickr 随机图,乱码且发布页有崩溃风险)。未来做真配图:AI 生图 → 上传 MinIO → 插入正文;或对接正版图库。隐藏处见 geo-writer `autoVisuals`(默认 false)。
- **Reddit/反爬页抓取（已就近修)**:`SkeletonExtractor.extract` 现已过滤反爬/验证页(标题含 please wait / just a moment / cloudflare 等 → 丢弃),不再污染竞品大纲。Reddit 深度内容(评论/讨论)需 **Reddit OAuth**——其公共 `.json` 已全面 403(2023 封禁未授权访问),HTML 是反爬页。当前已用 **SERP 标题+摘要兜底**(被拦页不丢弃、用 Google 索引的真实标题摘要);要真正榨取 Reddit 讨论价值,需注册 Reddit app + client-credentials token 走 oauth.reddit.com,单独排期。

### 📌 closed-content-loop 审计衍生（2026-06-29）
- **"我们博客发布免回填"正经做法(deferred)**:需存 Content↔TrackedArticle 的可靠关联(如 TrackedArticle.sourceContentId),发布时按 id 精确回填 + 仅对"确为我们博客发布"的内容生效。已移除按全局标题的孤儿匹配(跨用户写入风险)。
- ~~**geo-writer "保存为博客草稿" 对普通用户应隐藏**~~:✅ 已完成（`tools-placement-and-access`）— 按钮已有 `role==='ADMIN'` 检查，且 geo-writer 已整体搬进 dashboard（仅登录用户可访问）。
- **slug 已就近修**:blog-draft 原来每篇无条件加 5 位随机后缀 → 改为"同 locale 冲突才加后缀",URL 干净。
