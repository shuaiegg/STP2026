# AI Skills & Model Layer — 局部约定

> 本目录补充根 CLAUDE.md 的「AI Skills System / AI Model Management」。在此目录工作时优先遵守以下局部规则。

## 改动前先用 codebase-memory-mcp

`search_graph` 找 provider/skill，`trace_path(resolveModelForContext, mode=calls)` 看解析链，别上来就 grep。

## Provider 兜底是硬要求（抗 429/配额）

调用 LLM 时**不要**只用单一 provider。统一模式：`resolveModelForContext(context)` 拿首选，再按 `['vps','deepseek','claude']` 候选顺序 try/catch 兜底（见 `strategy/generate/route.ts` 的 candidates 循环）。

> ⚠️ 已知欠债：`crawler.service.ts` 的 `extractBusinessDna` 仍用 `getDefaultProvider()`，**没有**兜底，需补共享 helper（见 `openspec/technical-backlog.md`）。

## 密钥读取

`getProviderApiKey(provider)`（DB `IntegrationConfig` 优先 → env 兜底）。**`VPS_PROXY_KEY` 永不入库**，只读 env。

## 新增 provider 的最小步骤

1. `providers/<name>-provider.ts` 实现 `generateContent` / 必要时 `embedText`
2. 注册到 `providers/index.ts` 的 `getProvider`
3. `types.ts` 的 `AIProviderName` 加上联合类型
4. 默认走 model-resolver，不要硬编码 modelId

## 积分

每次技能执行扣 `SkillConfig.cost` 并写 `CreditTransaction`。新技能别绕过计量。

## LLM 输出落库

带数字/统计的 LLM 文本入库前要有确定性兜底（参考 `sanitizeProof`：源文本无对应数字 token → 视为编造，清空）。不要直接信任模型产出的统计数据。
