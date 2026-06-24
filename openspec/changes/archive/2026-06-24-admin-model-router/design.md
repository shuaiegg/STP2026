## Context

`/api/generate-stream` 是 GEO Writer 内容生成的核心路由（Step 3），目前硬编码调用 `streamWithFallback(MODEL_CHAIN.premium, ...)` — 其中 `MODEL_CHAIN.premium` 为 VPS 代理的自定义模型 ID 列表。当这些 ID 不可用时，三个 fallback 全部失败，`controller.error(e)` 被触发，但 UI 层的条件渲染 `step === 3 && (finalResult || streamResult.isLoading)` 导致整个右侧内容区消失——用户只看到空白。

现有系统已有完整的 `ModelConfig` 基础设施（DB 表、`resolveModelForContext()`、Admin UI），但 `generate-stream` 路由完全绕过了它。四个现有 Provider（VPS / Claude / Gemini / DeepSeek）的流式调用路径仅 VPS 一条可用（其余缺乏 streaming client 封装）。

## Goals / Non-Goals

**Goals:**
- 修复 GEO Writer 空白 Bug，使流式失败时 UI 正常显示错误
- 将 `generate-stream` 接入 `ModelConfig` 体系，Admin 可通过 `/admin/models` 切换模型
- 新增 OpenAI 为第五个 Provider（类型、API Key 管理、Admin 卡片、streaming 支持）
- 补齐 Claude 和 Gemini 的 streaming client（安装 `@ai-sdk/anthropic`、`@ai-sdk/google`）

**Non-Goals:**
- 不修改 DB schema（`ModelConfig` 已有 context/provider/modelId 足够）
- 不改变 `/api/generate-stream` 的对外接口（入参/出参/streaming 协议不变）
- 不重构现有 `stellar-writer` skill 的非流式调用路径
- 不为 OpenAI Provider 添加 `generateContent` 以外的功能（暂不集成到 skill 系统 AI 能力层）

## Decisions

### D1：`getStreamingClient()` 放在 `src/lib/vps-proxy.ts`，而非新文件

**选择**：在 `vps-proxy.ts` 中导出新函数 `getStreamingClient(provider, modelId)`。

**理由**：`vps-proxy.ts` 已是 streaming 能力的唯一入口（`streamWithFallback`、`vpsClient` 都在这里），且 `generate-stream/route.ts` 已经 import 它。新增一个导出比新建文件依赖关系更简洁。将来如果 streaming 逻辑复杂化，可再独立为 `streaming-clients.ts`。

**备选**：新建 `src/lib/streaming-clients.ts` — 过早抽象，当前无需要。

---

### D2：`generate-stream` 默认 fallback 为 `deepseek/deepseek-chat`

**选择**：`resolveModelForContext('content_generation')` 无 DB 配置时，硬编码 fallback 为 `{ provider: 'deepseek', modelId: 'deepseek-chat' }`。

**理由**：Steps 1 & 2（大纲生成）已经用 `deepseek-chat` 且工作正常，保持一致性，立即解决空白 Bug，无需管理员预配置。

**备选**：fallback 到 VPS — 但 VPS 模型 ID 不稳定是导致当前 Bug 的根因，不应作为 fallback。

---

### D3：OpenAIProvider 复用 `@ai-sdk/openai`，不新增 npm 包

**选择**：`OpenAIProvider`（用于技能系统 `generateContent`）和 `getStreamingClient('openai', ...)` 均使用 `@ai-sdk/openai`（已安装），以不同 baseURL 区分 VPS vs OpenAI。VPS 用 `VPS_GATEWAY_URL`；OpenAI 用默认 `https://api.openai.com/v1`。

**实现**：
```ts
// VPS（已有）
const vpsClient = createOpenAI({ baseURL: VPS_BASE_URL, apiKey: VPS_API_KEY });

// OpenAI proper（新增）
const openaiClient = (apiKey: string) =>
  createOpenAI({ apiKey }); // 默认 baseURL = api.openai.com
```

**理由**：不新增包，逻辑清晰，`@ai-sdk/openai` 原生支持 OpenAI API。

---

### D4：安装 `@ai-sdk/anthropic` 和 `@ai-sdk/google` 支持 Claude / Gemini 流式

**选择**：安装这两个包，在 `getStreamingClient()` 中实现对应 case，但暂不将 Claude/Gemini 接入技能系统的 `IAIProvider` 层（那是 `generateContent`，非流式，已有各自 Provider 类）。

**理由**：流式生成（GEO Writer）和技能系统（site intelligence）是分开的调用路径。流式层加 Claude/Gemini 支持对用户价值最高（可以测试高质量模型出文），对技能系统无影响。

---

### D5：GEO Writer UI — 用 `streamError` 状态独立控制错误显示

**选择**：在 `GEOWriterPage` 中新增 `streamError` state。`onError` 时设置 `streamError` 并保持 `step = 3`。渲染条件改为：

