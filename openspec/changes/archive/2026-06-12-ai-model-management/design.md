# AI 模型管理中心 — 设计决策

## 数据模型

### ModelConfig 表（新建）

```prisma
model ModelConfig {
  id        String   @id @default(uuid())
  context   String   @unique  // 'skill_default' | 'consultation' | 'embedding' | 'skill:{skillId}'
  provider  String            // 'vps_proxy' | 'anthropic' | 'gemini' | 'deepseek'
  modelId   String            // 'claude-3-5-sonnet-20241022' | 'gemini-pro' 等
  label     String?           // 管理员备注，如 "最强推理" / "低成本快速"
  updatedAt DateTime @updatedAt
  updatedBy String?
}
```

**为什么不复用 `IntegrationConfig`？**
- `IntegrationConfig` 设计为 KV 存储加密 API Key，值是任意字符串
- `ModelConfig` 有结构化字段（provider + modelId），需要单独查询和展示
- 两者职责不同，分开更清晰

**上下文 (`context`) 约定**

| context | 说明 |
|---------|------|
| `skill_default` | Skills 系统的兜底模型（无 per-skill 覆盖时使用） |
| `consultation` | 咨询方案 AI 生成（Sprint 4） |
| `embedding` | RAG 知识库 Embedding（Sprint 3） |
| `skill:{skillId}` | 特定 Skill 的模型覆盖（优先级高于 skill_default） |

---

## Provider 优先级（模型选用逻辑）

```
per-skill SkillConfig.model
    ↓ 若空
ModelConfig WHERE context = 'skill:{skillId}'
    ↓ 若空
ModelConfig WHERE context = 'skill_default'
    ↓ 若空
代码硬编码兜底（当前行为，保持向后兼容）
```

---

## VPS Provider 架构

CLIProxyAPI 是 OpenAI 兼容格式，部署在自建服务器：

```
VPS_PROXY_URL = http://154.12.243.94:8317
VPS_PROXY_KEY = sk-xxxxx  (存于环境变量，不入 DB)
```

**可用模型获取**：Admin 页面调用 `GET /v1/models`，实时展示，不缓存（避免过期）

**调用方式**：`fetch(VPS_PROXY_URL/v1/chat/completions, { body: OpenAI format })`

`vps-provider.ts` 需实现：
- `name: string`
- `getDefaultModel(): string`
- `estimateCost(tokens): number`（CLIProxyAPI 自建，成本自定义，返回 0 或按实际配置）
- `complete(messages, options): Promise<AIResponse>`
- `stream(messages, options): AsyncGenerator<string>`

---

## Admin 页面布局（`/admin/models`）

```
┌─────────────────────────────────────────────┐
│  大模型管理                                   │
│  管理各 AI Provider 连接状态和业务模型分配      │
├─────────────────────────────────────────────┤
│  Provider 状态                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │CLIProxy ✓│ │Gemini  ✓ │ │DeepSeek ?│    │
│  │VPS 自建  │ │env var   │ │env var   │    │
│  │[查看模型]│ │          │ │          │    │
│  └──────────┘ └──────────┘ └──────────┘    │
├─────────────────────────────────────────────┤
│  业务上下文模型分配                            │
│  ┌─────────────────────────────────────┐    │
│  │ Skills 默认模型     [选择模型 ▼]     │    │
│  │ 咨询方案生成        [选择模型 ▼]     │    │
│  │ 知识库 Embedding   [选择模型 ▼]     │    │
│  └─────────────────────────────────────┘    │
├─────────────────────────────────────────────┤
│  CLIProxy 可用模型列表  [刷新]               │
│  ┌─────────────────────────────────────┐    │
│  │ model-id-1    context: ...          │    │
│  │ model-id-2    context: ...          │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

---

## 与现有系统的接口

**Skills 系统读取逻辑**（`base-skill.ts` 或 `skill-registry.ts`）：

```typescript
async function resolveModel(skillId: string): Promise<string> {
  // 1. SkillConfig per-skill override
  const skillConfig = await prisma.skillConfig.findUnique({ where: { skillId } });
  if (skillConfig?.model) return skillConfig.model;

  // 2. ModelConfig per-skill
  const perSkill = await prisma.modelConfig.findUnique({ where: { context: `skill:${skillId}` } });
  if (perSkill) return `${perSkill.provider}:${perSkill.modelId}`;

  // 3. ModelConfig skill_default
  const defaultModel = await prisma.modelConfig.findUnique({ where: { context: 'skill_default' } });
  if (defaultModel) return `${defaultModel.provider}:${defaultModel.modelId}`;

  // 4. Hardcoded fallback
  return 'claude-3-5-sonnet-20241022';
}
```

**咨询方案生成**（Sprint 4 中读取）：

```typescript
const config = await prisma.modelConfig.findUnique({ where: { context: 'consultation' } });
const model = config?.modelId ?? 'default-model';
```

---

## 安全边界

- VPS_PROXY_KEY 只存在环境变量，不进 DB，不在前端暴露
- `/admin/models` 受 `(admin-only)` layout 保护，需 ADMIN 角色
- 模型列表获取（`/v1/models`）只在 Admin 后端执行，走 Server Action

---

# Sprint 2 设计决策

## API Key 存储方案

复用已有的 `IntegrationConfig` 表（AES-256-GCM 加密），key 命名约定：

| IntegrationConfig key | 对应 Provider |
|-----------------------|--------------|
| `PROVIDER_KEY_claude` | Anthropic Claude |
| `PROVIDER_KEY_gemini` | Google Gemini |
| `PROVIDER_KEY_deepseek` | DeepSeek |

**读取优先级**（在各 provider 构造/调用时）：

```
IntegrationConfig[PROVIDER_KEY_xxx]（DB，加密）
    ↓ 若无
