## Why

GEO Writer 内容生成（Step 3）因 `/api/generate-stream` 硬编码 VPS 自定义模型 ID 而出现空白 Bug：模型调用失败时 UI 静默消失，用户只看到空白面板。同时，管理员无法通过 Admin 界面切换流式生成所用的模型，与现有 ModelConfig 体系完全脱节。此为 MVP 核心闭环的主要阻塞点，需优先修复。

## What Changes

- **修复 GEO Writer 空白 Bug**：`/api/generate-stream` 不再硬编码 VPS 模型链，改为读取 `ModelConfig['content_generation']`，失败时有正确的错误显示而非静默消失
- **新增流式模型路由层**：新增 `getStreamingClient(provider, modelId)` 工厂函数，支持所有已配置 Provider 的 `streamText` 调用
- **新增 OpenAI 为第五个 Provider**：扩展 `AIProviderName` 类型、`getProvider()` 工厂、`PROVIDER_ENV_KEYS`、Admin UI，完整支持 GPT-4o 等模型
- **Admin 模型管理接入流式生成**：`ContextModelAssignment` 增加 `content_generation` 上下文配置行，Admin 可在 VPS / DeepSeek / OpenAI / Claude / Gemini 间自由切换 GEO Writer 所用模型
- **安装缺失的 AI SDK 包**：`@ai-sdk/anthropic`、`@ai-sdk/google`，补全 Claude 和 Gemini 的流式支持

## Capabilities

### New Capabilities

- `streaming-model-router`：流式生成模型路由层——`getStreamingClient(provider, modelId)` 工厂，支持 vps / openai / deepseek / claude / gemini 五个 Provider，供 `/api/generate-stream` 调用
- `openai-provider`：OpenAI 作为第五个 Provider 完整接入——类型定义、API Key 管理（DB 加密 + env fallback）、`generateContent` 实现、Admin 状态卡片及模型选择

### Modified Capabilities

- `skills-system`：`AIProviderName` 扩展加入 `'openai'`；`getProvider()` 增加 OpenAI case；`PROVIDER_ENV_KEYS` 增加 `openai: ['OPENAI_API_KEY']`

## Impact

**代码**
- `src/lib/skills/types.ts` — `AIProviderName` 类型变更（加 `'openai'`）
- `src/lib/skills/providers/index.ts` — `getProvider()` 增加 openai case
- `src/lib/skills/providers/openai-provider.ts` — 新文件
- `src/lib/integrations/config.ts` — `PROVIDER_ENV_KEYS` 增加 openai
- `src/lib/vps-proxy.ts` — 新增 `getStreamingClient()` 导出
- `src/app/api/generate-stream/route.ts` — 核心路由重写
- `src/app/(protected)/dashboard/admin/(admin-only)/models/ContextModelAssignment.tsx` — 新增 content_generation 上下文 + openai provider/models
- `src/app/(protected)/dashboard/admin/(admin-only)/models/actions.ts` — openai Provider 状态卡 + verifyModelAccess
- `src/app/[locale]/(public)/tools/geo-writer/page.tsx` — UI Bug 修复（step 3 错误显示）

**依赖**
- 新增：`@ai-sdk/anthropic`、`@ai-sdk/google`
- 已有可复用：`@ai-sdk/openai`（VPS 已用）、`@ai-sdk/deepseek`

**API**
- `/api/generate-stream` 行为不变，内部模型来源从硬编码改为 DB 配置驱动

**破坏性变更**：无（对外 API 和 DB schema 不变）
