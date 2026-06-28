## Why

全站 LLM 用点的模型选择与失败兜底**不统一**,留下硬伤:

- **5 个真实 LLM 用点完全没有运行时兜底、也无法在 admin 配置**:DNA 业务基因提取(`crawler.service.ts` 3-4 处,onboarding 脊柱)、竞品 scan、竞品 suggest(均 `getDefaultProvider()`),以及 **StellarWriter 主力生成管线**(`stellar-writer.ts` 硬编码 `getProvider('deepseek')`)。Gemini/上游一旦 429 或配额耗尽,这些**核心流程当场失败**——刚做对的 DNA 提取会在第一天 onboarding 挂掉。
- **`content_generation`(generate-stream)半成品**:走了 `resolveModelForContext` 可配置,但解析到的 provider 若失败**没有候选兜底循环**(只有静态默认),单点 429 即死。
- **兜底逻辑重复**:仅 `content_strategy` 与 `semantic-gap` 两处有候选兜底 try/catch 循环,各写一遍 → 复制粘贴。
- **`consultation` context 空挂**:admin 列了但代码无对应 LLM 调用点。

净效果:模型选择不可视不可控,核心路径无抗 429 能力。

## What Changes

- **新增共享 helper `generateWithFallback(prompt, { context, ...opts })`**:内部 `resolveModelForContext(context)` 取首选 → 按固定候选链 `[首选, vps, deepseek, claude]` try/catch 兜底。收编现有 2 处重复逻辑 + 覆盖缺失的 5 处。
- **所有 LLM 用点统一改走该 helper**,各挂一个命名 context。
- **context 拆分(决策 B)**:`content_generation`(初稿)与 `content_refinement`(StellarAuditor/Editor/RefiningStudio 审校重写)分开,使初稿可配便宜模型、审校配强模型(质量×成本可调)。
- **兜底链固定(决策 A)**:每 context 的**首选**可在 admin 配,兜底链 `vps→deepseek→claude` 固定,**无 schema 变更**。
- **admin `ContextModelAssignment` CONTEXTS 扩列**:加入 `dna_extraction`、`competitor_analysis`、`content_refinement`;核实并移除空挂的 `consultation`(或接上真实调用点)。

## Capabilities

### New Capabilities
- `unified-llm-model-routing`: 统一的"命名 context → admin 可配首选模型 → 固定候选链兜底"路由能力,覆盖全部 LLM 用点。

### Modified Capabilities
<!-- 无 spec 级行为变更(现有 model-resolver 优先级链保持不变,仅新增 helper + 迁移调用点) -->

## Impact

- **新增**:`generateWithFallback` helper(置于 `src/lib/skills/model-resolver.ts` 或新 `generate-with-fallback.ts`,从 `src/lib/skills/index.ts` 导出)。
- **迁移调用点**:`crawler.service.ts`(DNA + 业务页选择,3-4 处)、`competitors/[id]/scan`、`competitors/suggest`、`generate-stream`、`stellar-writer.ts`(3 处,`preferredProvider` 硬编码 → context 解析)。
- **复用**:`strategy/generate`、`semantic-gap-service` 改用共享 helper(去重,行为不变)。
- **admin**:`ContextModelAssignment.tsx` 的 `CONTEXTS` 列表扩展;`models/actions.ts` 如有 context 白名单同步。
- **不影响**:`resolveModelForContext` 既有 4 级优先级链、embedding 路径、积分计量、业务逻辑。
- **风险**:中低。纯路由层重构 + 调用点迁移;StellarWriter 从固定 deepseek 改为可配,需保证默认行为等价(context 未配时兜底链首个真实模型 = deepseek)。
- **关联**:根治 backlog「Gemini 429 兜底(部分完成)」与「candidate-fallback 3 处重复抽共享 helper」;清 MVP checklist「LLM/外部 API 失败有兜底」。
