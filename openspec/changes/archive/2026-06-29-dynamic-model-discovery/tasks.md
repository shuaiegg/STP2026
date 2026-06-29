## 1. server action

- [x] 1.1 在 `models/actions.ts` 加 `fetchProviderModels(provider): Promise<{ ok; models?: {id;label}[]; error? }>`,`requireAdmin()` 守卫
- [x] 1.2 vps → 复用 `fetchVpsModels`;其余 → `getProviderApiKey(provider)`,无 key 返回 `{ok:false,error:'API Key 未配置'}`
- [x] 1.3 各端点(复用 testProviderConnection 的 URL/header):openai `/v1/models`、deepseek `/models`、claude `/v1/models`、gemini `v1beta/models?key=`;`AbortSignal.timeout(10000)`
- [x] 1.4 解析归一:openai/deepseek/claude `data[].id`;gemini `models[].name` 去 `models/` 前缀(可按 supportedGenerationMethods 过滤 generateContent)

## 2. UI 泛化

- [x] 2.1 将 `VpsModelInput` 泛化为 `ProviderModelInput`(props 加 `provider`),所有 provider 启用同款可搜索 combobox
- [x] 2.2 选/换 provider 时惰性拉取 `fetchProviderModels`;展示"实时 · N 个"或"内置清单"来源标注
- [x] 2.3 失败/空/无 key → 回退 `KNOWN_MODELS[provider]`,下拉永不为空
- [x] 2.4 保留手动输入任意 modelId 的能力

## 3. 收尾

- [x] 3.1 `KNOWN_MODELS` 保留为兜底来源(不删除),注释说明语义变化
- [x] 3.2 移除 L-3 发现的"OpenAI 只有 3 个"硬限制(由实时列表取代)

## 4. 验证

- [x] 4.1 `npx tsc --noEmit` 仅剩 1 个预存 auth.ts 错误,零新增
- [ ] 4.2 有 key 的 provider:展开下拉拉到真实完整列表(OpenAI 不再只有 3 个)
- [ ] 4.3 无 key / 断网:回退内置清单 + 来源提示,下拉不为空、不报错
- [ ] 4.4 gemini:下拉 id 无 `models/` 前缀,选中保存后运行时可用
- [ ] 4.5 手输未列出 modelId → 保存生效
- [ ] 4.6 design-checker 扫 ContextModelAssignment(token/combobox 可达性)
