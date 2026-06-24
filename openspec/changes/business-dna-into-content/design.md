## Context

基因层在"规划"被充分使用，在"写作"完全缺席：

```
基因层 (SiteOntology / coreOfferings / targetAudience / 定位)
   ├─✅ inferCompetitors / getSemanticGap / strategy.generate / coach.buildInsight
   └─❌ generate-stream / Stellar 流水线（真正写文章）  ← 本变更要补的口子
```

写作链路（确认过的拓扑）：

```
StellarWriterSkill.executeInternal  ─┐
generate-stream/route.ts            ─┴─→ IntelligenceContext/options
        → StrategyComposer.compose()  ← 拼 systemPrompt（含 <personalization>）
              → ExecutionAgent.generate / StellarEditor.revise  ← 复用该 systemPrompt
```

`StrategyComposer.compose` 现有 `<personalization>` 仅含：`brandName`、`tone`、`contentType`。改一处（compose）即覆盖整条流水线。

## Goals / Non-Goals

**Goals:**
- 让生成的文章"像这家企业写的"：体现其 coreOfferings、面向其 targetAudience、贴合其定位/差异点。
- 注入对全部写作入口（Stellar skill + generate-stream）生效。
- DNA 缺失时无副作用降级回当前行为。

**Non-Goals:**
- 不改写作的结构/语气规则（banned words、mandatory elements 等保留）。
- 不改 ontology 的提取或编辑流程（DNA 从哪来不变）。
- 不动 SERP/competitor/gap 等既有增强段。
- 不做内容质量自动评分系统（人工抽样评估即可；自动评分见 content-scorecard，另议）。

## Decisions

### 决策 1：注入点在 `StrategyComposer.compose` 的 personalization 段

在现有 `<personalization>` 内或紧邻新增 `<business_dna>` 段，加入三要素：

- **服务对象**（targetAudience）：写作时对谁说话、用什么认知水平与关切。
- **核心提供**（coreOfferings）：这家企业实际做什么，确保举例/视角与之一致、不跑偏。
- **定位 / 差异点**：文章应隐含的立场与角度（在不违反"客观、无promo夸张"约束前提下）。

保留现有 `brandName / tone / type`，DNA 与之叠加而非替换。

### 决策 2：siteId/ontology 的传递路径

写作入口已知 `siteId`（或可由执行上下文获得）。在 `executeInternal` / generate-stream 处用 `siteId` 查最新 `SiteOntology`（取 `version desc` 第一条，与 coach `buildMoveContext` 取法一致），整理为精简 DNA 对象后随 `options` 传入 `compose`。仅取写作需要的字段，避免把整条 ontology 塞进 prompt。

### 决策 3：locale 对齐

DNA 段的措辞语言须与产出内容 `locale` 一致（生成中文文章用中文描述 DNA，英文同理），避免中英混杂污染产出。ontology 字段本身可能是单语，必要时按 locale 简单处理（实现时定）。

### 决策 4：缺失降级

无 ontology / 字段为空 → 不输出 DNA 段，退回当前通用行为。DNA 段是"有则更准"，绝不能因缺失而报错或产出空块。

## Risks / Trade-offs

- **prompt 变化改变产出质量**：可能更好也可能引入跑偏。缓解：用固定输入做改前/改后对比抽样（同关键词、同站点），按 `rules/content-scorecard.md` 五维人工评估后再合入。
- **DNA 过度主导导致"软文化"**：可能违反现有"客观、无促销夸张"约束。缓解：DNA 段措辞强调"用于视角与相关性，不得转为推销口吻"，保留 banned words 约束。
- **token / 成本**：prompt 变长。DNA 段精简（三要素、可截断），增量可忽略。
- **多写作入口不一致**：若只改 compose 而某入口绕开它，则覆盖不全。缓解：tasks 中逐入口确认都经过 `compose`。
