## Why

产品在 onboarding 花大力气提取并让用户确认"业务基因"（`SiteOntology`：`coreOfferings` / `targetAudience` / 定位），并以"逐条点亮"的方式演"我们懂你的业务"。但代码图谱排查显示：**基因层只进入了"规划"，没进入"写作"。**

DNA 的消费方：
- ✅ `inferCompetitors`（推断竞品）
- ✅ `getSemanticGap`（算语义缺口）
- ✅ `strategy/generate`（生成内容计划 = 写什么）
- ✅ coach `buildInsight`（啊哈洞察）
- ❌ **真正写文章的链路**（`generate-stream` / Stellar 流水线 / `StellarWriterSkill`）——完全不读 DNA

具体落点：`StrategyComposer.compose`（[StrategyComposer.ts:11](src/lib/skills/skills/stellar/StrategyComposer.ts#L11)）拼装 systemPrompt 时有一个 `<personalization>` 块，但里面只有 `brandName / tone / type`（来自表单），**没有"这家企业做什么、面向谁、差异点是什么"**。整条 Stellar 流水线（ExecutionAgent / StellarEditor）都从这里取 systemPrompt。

后果是**承诺断裂**：onboarding 演了"懂你"，到了交付价值的核心动作（写作）这份"懂"消失，产出通用 SEO 文，不带这家企业的定位与口吻。这直接决定产出值不值得用户继续用、继续花 credits——比缺一张图严重得多。这是验证下来最高性价比的优化：改动集中、不碰架构、见效直接。

## What Changes

- 在写作链路把站点 `SiteOntology`（`coreOfferings` / `targetAudience` / 定位/差异点）取出并注入内容生成的 system prompt。
- 在 `StrategyComposer.compose` 的 `<personalization>`（或新增 `<business_dna>` 块）中加入：服务对象（targetAudience）、核心提供（coreOfferings）、定位/差异点，指导模型"为这家企业、对这群读者、用这个定位"来写。
- 把 `siteId` / ontology 穿过写作入口（`StellarWriterSkill.executeInternal`、`generate-stream`）传入 `IntelligenceContext` / options，直到 `compose`。
- DNA 缺失时优雅降级（无 ontology 则退回当前通用行为，不报错）。

## Capabilities

### New Capabilities

- `dna-aware-content-generation` — 内容生成在 prompt 层消费站点业务基因。

### Modified Capabilities

- 写作 prompt 拼装（`StrategyComposer`）契约：systemPrompt 增加业务基因段。

## Impact

- **定位**：dashboard / 写作后端能力，非公开页，无 i18n 路由影响。注意基因段需随内容 `locale` 用对应语言表述（zh/en），与产出内容语言一致。
- **文件**（预估，实施时以代码为准）：`StrategyComposer.ts`（注入点）、`StellarWriterSkill`（取 ontology + 透传）、`generate-stream/route.ts`（同）、可能 `prompt-enhancer.ts`。
- **无 token / 无新页面 / 无破坏性 UI 变更**：纯后端 prompt 增强。
- **依赖 / 协同**：与 `activation-funnel-instrumentation`（P0）天然配套——P0 的"首个有意义动作完成"和内容相关指标正好用来度量 DNA 改造后内容质量/留存有没有变化。
- **质量风险**：prompt 变化会改变产出。需用固定输入做改前/改后对比抽样评估（见 tasks）。
