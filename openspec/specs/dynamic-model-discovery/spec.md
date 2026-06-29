# dynamic-model-discovery Specification

## Purpose
TBD - created by archiving change dynamic-model-discovery. Update Purpose after archive.
## Requirements
### Requirement: 按 Provider 实时拉取可选模型

Admin 模型管理 SHALL 为每个 provider(openai / deepseek / claude / gemini / vps)提供实时拉取其可用模型列表的能力,通过 server action `fetchProviderModels(provider)` 使用该 provider 已配置的 API key 调用其 list-models 端点,返回统一的 `{ id, label }[]`。下拉选项 SHALL 优先来自实时列表而非硬编码清单。

#### Scenario: 拉取 OpenAI 真实模型

- **WHEN** 管理员在某 context 选择 openai 并展开模型下拉
- **THEN** 系统调用 OpenAI list-models 端点,下拉显示账号实际可用的全部模型(不再是固定 3 个)

#### Scenario: gemini 模型名归一

- **WHEN** 拉取 gemini 模型列表(返回 `models/gemini-...` 形式)
- **THEN** 下拉项的 id 去除 `models/` 前缀,与运行时使用的 modelId 一致

### Requirement: 拉取失败回退内置清单

当 `fetchProviderModels` 因无 API key、网络失败或端点报错而无法返回模型时,系统 SHALL 回退到内置 `KNOWN_MODELS[provider]` 静态清单,使下拉**永不为空**,并向管理员标注当前为内置清单而非实时列表。

#### Scenario: 无 API key 回退

- **WHEN** 某 provider 未配置 API key,管理员展开其模型下拉
- **THEN** 下拉显示内置 `KNOWN_MODELS` 清单,并提示"显示内置清单(未拉取到实时列表)"

#### Scenario: 端点失败回退

- **WHEN** list-models 请求超时或返回非 2xx
- **THEN** 下拉回退内置清单且不报错阻断,管理员仍可选择或手输模型

### Requirement: 保留手动输入模型 ID

无论下拉来源是实时还是内置,管理员 SHALL 仍可手动输入任意 modelId 并保存,以支持列表未覆盖的新模型。

#### Scenario: 手输未列出的模型

- **WHEN** 管理员在模型 combobox 输入一个不在列表中的 modelId 并保存
- **THEN** 该 modelId 被正常保存到 ModelConfig,运行时解析与兜底链按其生效