process.env.ANTHROPIC_API_KEY / GOOGLE_API_KEY 等（env var）
```

**VPS 例外**：`VPS_PROXY_KEY` 永远只读 env var，不存 DB。

---

## 连接测试逻辑

每个 Provider 的最轻量验证调用：

| Provider | 验证方式 |
|----------|---------|
| Claude | `POST /v1/messages`，`max_tokens: 1`，model: `claude-haiku-4-5-20251001` |
| Gemini | `GET https://generativelanguage.googleapis.com/v1beta/models?key={key}` |
| DeepSeek | `GET https://api.deepseek.com/models`，Bearer auth |
| VPS (CLIProxy) | 已有 `GET /v1/models` |

验证结果返回：`{ ok: boolean; latencyMs?: number; error?: string }`

---

## 模型可用性验证

上下文分配行保存后，「验证」按钮触发 `verifyModel(provider, modelId)` Server Action：

- Claude：`POST /v1/messages` with `max_tokens: 1`，捕获 `model_not_found` 错误
- Gemini：`GET /v1beta/models/{modelId}`，检查 model 是否存在且 `supportedGenerationMethods` 包含 `generateContent` 或 `embedContent`
- VPS：发送最小 chat completion 请求，检查响应

---

## Gemini Embedding 接入

新建 `src/lib/skills/providers/gemini-embedding-provider.ts`：

```typescript
export class GeminiEmbeddingProvider {
  async embedText(text: string, modelId = 'text-embedding-004'): Promise<number[]>
  async embedBatch(texts: string[], modelId = 'text-embedding-004'): Promise<number[][]>
}
```

**调用方式**（Google Generative AI SDK）：

```typescript
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
const result = await model.embedContent(text);
// result.embedding.values → number[] (768 维)
```

**与 ModelConfig 集成**：

```typescript
// Sprint 3 RAG 调用入口
const config = await resolveModelForContext('embedding');
// config = { provider: 'gemini', modelId: 'text-embedding-004' }
const embedder = new GeminiEmbeddingProvider();
const vector = await embedder.embedText(text, config.modelId);
```

---

## Admin 页面 Sprint 2 布局变化

```
┌─────────────────────────────────────────────────┐
│  Provider 状态                                   │
│  ┌──────────────┐ ┌──────────────┐              │
│  │ Claude       │ │ Gemini       │              │
│  │ ● 已连接     │ │ ● 已连接     │              │
│  │ [••••••••] ✎ │ │ [••••••••] ✎│              │  ← Key 输入（密码型）
│  │ [测试连接]   │ │ [测试连接]   │              │  ← 测试按钮
│  └──────────────┘ └──────────────┘              │
├─────────────────────────────────────────────────┤
│  业务上下文模型分配                               │
│  ┌───────────────────────────────────────────┐  │
│  │ Skills 默认  [gemini ▼] [gemini-2.5-pro] [保存] [验证✓] │
│  │ 咨询方案     [vps ▼]    [model-id...]    [保存] [验证✓] │
│  │ Embedding   [gemini ▼] [text-embed-004] [保存] [验证✓] │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```
