## Context

现有 `resolveModelForContext(context)`(`model-resolver.ts`)已有 4 级优先级链(per-context DB → skill_default DB → `DEFAULT_AI_PROVIDER` env → 硬编码 `vps`),但它只**解析**首选,不负责**失败兜底**。兜底(候选 try/catch 循环)目前只在 `strategy/generate`(`content_strategy`)和 `semantic-gap-service`(`skill_default`)各手写一遍。其余用点要么 `getDefaultProvider()`(无解析、无兜底),要么 `getProvider('deepseek')` 硬编码(StellarWriter)。

LLM 用点清单(explore 已确认):

| 用点 | 文件 | 现状 | 目标 context |
|---|---|---|---|
| DNA 提取 / 业务页选择 | `crawler.service.ts` ×3-4 | `getDefaultProvider()` 无兜底 | `dna_extraction` |
| 竞品 scan | `competitors/[id]/scan/route.ts` | `getDefaultProvider()` | `competitor_analysis` |
| 竞品 suggest | `competitors/suggest/route.ts` | `getDefaultProvider()` | `competitor_analysis` |
| geo-writer 初稿 | `generate-stream` + `stellar-writer.ts` 初稿段 | resolve 单发 / 硬编码 | `content_generation` |
| 审校重写 | `stellar-writer.ts`(Auditor/Editor/Refining 段) | 硬编码 deepseek | `content_refinement` |
| 一键生成计划 | `strategy/generate` | resolve+候选循环 ✅ | `content_strategy`(去重) |
| 语义缺口 | `semantic-gap-service` | resolve+候选循环 ✅ | `skill_default`(去重) |
| 向量化 | `resolveEmbeddingProvider` | gemini 专用 | `embedding`(不动) |

## Goals / Non-Goals

**Goals:**
- 一个共享 `generateWithFallback` 收编所有兜底逻辑,全部 LLM 用点统一走它。
- 每个用点挂命名 context,首选模型在 admin 可视可配。
- DNA / StellarWriter / 竞品 全部获得抗 429 候选兜底。
- `content_generation` 与 `content_refinement` 分离(决策 B)。

**Non-Goals:**
- 不改 `resolveModelForContext` 既有 4 级优先级链(helper 在其之上叠加兜底)。
- 不让兜底链可配(决策 A:链固定 `vps→deepseek→claude`,无 schema 变更)。
- 不动 embedding 路径(gemini 专用,无对等兜底需求)。
- 不改积分计量、不改各用点的业务 prompt 内容。
- 不做 StellarWriter 管线的更细 per-stage 拆分(audit/edit/refine 暂共用 `content_refinement`)。

## Decisions

1. **helper 签名**:`generateWithFallback(prompt: string, opts: { context: string; temperature?: number; model?: string; ... }): Promise<AIResponse>`。内部:
   - `resolved = resolveModelForContext(context)`
   - `candidates = dedupe([{provider: resolved.provider, model: resolved.modelId}, {vps}, {deepseek}, {claude}])`
   - 顺序 try/catch,首个成功即返回;全失败抛最后错误。日志记录每次降级。
   - 放在 `model-resolver.ts`(同模块,复用 `isValidProvider`/`getProvider`),从 `skills/index.ts` 导出。

2. **候选链构造**:首选放第一;其后固定追加 `vps / deepseek / claude`(去重首选已含的)。与现有 `strategy/generate` 的写法一致 → 那两处直接换调 helper,行为等价。

3. **context 命名与拆分**(决策 B):新增 `dna_extraction` / `competitor_analysis` / `content_refinement`;沿用 `content_generation` / `content_strategy` / `skill_default` / `embedding`。`consultation` 核实无调用点 → 从 admin CONTEXTS 移除(或留注释标记待接)。

4. **StellarWriter 迁移**:`preferredProvider`/`getProvider(fixed)` → 初稿段走 `generateWithFallback(..., { context: 'content_generation' })`、审校段走 `content_refinement`。默认等价性:context 未配时,兜底链首个真实模型即 deepseek == 原硬编码值 → 行为不回归。

5. **admin UI**:`CONTEXTS` 数组加 3 个新项(key/label/description),复用现有 `ContextModelAssignment` 渲染与保存逻辑,无需新组件。

6. **embedding 不进 helper**:保持 `resolveEmbeddingProvider`(gemini 专用),仅在 admin 列表保留。

## Risks / Trade-offs

- **StellarWriter 行为等价性**:从硬编码 deepseek 改为可配 + 兜底,须确认未配时默认仍命中 deepseek(靠兜底链顺序保证),并冒烟 geo-writer 全流程不回归。
- **流式场景**:`generate-stream` 是流式响应,兜底需在"建立流之前"完成首字生成尝试;若首选在流中途失败,兜底较难(流已开始)。**取舍**:helper 兜底覆盖"开始前解析+首调失败",流中途失败仍按现有错误处理。design 不强求流中切换。
- **候选链固定**:个别 context 可能不想兜底到 claude(成本)。决策 A 接受此简化;若将来要 per-context 链,再加 `fallbackChain` 字段(已记为扩展点)。
- **多处迁移的回归面**:competitors/DNA/stellar 都改;靠逐点冒烟 + tsc 控制。风险中低(路由层,不改 prompt/业务逻辑)。

## Implementation Notes (for Gemini / Antigravity)

**已知遗留冲突:**
- `crawler.service.ts` 的 `extractBusinessDna` 等用 `getDefaultProvider()`,且该函数内有确定性 `sanitizeProof` 兜底——迁移只换"取 provider + 调 generateContent"为 `generateWithFallback`,**不动** sanitizeProof / 语言隔离 / 业务页选择逻辑。
- `generate-stream` 已有静态默认(deepseek/deepseek-chat)兜底分支;迁移后由 helper 统一,删除重复的静态分支但保留"DB 不可用时仍能跑"的语义。
- `strategy/generate` 与 `semantic-gap-service` 已有候选循环 → 替换为 helper 调用,**确保候选顺序与温度参数等价**,避免行为漂移。

**禁止触碰范围:**
- 不改 `resolveModelForContext` 的 4 级优先级链与签名。
- 不改任何 LLM prompt 文本、积分计量、`resolveEmbeddingProvider`。
- 不改 better-auth / i18n / 数据层。

**本 change 边界(只允许改动):**
- `src/lib/skills/model-resolver.ts`(加 helper)+ `src/lib/skills/index.ts`(导出)。
- 迁移:`crawler.service.ts`、`competitors/[competitorId]/scan/route.ts`、`competitors/suggest/route.ts`、`generate-stream/route.ts`、`stellar-writer.ts`、`strategy/generate/route.ts`、`semantic-gap-service.ts`。
- admin:`ContextModelAssignment.tsx`(CONTEXTS)+ 必要时 `models/actions.ts`。

**其他注意事项:**
- 默认等价性是头号验证点:StellarWriter / DNA 在 ModelConfig 未配任何 context 时,实际命中的模型须与改动前一致(deepseek 系)。
- 改完 `npx tsc --noEmit` 保持仅 1 个预存 auth.ts 错误。
- 冒烟:onboarding(DNA)、geo-writer 全流程(初稿+审校)、竞品 suggest/scan、一键生成计划,各跑一次确认不回归。
