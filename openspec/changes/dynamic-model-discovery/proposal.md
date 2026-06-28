## Why

Admin 模型管理(`/admin/models`)里,非 VPS provider 的可选模型来自硬编码的 `KNOWN_MODELS`(`ContextModelAssignment.tsx`):claude 3 个、gemini 3 个、deepseek 2 个、openai 仅 3 个。这份清单**手动维护、必然过时且不全**——OpenAI 实际有几十个模型,管理员选不到新模型(如新一代 gpt / o 系列),也看不到自己账号实际可用的模型。

而 VPS provider 早已支持**动态拉取**(`fetchVpsModels` → combobox)。各家的"列模型"端点其实**已经在代码里被调用**(`testProviderConnection` 用它们做连通性测试),只是没用于填充下拉。差的只是把"列模型"接出来 + UI 推广。

## What Changes

- 新增 server action `fetchProviderModels(provider)`:对 openai / deepseek / claude / gemini 调用各自的 list-models 端点(用 `getProviderApiKey(provider)` 鉴权),解析为统一 `{ id, label }[]`;vps 复用 `fetchVpsModels`。
- UI 把现有的 VPS 动态下拉(`VpsModelInput` combobox)**推广到所有 provider**:选定 provider 后按需拉取其真实模型列表,可搜索、可刷新。
- **离线/失败兜底**:无 API key、网络失败或端点报错时,回退到现有 `KNOWN_MODELS` 静态列表(保证始终可选),并提示"显示的是内置清单"。
- `KNOWN_MODELS` 从"唯一来源"降级为"兜底来源"。

## Capabilities

### New Capabilities
- `dynamic-model-discovery`: 按 provider 实时拉取可选模型填充 admin 下拉,失败回退内置清单。

### Modified Capabilities
<!-- 不改 unified-llm-model-routing 的解析/兜底行为;仅改"可选模型从哪来" -->

## Impact

- **新增**:`fetchProviderModels(provider)` in `models/actions.ts`(复用 `testProviderConnection` 已验证的端点与鉴权)。
- **修改**:`ContextModelAssignment.tsx` —— 将 `VpsModelInput` 泛化为 `ProviderModelInput`(或对所有 provider 启用同款 combobox),`KNOWN_MODELS` 改作兜底。
- **不影响**:模型解析/兜底链(`resolveModelForContext` / `generateWithFallback`)、context 列表、运行时行为。这纯粹是 admin "选模型" 的来源升级。
- **风险**:低。外部端点已在 `testProviderConnection` 验证可达;失败有静态兜底,不会让下拉变空。
- **依赖**:`unified-llm-model-routing`(context 化的 admin 模型管理)已落地。
- **关联**:解决 L-3 验证发现的"OpenAI 只有 3 个模型"问题。
