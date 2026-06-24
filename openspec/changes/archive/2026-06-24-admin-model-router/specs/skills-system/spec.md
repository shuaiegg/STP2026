## MODIFIED Requirements

### Requirement: AIProviderName includes openai
`AIProviderName` in `src/lib/skills/types.ts` SHALL be `'gemini' | 'claude' | 'deepseek' | 'vps' | 'openai'`.

Previously: `'gemini' | 'claude' | 'deepseek' | 'vps'`

All existing consumers of `AIProviderName` (model-resolver, providers/index, admin actions) SHALL continue to compile without error after this change.

#### Scenario: TypeScript accepts openai as a valid provider name
- **WHEN** code assigns `const p: AIProviderName = 'openai'`
- **THEN** TypeScript compiler accepts it without type error

#### Scenario: VALID_PROVIDERS in model-resolver includes openai
- **WHEN** `isValidProvider('openai')` is called in `model-resolver.ts`
- **THEN** it returns `true`

---

## ADDED Requirements

### Requirement: content_generation context is available in ContextModelAssignment UI
The `CONTEXTS` constant in `ContextModelAssignment.tsx` SHALL include a `content_generation` entry displayed as "GEO 文章生成" with description "GEO Writer 流式内容生成（/api/generate-stream）".

#### Scenario: content_generation row appears in Admin models page
- **WHEN** admin navigates to `/admin/models`
- **THEN** the 业务上下文分配 section shows a "GEO 文章生成" row
- **AND** the row supports saving provider + modelId combinations for all five providers

#### Scenario: Saved content_generation config displays as badge
- **WHEN** `ModelConfig['content_generation']` has been saved with a provider and modelId
- **THEN** the row shows a `provider/modelId` badge reflecting the current active configuration
