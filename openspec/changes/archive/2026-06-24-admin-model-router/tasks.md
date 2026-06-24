# admin-model-router — 实现任务清单

> GEO Writer 流式生成修复 + Admin 模型路由 + OpenAI Provider

## 1. 依赖安装

- [x] 1.1 安装 `@ai-sdk/anthropic` 和 `@ai-sdk/google`：`npm install @ai-sdk/anthropic @ai-sdk/google`
- [x] 1.2 确认 `package.json` 中已有 `@ai-sdk/openai`、`@ai-sdk/deepseek`（不需安装，仅确认）

## 2. 类型与 Provider 层扩展

- [x] 2.1 `src/lib/skills/types.ts`：将 `AIProviderName` 改为 `'gemini' | 'claude' | 'deepseek' | 'vps' | 'openai'`
- [x] 2.2 `src/lib/integrations/config.ts`：在 `PROVIDER_ENV_KEYS` 增加 `openai: ['OPENAI_API_KEY']`
- [x] 2.3 新建 `src/lib/skills/providers/openai-provider.ts`：实现 `OpenAIProvider` 类（参照 `deepseek-provider.ts` 结构，使用 `@ai-sdk/openai` + `getProviderApiKey('openai')`）
- [x] 2.4 `src/lib/skills/providers/index.ts`：在 `getProvider()` switch 中增加 `case 'openai': provider = new OpenAIProvider(); break`
- [x] 2.5 `src/lib/skills/model-resolver.ts`：在 `VALID_PROVIDERS` 数组中增加 `'openai'`

## 3. 流式客户端工厂

- [x] 3.1 `src/lib/vps-proxy.ts`：新增导出 `async function getStreamingClient(provider: AIProviderName, modelId: string): Promise<LanguageModel>`，按 provider 返回对应 Vercel AI SDK model：
  - `'vps'` → 现有 `vpsClient(modelId)`
  - `'openai'` → `createOpenAI({ apiKey: await getProviderApiKey('openai') })(modelId)`
  - `'deepseek'` → `createDeepSeek({ apiKey: await getProviderApiKey('deepseek') })(modelId)` from `@ai-sdk/deepseek`
  - `'claude'` → `createAnthropic({ apiKey: await getProviderApiKey('claude') })(modelId)` from `@ai-sdk/anthropic`
  - `'gemini'` → `createGoogleGenerativeAI({ apiKey: await getProviderApiKey('gemini') })(modelId)` from `@ai-sdk/google`
  - default → `throw new Error('Unsupported streaming provider: ' + provider)`

## 4. generate-stream 路由重写

- [x] 4.1 `src/app/api/generate-stream/route.ts`：在 `POST` handler 中，billing check 之后，调用 `const { provider, modelId } = await resolveModelForContext('content_generation')`，fallback 为 `{ provider: 'deepseek', modelId: 'deepseek-chat' }`
- [x] 4.2 同文件：将两处 `await streamWithFallback(MODEL_CHAIN.premium, { ... })` 替换为 `const model = await getStreamingClient(provider, modelId ?? 'deepseek-chat')` 后调用 `await streamText({ model, ... })`
- [x] 4.3 同文件：`finally` 块中将 `modelUsed: MODEL_CHAIN.premium[0]` 改为 `modelUsed: resolvedModelId`（使用实际调用的 modelId），`provider` 字段记录实际 provider

## 5. Admin 模型管理 UI 更新

- [x] 5.1 `src/app/(protected)/dashboard/admin/(admin-only)/models/ContextModelAssignment.tsx`：在 `CONTEXTS` 数组末尾增加 `{ key: 'content_generation', label: 'GEO 文章生成', description: 'GEO Writer 流式内容生成（/api/generate-stream）' }`
- [x] 5.2 同文件：在 `PROVIDERS` 数组末尾增加 `{ id: 'openai', label: 'OpenAI' }`
- [x] 5.3 同文件：在 `KNOWN_MODELS` 对象增加 `openai: [{ id: 'gpt-4o', label: 'GPT-4o' }, { id: 'gpt-4o-mini', label: 'GPT-4o Mini' }, { id: 'o3-mini', label: 'o3-mini (reasoning)' }]`
- [x] 5.4 `src/app/(protected)/dashboard/admin/(admin-only)/models/actions.ts`：在 `getProviderStatuses()` 返回数组中增加 OpenAI provider card（与 claude/gemini/deepseek 同结构，key = `'openai'`，label = `'OpenAI'`，env key = `OPENAI_API_KEY`）
- [x] 5.5 同文件 `testProviderConnection()`：增加 `provider === 'openai'` 分支，调用 `GET https://api.openai.com/v1/models` 验证连接
- [x] 5.6 同文件 `verifyModelAccess()`：增加 `provider === 'openai'` 分支，用 `POST https://api.openai.com/v1/chat/completions` + `max_tokens: 1` 验证模型可访问性

## 6. GEO Writer UI Bug 修复

- [x] 6.1 `src/app/[locale]/(public)/tools/geo-writer/page.tsx`：新增 `streamError` state（`string | null`，初始 `null`）
- [x] 6.2 同文件 `onError` callback：将 `setError(msg)` 改为同时调用 `setStreamError(msg)` 并**保持** `step = 3`（不降回 step 2）
- [x] 6.3 同文件：在 `handleRewrite` 调用时清空 `streamError`（`setStreamError(null)`）
- [x] 6.4 同文件：将 step-3 右侧内容区渲染条件从 `step === 3 && (finalResult || streamResult.isLoading)` 改为 `step === 3 && (finalResult || streamResult.isLoading || streamError)`
- [x] 6.5 同文件：在 step-3 内容区内增加 `streamError` 错误面板（显示错误信息 + "重新生成" 重试按钮，调用 `handleRewrite`）

## 7. 端对端验证

- [x] 7.1 确认 TypeScript 无编译报错：`npx tsc --noEmit`
- [ ] 7.2 Admin `/admin/models`：确认出现第五个 Provider 卡片（OpenAI）和新的 `content_generation` 上下文行
- [ ] 7.3 将 `content_generation` 配置为 `deepseek / deepseek-chat`，验证 GEO Writer Step 3 能正常生成内容（不再空白）
- [ ] 7.4 将 `content_generation` 切换为 `openai / gpt-4o`（需配置 `OPENAI_API_KEY`），验证 GEO Writer 正常调用 OpenAI 生成内容
- [ ] 7.5 断开模型（配置一个不存在的 modelId），验证 GEO Writer Step 3 显示错误信息而非空白，且"重新生成"按钮可用
