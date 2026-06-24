# OpenAI Provider

## 概述

将 OpenAI 作为第一类 AI Provider 接入 Skills System，与现有的 `vps`、`claude`、`gemini`、`deepseek` provider 对等。支持 GPT-4o 等模型，API 密钥可通过环境变量或加密数据库配置管理。

---

## Requirements

### Requirement: OpenAI is a first-class provider in the skills system
The system SHALL support `'openai'` as a valid `AIProviderName` alongside `'vps'`, `'claude'`, `'gemini'`, and `'deepseek'`. This includes:
- Type definition in `src/lib/skills/types.ts`
- `OpenAIProvider` class in `src/lib/skills/providers/openai-provider.ts` implementing `IAIProvider`
- `getProvider('openai')` case in `src/lib/skills/providers/index.ts`
- `PROVIDER_ENV_KEYS['openai'] = ['OPENAI_API_KEY']` in `src/lib/integrations/config.ts`

#### Scenario: getProvider returns OpenAIProvider
- **WHEN** `getProvider('openai')` is called
- **THEN** it returns a cached `OpenAIProvider` instance

#### Scenario: OpenAIProvider.generateContent calls OpenAI API
- **WHEN** `OpenAIProvider.generateContent(prompt, options)` is called with `OPENAI_API_KEY` configured
- **THEN** it calls `api.openai.com` and returns an `AIResponse` with content, token counts, and model used

#### Scenario: OpenAI API key resolved from DB then env
- **WHEN** `getProviderApiKey('openai')` is called
- **THEN** it first checks `IntegrationConfig['PROVIDER_KEY_openai']` in DB
- **AND** falls back to `process.env.OPENAI_API_KEY` if DB value is absent

---

### Requirement: Admin can manage OpenAI provider via /admin/models
The `/admin/models` page SHALL display an OpenAI provider status card with the same capabilities as the other providers:
- Configured / not-configured status
- API key input (encrypted, stored in `IntegrationConfig`)
- "测试连接" button that calls `GET https://api.openai.com/v1/models` with the configured key
- "验证" (model access) test via a minimal `chat/completions` call

#### Scenario: OpenAI card shows configured when key is set
- **WHEN** `OPENAI_API_KEY` env var is set OR `PROVIDER_KEY_openai` is in `IntegrationConfig`
- **THEN** the OpenAI provider card shows green configured status

#### Scenario: Connection test passes with valid key
- **WHEN** admin clicks "测试连接" on the OpenAI card
- **THEN** the system calls `GET https://api.openai.com/v1/models` with Bearer auth
- **AND** on success displays latency in milliseconds

#### Scenario: Admin can enter and save OpenAI API key
- **WHEN** admin enters an API key in the key input field and clicks save
- **THEN** the key is AES-256-GCM encrypted and stored as `PROVIDER_KEY_openai` in `IntegrationConfig`

---

### Requirement: OpenAI models appear in ContextModelAssignment dropdown
The `ContextModelAssignment` component SHALL include `'openai'` in its provider list and a curated `KNOWN_MODELS['openai']` list covering common GPT models.

Suggested known models:
- `gpt-4o` — GPT-4o
- `gpt-4o-mini` — GPT-4o Mini
- `o3-mini` — o3-mini (reasoning)

#### Scenario: Admin selects OpenAI provider for content_generation
- **WHEN** admin selects provider = "OpenAI" in the content_generation row
- **THEN** the model dropdown shows the known OpenAI models
- **AND** admin can also type a custom model ID

#### Scenario: Saving openai/gpt-4o routes GEO Writer through OpenAI
- **WHEN** admin saves `content_generation = { provider: 'openai', modelId: 'gpt-4o' }`
- **THEN** the next GEO Writer generation call uses OpenAI GPT-4o for streaming