```tsx
// 旧：错误时整块消失
{step === 3 && (finalResult || streamResult.isLoading) && ( ... )}

// 新：step=3 始终显示区域，内部分支处理三种状态
{step === 3 && (
  streamError ? <ErrorPanel error={streamError} onRetry={handleRewrite} />
  : finalResult ? <ResultPanel ... />
  : streamResult.isLoading ? <StreamingPanel ... />
  : null
)}
```

**理由**：错误信息目前只在左侧边栏显示（`{error && ...}`），用户视线在右侧内容区，感知不到错误。新方案将错误直接呈现在用户预期看到内容的位置。

## Risks / Trade-offs

**[R1] 流式 client 创建是同步的，但 API Key 获取是异步的**
→ `getStreamingClient()` 需要 `await getProviderApiKey(provider)`，函数需为 `async`。`generate-stream/route.ts` 在 `customStream.start()` 内调用，本身已是 async context，无阻塞风险。

**[R2] 首次部署时 `ModelConfig['content_generation']` 不存在**
→ `resolveModelForContext` fallback 到 `skill_default`，若也无配置则 fallback 到 `deepseek/deepseek-chat`。实测 deepseek 在 Steps 1 & 2 正常，故风险极低。部署后 Admin 配置一次即可。

**[R3] `@ai-sdk/anthropic` / `@ai-sdk/google` 引入新包**
→ 包体积增量小（纯 API client），无 native bindings，Vercel 部署无影响。

**[R4] OpenAI streaming 没有 VPS fallback**
→ 如果 OpenAI API 故障，`getStreamingClient('openai', ...)` 直接失败，不会自动降级到 DeepSeek。
→ 缓解：Admin 可随时在 `/admin/models` 切换回 DeepSeek；中期可在 `generate-stream` 加 provider-level catch + retry。

## Migration Plan

1. 安装包：`npm install @ai-sdk/anthropic @ai-sdk/google`
2. 扩展类型 + Provider 层（`types.ts`、`providers/`、`integrations/config.ts`）
3. 实现 `getStreamingClient()` 并更新 `generate-stream/route.ts`
4. 更新 Admin UI（`ContextModelAssignment.tsx`、`actions.ts`）
5. 修复 GEO Writer UI 错误显示
6. Admin 在 `/admin/models` 将 `content_generation` 设为 `deepseek/deepseek-chat` 并验证
7. 端对端测试：GEO Writer 完整三步流程

**回滚**：若出现问题，在 `generate-stream/route.ts` 恢复 `streamWithFallback(MODEL_CHAIN.premium, ...)` 一行即可，DB 配置不影响回滚。

## Open Questions

- OpenAI 账号下的 `gpt-4o` 是否有足够的 rate limit 用于生产？（需生产验证）
- 中期是否要为 `generate-stream` 加多 Provider fallback 链（如 openai → deepseek）？当前单 Provider，Admin 手动切换。

---

## Implementation Notes (for Gemini / Antigravity)

**已知遗留冲突：**
- `src/lib/vps-proxy.ts` 中 `VPS_BASE_URL` / `VPS_API_KEY` 有硬编码 fallback 值（`'http://154.12.243.94:8317/v1'` 和 `'sk-5DLE3ByOrXqKOkE5i'`）。新增 `getStreamingClient()` 时不要删除这些 fallback，它们是 VPS case 的保障。
- `generate-stream/route.ts` 的 `finally` 块记录 `modelUsed: MODEL_CHAIN.premium[0]` — 改为记录 `resolveModelForContext` 返回的实际 modelId。

**禁止触碰范围：**
- `src/lib/skills/skills/stellar-writer.ts` — 不修改，Steps 1 & 2 用此 skill，工作正常
- `src/lib/skills/providers/` 下已有的 claude/gemini/deepseek/vps provider 类 — 不修改现有文件，只新增 `openai-provider.ts`
- `prisma/schema.prisma` — 不修改，无 schema 变更

**本 change 边界：**
```
src/lib/skills/types.ts                                     ← 加 'openai'
src/lib/integrations/config.ts                              ← 加 openai env key
src/lib/skills/providers/index.ts                           ← 加 openai case
src/lib/skills/providers/openai-provider.ts                 ← 新文件
src/lib/vps-proxy.ts                                        ← 加 getStreamingClient()
src/app/api/generate-stream/route.ts                        ← 核心重写
src/app/(protected)/dashboard/admin/(admin-only)/models/
  ContextModelAssignment.tsx                                 ← 加 content_generation + openai
  actions.ts                                                 ← 加 openai provider card
src/app/[locale]/(public)/tools/geo-writer/page.tsx         ← UI bug 修复
```

**其他注意事项：**
- `getStreamingClient()` 必须是 `async` 函数，因为 `getProviderApiKey()` 是异步的
- `ContextModelAssignment.tsx` 的 `CONTEXTS` 常量扩展时，`content_generation` 的 key 字符串必须与 `resolveModelForContext('content_generation')` 的入参完全一致
- `verifyModelAccess('openai', modelId)` 使用 `POST https://api.openai.com/v1/chat/completions` + `max_tokens: 1`，与 DeepSeek 的验证模式相同
- UI 修复时新增的 `streamError` state 类型为 `string | null`，不要与已有的 `error` state（用于 steps 1 & 2）混淆
