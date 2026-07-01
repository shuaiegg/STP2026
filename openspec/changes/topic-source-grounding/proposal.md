## Why

内容管线的**源头话题(`idealTopicMap`)是 LLM 凭训练知识想象的,不接真实需求**(explore 确认)。生成 prompt 是 "5-10 semantic pillars a leader in this **niche** MUST cover" —— 由 DNA 推断出行业,再由 LLM 在行业层面想象话题。后果:

- **需求盲**:不知道话题有没有真实搜索量、AI 会不会 fan-out 到、竞品是不是已排/被引。
- **行业通用**:同 niche 的两个竞品会得到几乎一样的图谱 —— 不是"你专属"。
- **源头垃圾进,全程垃圾出**:下游(缺口→蓝图→加冕→写手)把**可能错的话题**优化得再好也是精修错内容。
- **削弱获客钩子**:`idealTopicMap` 喂蓝图、蓝图喂**公共免费审计**。源头是想象 → 审计说"AI 觉得你该覆盖这些"(泛、不可信);源头接地 → 审计说"这些**有真实搜索量**的话题你没覆盖、竞品在排"(硬、可信)。

好消息:接地需要的数据管道**已经全有**(`getRelatedTopics` 返回相关词+搜索量+PAA、`searchGoogleSERP` 出 PAA、`inferCompetitors` 出竞品真实排名话题),只是 `idealTopicMap` 生成时没喂给它。这是"接线",不是新集成。

## What Changes

- 新增**接地步骤** `groundIdealTopicMap`(在 DNA 提取之后的独立 pass,**不改动已稳定的 DNA 提取 prompt**):
  1. 对 LLM 骨架支柱 + 种子词调 `getRelatedTopics` → 真实相关词 + **搜索量** + PAA(fan-out 问题)。
  2. 复用 `inferCompetitors` 已抓的竞品 SERP → 竞品真实排名话题。
  3. **重合成 `idealTopicMap`**:保留有真实信号(有量/有 PAA/竞品覆盖)的支柱;补上真实数据里有、LLM 漏掉的 fan-out 缺口;降权/剔除零信号的纯幻觉支柱。
  4. 每个支柱附带:**真实子话题(来自 PAA/相关词)+ 搜索量 + 对比机会标记(X vs Y / best / alternatives,33% 被引类型)+ 竞品覆盖标记**。
- `idealTopicMap` JSON 形态扩展(`Json` 字段,**无需迁移**):`{ topic, subtopics, searchVolume?, isComparison?, competitorCovered?, fanoutQuestions? }`。
- 蓝图/审计**轻量呈现**新信号(支柱旁显示搜索量、对比机会徽章)—— 强化审计可信度(获客钩子)。
- **诚实**:数据来自 DataForSEO 真实信号,不编造(延续 sanitizeProof/citation-honesty)。

## Capabilities

### New Capabilities
- `topic-source-grounding`: 用真实 fan-out(PAA)+ 搜索量 + 竞品排名 + 对比机会,把 `idealTopicMap` 从"行业通用想象"接地为"你的市场真实话题图谱"。

### Modified Capabilities
<!-- 不改 DNA 提取的其它字段;仅在其后接地 idealTopicMap -->

## Impact

- **新增**:`groundIdealTopicMap` in `crawler.service.ts`(或独立 `topic-grounding.ts`);复用 `DataForSEOClient.getRelatedTopics` / `inferCompetitors`。
- **修改**:onboarding / 手动重析流程在 DNA 后调用接地;`idealTopicMap` JSON 形态扩展;蓝图/审计轻量显示搜索量/对比徽章。
- **不影响**:DNA 提取的其它字段与 prompt(保持稳定)、模型路由、积分。
- **成本**:每站点**一次性** ~$0.1-0.5(接地 ~8 个支柱的 getRelatedTopics;竞品 SERP 已在跑,复用)。DNA 提取只在 onboarding/重析时跑,不频繁。onboarding 会多几次 DataForSEO 调用 → 可后台/缓存降低感知延迟。
- **风险**:中。接地在 DNA 之后独立跑(隔离,不动已稳的 DNA);DataForSEO 失败要降级(接地失败 → 回退纯 LLM 图谱,不阻断 onboarding)。
- **关联**:落地 backlog「飞跃1 · SERP 接地 idealTopicMap」;同时强化 `plg-homepage-and-free-audit` 的审计可信度 + 为 `geo-methodology-upgrade`(写手 L3)提供"对的话题"。
- **Deferred(backlog)**:LLM 智能重合成(本期用确定性接地 + 可选轻量 LLM 重排)、公共审计展示搜索量、真 AI-引用缺口检测(需查 AI 答案,飞跃2/工具)、活的 DNA(GSC 回流)。
