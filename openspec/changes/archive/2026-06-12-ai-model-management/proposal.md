# AI 模型管理中心 — 提案

## Why

ScaletoTop 目前同时使用多个 AI Provider（CLIProxyAPI / Gemini / DeepSeek），但模型配置完全分散：

- API Key 硬写在环境变量，运行时无法切换
- 各 Skills 的模型选择散落在 `SkillConfig` 表和代码里，缺乏统一视图
- CLIProxyAPI（VPS 自建）的可用模型列表从未可视化，只能靠 curl 查询
- 新增业务（咨询方案生成、RAG Embedding）需要为每个场景单独配置模型，没有统一入口
- `vps-provider.ts` 有 TS 错误，当前无法正常使用

随着 Sprint 4（咨询方案 AI 生成）和 Sprint 3（知识库 Embedding）的推进，模型选用将变得越来越频繁。需要一个**管理员可操作的模型控制平面**，作为后续所有 AI 功能的基础设施。

## What Changes

1. **VPS Provider 修复**：修复 `vps-provider.ts` 的 TS 错误，实现完整的 OpenAI 兼容调用
2. **模型发现**：从 CLIProxyAPI（`GET /v1/models`）拉取可用模型列表，Admin 可实时查看
3. **模型分配**：为不同业务上下文（Skills 默认 / 咨询方案生成 / Embedding）指定模型，存入 DB
4. **Admin 模型管理页**：`/admin/models`，统一展示所有 Provider 状态、可用模型、上下文分配

## Capabilities

### 新增

- `model-config`: `ModelConfig` Prisma 模型，存储各业务上下文的模型选择
- `vps-model-list`: Admin 可实时获取 CLIProxyAPI 当前可用模型列表
- `context-model-assignment`: 为 `skill_default` / `consultation` / `embedding` 等上下文分配模型
- `admin-models-page`: `/admin/models` 管理页，含 Provider 状态、模型列表、上下文配置

### 修改

- `vps-provider.ts`: 修复 TS 错误，补全 `IAIProvider` 接口实现
- `skill-registry.ts`: 读取 `ModelConfig` 的 `skill_default` 作为兜底模型
- `IntegrationConfig`: 复用加密存储机制，或新增独立 `ModelConfig` 表（见 design.md）

### 不变

- 现有 `SkillConfig.model` 字段仍有效（per-skill 覆盖优先级最高）
- 其他 Provider（Gemini、DeepSeek）API Key 继续从环境变量读取（只做展示，暂不支持 DB 管理）

## Impact

**关键文件改动**

- `prisma/schema.prisma` — 新增 `ModelConfig` 模型
- `src/lib/skills/providers/vps-provider.ts` — 修复 + 完善
- `src/lib/skills/providers/index.ts` — 注册 VPS provider
- `src/app/(protected)/dashboard/admin/(admin-only)/models/` — 新建管理页

**新增依赖**

无（复用现有 fetch + Prisma + IntegrationConfig 加密体系）

## Non-Goals（Sprint 1）

- 不做 per-user 模型选择（只有 Admin 可配置）
- 不做模型用量统计（留给后续 Sprint）
- 不做 LiteLLM 接入（流量增长后触发）

---

# Sprint 2 — API Key 管理 + 连接验证 + Embedding 接入

## Why

Sprint 1 完成后暴露了三个遗留问题：

1. **API Key 无法从 UI 管理**：Gemini / DeepSeek / Anthropic 的 Key 硬写在 `.env`，修改需要重启服务，VPS 上操作繁琐
2. **没有连接验证**：选了模型不知道 Key 是否有效、模型是否在账户内可用，配置错误只在 Skills 执行时才暴露
3. **Embedding 未接入**：`text-embedding-004`（Gemini）已在 ModelConfig 里可选，但 Gemini provider 完全没有实现 `embedContent` 接口，Sprint 3（RAG）无法启动

## What Changes

1. **Provider API Key UI 管理**：Admin 可在 `/admin/models` 页面写入各 Provider 的 API Key，加密存入 `IntegrationConfig` 表，运行时优先读 DB，fallback 到 env var
2. **连接测试**：每个 Provider 卡片加「测试连接」按钮，发最轻量 API 调用验证 Key 有效性
3. **模型可用性验证**：上下文分配保存后，可一键验证该 provider+model 是否可访问（非阻塞，异步）
4. **Gemini Embedding 接入**：实现 `GoogleEmbeddingProvider`，调用 `embedContent` API，支持 `text-embedding-004` 的 768 维向量化

## Capabilities

### 新增

- `provider-key-management`：Admin UI 写入 / 更新各 Provider API Key，加密存入 `IntegrationConfig`
- `connection-test`：每个 Provider 卡片的「测试」按钮，实时验证 Key + 模型可访问性
- `model-verify`：上下文分配行的「验证」按钮，单独测试已保存的 provider/model 组合
- `embedding-provider`：`GoogleEmbeddingProvider` 类，实现 `embedText(text): Promise<number[]>` 接口，供 Sprint 3 RAG 调用

### 修改

- `ProviderStatusCards`：加 API Key 输入框（密码型）+ 「测试连接」按钮 + 实时状态反馈
- `ContextModelAssignment`：保存后新增「验证」按钮
- `src/lib/skills/providers/gemini-provider.ts`（或新建 `gemini-embedding-provider.ts`）：加 `embedContent` 实现
- `model-resolver.ts`：`resolveModelForContext('embedding')` 返回 embedding provider 引用

### 不变

- VPS_PROXY_KEY 不进 DB（自建服务，安全边界不同）
- per-skill SkillConfig.model 覆盖逻辑不变
- 现有 env var 仍有效（DB Key 优先，env fallback）

## Impact

**关键文件改动**

- `src/app/(protected)/dashboard/admin/(admin-only)/models/ProviderStatusCards.tsx` — 加 Key 输入 + 测试
- `src/app/(protected)/dashboard/admin/(admin-only)/models/ContextModelAssignment.tsx` — 加验证按钮
- `src/app/(protected)/dashboard/admin/(admin-only)/models/actions.ts` — 加 saveProviderKey / testConnection / verifyModel
- `src/lib/skills/providers/gemini-embedding-provider.ts` — 新建
- `src/lib/integrations/config.ts` — 复用 saveIntegrationValue / getIntegrationValue

**新增依赖**

无（复用现有 `@google/generative-ai` SDK + `IntegrationConfig` 加密体系）
