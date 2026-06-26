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

## 🔭 增长主页探索收敛（2026-06-24）

> 来源：`/openspec:explore` 对"onboarding 后主页体验"的排查。已拆出三个 active change（`activation-funnel-instrumentation` / `growth-home-data-pipeline` / `business-dna-into-content`）。以下为同次探索中**确认存在但暂不启动**的项。

### ⚠️ 待修复后处理：GEO 引用检测名实不符
- `/api/cron/verify` 的 "Citation Verification" 实际只用 DataForSEO 查 **Google SERP**，文章 URL 进前 100 即标 `status: 'CITED'`、`citationSource: 'Google SERP'`——并未查询任何大模型（ChatGPT/Perplexity/Claude）。
- **对外风险**：不可宣传成"AI 引用追踪"，否则构成虚假宣传。
- **两条路**：
  1. 诚实化文案：UI 改为"收录/排名追踪"，承认是 Google SERP 检查；
  2. 真做 GEO：接入大模型查询管线，验证内容是否被 AI 实际引用（工作量大，非 MVP）。
- **2026-06-25 explore 补充**：`SemanticDebt.proofDensity`（内容证据密度）其实是更靠谱、零新建数据的**真·GEO 信号**（"内容够不够格被 AI 引用"），`content-asset-blueprint`（P3a）已把它做成"证据轴 + 补证据动作"。GEO 差异化优先靠它兑现，再决定上面两条路。

### 🔗 文章→URL 映射原语（A 闭环衡量 + GEO 的共同前置，2026-06-25 explore）

**根本障碍**：平台生成内容但**不负责发布**（用户自行发到 WordPress/Webflow/自建站），因此**不知道文章最终落在哪个 URL**。GSC 是按 URL 记数据的（平台有 GSC 授权、能看全站 URL），缺的就是"这篇生成的文章 ↔ 用户站点上的哪个 URL"。`TrackedArticle.url` 字段已存在但基本为空 → cron 的引用检查被跳过、无法做逐文章表现归因。

**这一个原语同时卡住两件事**：
- **A · 闭环衡量（产出→衡量→学习）**：没有 URL，就无法回答"这篇文章成了吗"（它对应的 GSC URL 涨没涨）。
- **GEO/引用追踪**：连"查 SERP/查大模型引用"都需要 URL。

**重要澄清**：`content-asset-blueprint`（P3a）的**领先指标**（已覆盖支柱数/本月增量）只基于"平台自己记录的产出/发布"，**不需要 URL** → 不影响 MVP。需要 URL 的只是**滞后的真实回报**（排名/引用/逐文章流量）。

**三段式解法**（做 A/GEO 时按序）：
1. **用户回填 URL**（先做，小）：发布后让用户粘贴链接 → 写入 `TrackedArticle.url` → 解锁诚实的 GSC 逐 URL 排名追踪。
2. **GSC 关键词→页面 自动匹配**（中）：目标词在某 URL 冒头时模糊推断，降低回填摩擦。
3. **直连 CMS 发布**（大、远期）：WordPress/Webflow API 直发，平台天然知道 URL，彻底闭环。

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
- ✅ **Gemini 429 兜底（2026-06-26 已做）**：`strategy/generate` 改用 `resolveModelForContext('content_strategy')`（admin 可在 /admin/models 选模型）+ 候选兜底循环（配置→vps→deepseek→claude）；`getSemanticGap` 同样接 `resolveModelForContext('skill_default')` + 兜底。**待办**：这段 candidate-fallback 在 strategy/generate 与 getSemanticGap 重复了，抽成共享 `generateWithFallback(prompt, opts, context)` helper 去重。
- **蓝图 join 语言一致性**（2026-06-26 已就近修）：`debt.topic` 必须与 `idealTopicMap` 同语言才能 join；已在 `ontology.ts` 给 `getSemanticGap` 传 locale。根治仍依赖 issue 1（站点内容语言）——存量错配数据需重新分析才会对齐。

### 🧬 业务基因提取质量（2026-06-26 P-DNA 真机验证暴露）

> P-DNA 让 DNA 可见可改后，暴露了上游**提取管线**的两个既有问题（非 P-DNA/P3a 引入）。短期靠 P-DNA 手动编辑兜底。

- **"AI 重新分析"上下文太薄 → 误判业务**：`ontology` 路由 re-extract 只取存档 `report.nodes` 的 title/h1/desc（薄），且被中文"出海营销"标题主导 → LLM 把 scaletotop（SEO/GEO SaaS）误判成出海电商、**推荐亚马逊话题**，offering 塌成单条泛词。对比 onboarding 的 `extractBusinessDna`（爬取时全文，上下文丰富）质量明显更好。
  - **修向**：让"AI 重新分析"复用 onboarding 级提取（`extractBusinessDna` + 实时爬全文），而非薄 `report.nodes`。
