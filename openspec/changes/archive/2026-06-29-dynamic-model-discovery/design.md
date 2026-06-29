## Context

`testProviderConnection(provider)`(`models/actions.ts`)已证明各家端点可达 + 鉴权方式:

| Provider | List 端点 | 鉴权 | 响应字段 |
|---|---|---|---|
| openai | `GET https://api.openai.com/v1/models` | `Authorization: Bearer <key>` | `data[].id` |
| deepseek | `GET https://api.deepseek.com/models` | `Authorization: Bearer <key>` | `data[].id` |
| claude | `GET https://api.anthropic.com/v1/models` | `x-api-key` + `anthropic-version: 2023-06-01` | `data[].id` |
| gemini | `GET https://generativelanguage.googleapis.com/v1beta/models?key=<key>` | query `key` | `models[].name`(形如 `models/gemini-...`) |
| vps | `fetchVpsModels()`(已实现) | env | `data[].id` |

UI 侧已有 `VpsModelInput` combobox(可搜索 + 刷新 + 受控 value),是泛化模板。`KNOWN_MODELS` 是当前唯一来源,将降级为兜底。

## Goals / Non-Goals

**Goals:**
- 每个 provider 的下拉显示其**真实可用**模型(账号 key 决定),实时拉取。
- 失败/无 key → 回退 `KNOWN_MODELS`,下拉永不为空,并提示来源。
- 复用现有端点与 combobox,最小新增。

**Non-Goals:**
- 不改模型解析/兜底链与运行时行为。
- 不缓存模型列表到 DB(按需拉取即可;可加内存级 TTL 但非必须)。
- 不做模型能力元数据(上下文长度/价格)——只要 id + label。
- embedding(gemini 专用)沿用现状,不强制动态化。

## Decisions

1. **新增 `fetchProviderModels(provider): Promise<{ ok; models?; error? }>`**:
   - `requireAdmin()` 守卫(同现有 actions)。
   - vps → 复用 `fetchVpsModels`。
   - 其余 → `getProviderApiKey(provider)`;无 key 直接 `{ ok:false, error:'API Key 未配置' }`(UI 据此回退)。
   - 调对应 List 端点(上表),`AbortSignal.timeout(10000)`,解析为 `{ id, label }[]`:
     - openai/deepseek/claude:`data.map(m => ({ id: m.id, label: m.id }))`。
     - gemini:`models.map(m => ({ id: m.name.replace(/^models\//,''), label: m.displayName ?? id }))`,可只保留 `generateContent` 支持的(按 `supportedGenerationMethods` 过滤,可选)。
   - 错误返回 `{ ok:false, error }`(截断 body)。

2. **UI 泛化**:把 `VpsModelInput` 改为通用 `ProviderModelInput`(props 加 `provider`),内部按 provider 调 `fetchProviderModels`。选/换 provider 时清空已拉列表、惰性拉取。

3. **兜底与提示**:`fetchProviderModels` 失败或返回空 → 用 `KNOWN_MODELS[provider]` 填充,combobox 顶部标注"内置清单(未拉取到实时列表)";成功则标"实时 · N 个"。

4. **自由输入保留**:combobox 允许手输 modelId(VPS 已是此行为)——即使列表不全也能填任意模型,兜底链照常工作。

## Risks / Trade-offs

- **各家响应字段差异**:gemini 用 `models[].name` 带 `models/` 前缀,需归一;其余 OpenAI 兼容。已在表中列明。
- **claude /v1/models 可用性**:Anthropic 已提供该端点;若个别 key 无权限 → 返回非 200 → 回退静态,不致命。
- **延迟**:每次展开下拉触发一次外部请求(~数百 ms)。可加每会话内存缓存,MVP 可不加。
- **无 key 场景**:回退静态清单 + 明确提示,体验不退化。
- 整体低风险:不触碰运行时路由;仅 admin 选模型来源升级。

## Implementation Notes (for Gemini / Antigravity)

**已知遗留冲突:**
- `testProviderConnection` 已含各家端点与鉴权,**复用其端点/header 写法**,勿重复造轮子或改其行为。
- `KNOWN_MODELS` 保留,语义从"唯一来源"变"兜底来源"——不要删除。

**禁止触碰范围:**
- 不改 `resolveModelForContext` / `generateWithFallback` / `verifyModelAccess` 的行为。
- 不改 CONTEXTS 列表、不改运行时模型解析。
- 不引入 DB 缓存表(本期按需拉取)。

**本 change 边界(只允许改动):**
- `src/app/(protected)/dashboard/admin/(admin-only)/models/actions.ts`(加 `fetchProviderModels`)。
- `src/app/(protected)/dashboard/admin/(admin-only)/models/ContextModelAssignment.tsx`(combobox 泛化 + 兜底提示)。

**其他注意事项:**
- 自由手输 modelId 必须保留。
- 失败务必回退 `KNOWN_MODELS`,下拉永不为空。
- 改完 `npx tsc --noEmit` 保持仅 1 个预存 auth.ts 错误。
- 真机验证:每个 provider(有 key 的)能拉到真实列表;无 key 的回退静态并提示。
