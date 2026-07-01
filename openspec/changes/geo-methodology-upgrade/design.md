## Context

- 现有 GEO:`StrategyComposer` systemPrompt 已含 "1+ Markdown Table"、"Expert Insight blockquote"、"首句 50 词直答"、FAQ 带答案;`StellarEnricher` 出 Article+FAQPage schema、author;`calculateGEOScore(content, entities, topics)` 测**实体覆盖/密度**。
- 研究阶段(`IntelligenceEngine`/`serp-analyzer`)已抓 SERP organic + **PAA** + 竞品骨架 + entities → 这些是**真实统计/引用来源**的原料。
- 诚实基建:`sanitizeProof`(crawler)禁编造统计;citation-honesty 已定措辞方向。
- `topic-source-grounding`(相邻 proposal)会给话题带 `isComparison` + fan-out 种子。

## Goals / Non-Goals

**Goals:**
- GEO 评分测**真正驱动被引的因子**(引用/统计/引述/结构),而非实体密度。
- 写手系统强制 Princeton 前 3(真实统计/来源/引述)+ 反堆砌。
- 单篇覆盖 fan-out 子问题(更可检索);对比意图用对比格式(33% 被引)。
- 全程诚实:统计来自研究真实数据,不编造。

**Non-Goals:**
- 不做真 AI-引用缺口检测(需查 AI 答案/工具,deferred)。
- 不做站点级 GEO 文件生成(llms.txt/schema,Phase 2 deferred)。
- 不改模型路由/积分/DNA 提取。
- 不重写 geo-writer UI(仅 GEO 分拆解轻量改)——视觉债在 `geo-writer-polish`。

## Decisions

1. **Princeton 因子进 prompt(诚实)**:
   - 在 `StrategyComposer` systemPrompt/`ExecutionAgent` 生成指令加:
     - "关键论断尽量挂**真实来源**(来自提供的研究/SERP 数据);无可靠来源则不硬造。"
     - "引用**研究数据中的真实统计**(数字+来源+日期);**禁止编造数字**(sanitizeProof 会清除无出处的统计)。"
     - "如研究含专家/机构,用'据 [名, 头衔/机构]'引述。"
     - "避免关键词堆砌(自然融入)。"
   - 把研究阶段的真实统计/来源**作为上下文喂给生成**(它们已在 intelligence 里)。
2. **`calculateGEOScore` 重做(Princeton 口径)**:
   - 维度(带权重,示意):引用/来源密度、统计密度(带来源)、专家引述存在、结构化答块(直答段/表格/FAQ/定义块检测)、**关键词堆砌惩罚**。
   - 保留可解释 issues/suggestions;去掉纯实体密度作为主分(实体可作辅助信号)。
   - 阈值/文案随口径调整;结果 UI 的 GEO 拆解改显新因子。
3. **fan-out 覆盖(②A)**:
   - 生成前:收集 fan-out 子问题 = 已抓 PAA + LLM 补全(5-10 个)。
   - 大纲阶段确保有对应 H2/H3;或作 FAQ 覆盖。复用现有 PAA→FAQ 管道,扩为"fan-out 全集"。
4. **对比格式**:
   - 判定对比意图:`topic-source-grounding` 的 `isComparison`,或关键词含 vs/best/alternative/对比/替代。
   - 命中 → 生成指令切换对比模板:**对比表**(维度×选项)+ 每维度直答 + 中立客观。
5. **集群连接(②B,复用)**:写手已能拿 siteId/pillar → 复用已建**双模内链**(真实内链 + 集群建议);本期只确保 prompt 感知"所属支柱",不新建。
6. **content-scorecard 对齐**:GEO 维度评测口径更新为 Princeton(用于抽样验质量)。

## Risks / Trade-offs

- **GEO 分数口径变**:分值分布会变,需重设"达标线"并回归(避免旧内容突然全不达标)。
- **真实统计依赖研究质量**:无可靠数据的话题不硬塞统计(诚实优先于分数)——分数可能因此偏低,是正确的(反映真实 citability)。
- **fan-out 可能变长文**:覆盖太多子问题→文章冗长;需限子问题数(5-8)+ 保持聚焦。
- **对比格式误判**:isComparison 判定要准(否则给非对比话题套对比表);用明确信号。
- **与 topic-source-grounding 的耦合**:isComparison/fan-out 种子来自它;本 change 也能自取 PAA,故非硬依赖,但先做 grounding 更顺。

## Implementation Notes (for Gemini / Antigravity)

**已知遗留冲突:**
- **诚实红线**:统计/引用必须来自研究真实数据,**禁编造**;`sanitizeProof` 会清除无出处统计——生成 prompt 要主动用研究数据、无数据不硬造(否则被清后内容空洞)。
- `calculateGEOScore` 签名/调用方(`StellarEnricher`)要同步改;结果 UI 的 GEO 拆解跟着改。
- 措辞延续 citation-honesty(不宣称"AI 引用追踪")。

**禁止触碰范围:**
- 不改模型路由/积分/DNA 提取/公共审计。
- 不做站点级 GEO 文件、AI-引用缺口检测(deferred)。
- 不做 geo-writer 视觉归正(属 `geo-writer-polish`)。

**本 change 边界(只允许改动):**
- `src/lib/skills/skills/stellar/StrategyComposer.ts`、`ExecutionAgent.ts`(prompt/生成)。
- `src/lib/utils/seo-scoring.ts`(`calculateGEOScore` 重做)+ `StellarEnricher.ts`(消费)。
- `IntelligenceEngine`/生成流程(fan-out 子问题集,复用 PAA)。
- 结果 UI 的 GEO 分拆解(轻量)+ `messages`(en/zh,用「您」)。
- `rules/content-scorecard.md`(GEO 维度口径对齐)。

**其他注意事项:**
- 用 `ai-seo` 技能的 references(content-patterns/platform-ranking-factors)作方法论依据。
- 改完用 `content-scorecard` 抽样几篇验 GEO 质量;`tsc` 保持仅 1 预存 auth.ts 错误。
- 回归:GEO 分口径变化后,确认阈值合理、旧内容不误判;fan-out 不过度拉长;对比格式只对对比话题生效。