- **站点内容语言缺失 → 语言错配**：`localeDirective(session.user.locale)` 让 DNA/缺口/策略/洞察都跟**用户后台语言**（zh），无视站点内容语言。英文站/双语站（如 scaletotop = 英文根 + 中文出海博客）因此输出中文 DNA。Site 仅有 `targetMarkets`（且常空），无"内容语言"字段。
  - **修向**：给 Site 加"内容语言"（或从 targetMarkets / 爬取语言推断）；DNA/缺口/策略/内容产出用**站点语言**，后台 chrome 仍用 User.locale。双语站需决定主语言或按 locale 分别产出（设计较重）。

### ✅ 已修复的既有 bug（2026-06-25 P1 真机验证时发现）
- **settings security.tips 数组渲染崩溃**：`dashboard/settings/page.tsx` 用 `t.rich("security.tips")` 渲染一个**数组**消息，next-intl 不支持数组消息 → `INVALID_MESSAGE` 报错。与 P0/P1/P2 无关的既有 bug，已改为 `t.raw(...)` + `.map()` 渲染。留痕备查。

### 🖼️ 自动配图占位图（autoVisuals）治理（2026-06-25 发现）
- 内容生成的 autoVisuals 会往正文塞 `loremflickr.com` 占位图 URL，进入发布内容后 blog 页 `next/image` 因域名未配置而**整页崩**。
- 已做的**止血**（`blog/[slug]/page.tsx` markdown 图片渲染器）：
  1. 改用普通 `<img>`（替换 `next/image`），任意外域不再整页崩；
  2. 修非法嵌套：原 `<figure>/<div>/<figcaption>` 被 ReactMarkdown 包进 `<p>` → 每图一个 hydration 错（崩溃修好后才浮现）。已全部改为 `<span className="block">`（合法的 `<p>` 内联子元素），消除 hydration 报错。
- **根因待办**：autoVisuals 不应把临时占位图（loremflickr）写进**发布**内容——应生成真实图（MinIO 上传）或在发布前替换/剔除占位图。独立排期。

### 🎨 geo-writer 全文件 i18n + token 归正（2026-06-25 发现）
- `src/app/[locale]/(public)/tools/geo-writer/page.tsx` 是**公开双语页**（`[locale]` 路由），但全文件 **121 处 `slate-*` 硬编码色 + 0 处 i18n**（无 `useTranslations`、无 COPY 对象，文案全内联中文）→ **EN 用户访问该工具看到的是中文**，且违反 token 纪律。
- 来源：P2 站点选择器审查时发现是文件级既有债（新加的选择器只是随了大流，故未做局部补丁）。
- 建议：对该文件单独跑一次 `/normalize`（slate → `--color-brand-*`）+ 文案抽取到 next-intl messages（zh/en）。工作量中等（121 处色 + 全量文案），独立排期。
- 对比参考：`library/edit/[id]/LibraryEditor.tsx` 已部分迁移（有 COPY + useTranslations，但仍残留 ~19 处 slate），可一并归正。

### 🧹 技术卫生（2026-06-25 记录）
- ✅ **Prisma 迁移历史漂移（2026-06-26 已解决）**：自 `20260322131429` 起整套变更（i18n / 教练层 CoachMove / 咨询系统 / ModelConfig / SiteKeywordSnapshot / Author 等整表 + 大量列 + confirmedAt）只在生产库、不在 migrations。已用**本地临时 Postgres 当 shadow** 生成精确漂移 SQL → 建 `20260626120000_baseline_drift_catchup` → 在生产 `migrate resolve --applied`（仅记录不执行，生产零变更）。现 `migrate status` = up to date（6 迁移），全新环境可完整 `migrate deploy` 重建。**今后 schema 变更走 `migrate dev`，勿再用 `db push`。**
- **`src/lib/auth.ts:107` 类型错**：`Property 'locale' does not exist`（better-auth additionalFields 的类型未声明）。`tsc --noEmit` 唯一报错，既有、不影响运行。待办：给 better-auth user 类型补 `locale` 声明。

### 📅 P4 · 站点详情 IA 重构（中长期）
- 当前 `site-intelligence/[siteId]` 有 8 个 tab，认知负荷与教练层"少决策"初衷相悖。
- 重新分组，并与 GrowthHome 的 overview 去重（可能合并）。
- 触发条件：P1 把"主页 vs 详情"的分工先定下来之后。
