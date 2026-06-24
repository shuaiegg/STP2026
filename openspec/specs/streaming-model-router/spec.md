# Streaming Model Router

## 概述

将 `/api/generate-stream`（GEO Writer 流式生成路由）从硬编码的 `streamWithFallback(MODEL_CHAIN.premium, ...)` 改为通过 `ModelConfig` 动态路由。Admin 可在 `/admin/models` 的 `content_generation` 上下文中为 GEO Writer 指定任意 provider 和 model，无需改代码。

---

## Requirements

### Requirement: Streaming client factory resolves provider from ModelConfig
The system SHALL provide a `getStreamingClient(provider, modelId)` factory function in `src/lib/vps-proxy.ts` that returns a Vercel AI SDK `LanguageModel` compatible with `streamText`, based on the given provider name.

Supported providers and their backing SDK client:
- `'vps'` → `vpsClient(modelId)` — existing `createOpenAI` with VPS base URL
- `'openai'` → `createOpenAI()` with default `api.openai.com` base URL, key from `getProviderApiKey('openai')`
- `'deepseek'` → `createDeepSeek()` from `@ai-sdk/deepseek`, key from `getProviderApiKey('deepseek')`
- `'claude'` → `createAnthropic()` from `@ai-sdk/anthropic`, key from `getProviderApiKey('claude')`
- `'gemini'` → `createGoogleGenerativeAI()` from `@ai-sdk/google`, key from `getProviderApiKey('gemini')`

If the provider is unknown, the function SHALL throw a descriptive error.

#### Scenario: Factory returns VPS client
- **WHEN** `getStreamingClient('vps', 'some-model')` is called
- **THEN** it returns the existing `vpsClient('some-model')` without making any API key lookup

#### Scenario: Factory returns DeepSeek client with key
- **WHEN** `getStreamingClient('deepseek', 'deepseek-chat')` is called
- **THEN** it calls `getProviderApiKey('deepseek')` and returns a `createDeepSeek({ apiKey })('deepseek-chat')` instance

#### Scenario: Factory returns OpenAI client with key
- **WHEN** `getStreamingClient('openai', 'gpt-4o')` is called
- **THEN** it calls `getProviderApiKey('openai')` and returns a `createOpenAI({ apiKey })('gpt-4o')` instance pointing to `api.openai.com`

#### Scenario: Unknown provider throws
- **WHEN** `getStreamingClient('unknown-provider', 'model')` is called
- **THEN** it throws `Error('Unsupported streaming provider: unknown-provider')`

---

### Requirement: generate-stream route uses ModelConfig for model selection
The `/api/generate-stream` POST handler SHALL call `resolveModelForContext('content_generation')` to determine the active provider and modelId, then use `getStreamingClient()` to obtain the streaming model, instead of the hardcoded `streamWithFallback(MODEL_CHAIN.premium, ...)` call.

Fallback chain (via `resolveModelForContext`):
1. `ModelConfig['content_generation']` DB row
2. `ModelConfig['skill_default']` DB row
3. `DEFAULT_AI_PROVIDER` env var
4. Hardcoded: `{ provider: 'deepseek', modelId: 'deepseek-chat' }`

The execution log (`SkillExecution`) SHALL record the actual `provider` and `modelId` used.

#### Scenario: Admin has configured content_generation in DB
- **WHEN** `ModelConfig['content_generation']` = `{ provider: 'openai', modelId: 'gpt-4o' }` exists
- **THEN** the route streams using `getStreamingClient('openai', 'gpt-4o')`
- **AND** `SkillExecution.provider = 'openai'` and `SkillExecution.modelUsed = 'gpt-4o'` are recorded

#### Scenario: No DB config — falls back to deepseek
- **WHEN** no `ModelConfig['content_generation']` or `ModelConfig['skill_default']` exists
- **THEN** the route streams using `getStreamingClient('deepseek', 'deepseek-chat')`

#### Scenario: Stream model fails — error is surfaced, not silent
- **WHEN** the selected model throws during streaming
- **THEN** `controller.error(e)` propagates to the client
- **AND** the GEO Writer UI SHALL display the error message in the right content panel (not silently disappear)

---

### Requirement: GEO Writer step-3 UI shows errors instead of going blank
The step-3 content area in `GEOWriterPage` SHALL remain visible and show an error state when streaming fails. The render condition SHALL NOT gate on `streamResult.isLoading` alone — it MUST also handle the error case.

#### Scenario: Stream succeeds — content renders normally
- **WHEN** `streamResult.completion` accumulates content
- **THEN** the right panel renders the content as it streams in

#### Scenario: Stream fails — error shown in right panel
- **WHEN** `streamResult` triggers `onError`
- **THEN** step is set (or stays) at 3
- **AND** the right content panel displays the error message (not blank)
- **AND** a "重试" button is available

#### Scenario: Admin-configured model card shows active model
- **WHEN** the `content_generation` ModelConfig is set
- **THEN** `/admin/models` shows the active model in the `content_generation` row badge
