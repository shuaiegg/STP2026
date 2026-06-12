# AI 模型管理中心 — 任务清单

---

## Sprint 1 — Admin 模型管理中心（~2-3 天）✅ 完成

> 目标：Admin 可视化管理所有 AI Provider 状态、CLIProxyAPI 可用模型，并为各业务上下文分配模型

### 1.1 Prisma Schema

- [x] 1.1.1 在 `prisma/schema.prisma` 新增 `ModelConfig` 模型：
  ```prisma
  model ModelConfig {
    id        String   @id @default(uuid())
    context   String   @unique
    provider  String
    modelId   String
    label     String?
    updatedAt DateTime @updatedAt
    updatedBy String?
  }
  ```
- [x] 1.1.2 `npx prisma db push` 应用到开发数据库
- [x] 1.1.3 `npx prisma generate` 重新生成客户端

### 1.2 VPS Provider 修复

- [x] 1.2.1 修复 `src/lib/skills/providers/vps-provider.ts` TS 错误：
  - 补全 `IAIProvider` 接口（`name`, `getDefaultModel`, `estimateCost`）
  - 实现 `generateContent()` 方法（OpenAI 兼容格式，含自动 failover）
  - 从环境变量读取 `VPS_PROXY_URL` 和 `VPS_PROXY_KEY`
- [x] 1.2.2 修复 `src/lib/skills/providers/index.ts` 中 VPS provider 注册，`BaseAIProvider` 补充 `'vps'` 到 name union
- [x] 1.2.3 跑 `npx tsc --noEmit` 确认无新增错误

### 1.3 Server Actions（`/admin/models/actions.ts`）

- [x] 1.3.1 `fetchVpsModels()`: 调用 `GET VPS_PROXY_URL/v1/models`，返回模型列表（需 ADMIN 权限）
- [x] 1.3.2 `getModelConfigs()`: 读取所有 `ModelConfig` 记录
- [x] 1.3.3 `saveModelConfig(context, provider, modelId, label?)`: 写入 `ModelConfig`（upsert）
- [x] 1.3.4 `deleteModelConfig(context)`: 删除某上下文的模型配置
- [x] 1.3.5 `getProviderStatuses()`: 检查各 Provider API Key 是否配置（env var 检测）

### 1.4 Admin 模型管理页（`/admin/models`）

- [x] 1.4.1 创建 `src/app/(protected)/dashboard/admin/(admin-only)/models/page.tsx`（Server Component）
- [x] 1.4.2 创建 `ProviderStatusCards.tsx`：展示 CLIProxy / Gemini / DeepSeek / Anthropic 连接状态卡片
- [x] 1.4.3 创建 `ContextModelAssignment.tsx`（Client Component）：3 个上下文行，provider 下拉 + 模型选择/输入
- [x] 1.4.4 创建 `VpsModelList.tsx`（Client Component）：刷新按钮 + 模型 ID 列表 + 复制功能
- [x] 1.4.5 在 TopNav `ADMIN_LINK_CONFIG` 新增「模型管理」入口（Cpu 图标）

### 1.5 Skills 系统接入

- [x] 1.5.1 创建 `src/lib/skills/model-resolver.ts`：
  - `resolveModelForContext(context)` — 4 级优先链（DB per-context → DB skill_default → env → hardcoded 'vps'）
  - `resolveSkillModel(skillId)` — per-skill 配置优先
- [x] 1.5.2 在 `getDefaultProvider()` 中接入 `resolveModelForContext('skill_default')`，现有 Skills 执行流程透明升级

### 1.6 验收

- [x] 1.6.1 Admin 页面 `/admin/models` 可正常加载，结构完整
- [x] 1.6.2 `resolveModelForContext()` 优先级链实现并导出至 `src/lib/skills/index.ts`
- [x] 1.6.3 `consultation` 上下文预留（Sprint 4 接入准备）
- [x] 1.6.4 `npx tsc --noEmit` 无新增错误
- [ ] 1.6.5 `npm run build` 通过（待验证）

---

> Sprint 1 完成后，Sprint 4（咨询方案生成）可以直接读取 `ModelConfig[consultation]`，Sprint 3（RAG）需等 Sprint 2 Embedding 接入后启动。

---

## Sprint 2 — API Key 管理 + 连接验证 + Embedding 接入（~2-3 天）

> 目标：Admin 可在 UI 管理所有 Provider API Key，并在配置模型时立即验证可用性；同时接入 Gemini Embedding 为 Sprint 3 RAG 做好基础

### 2.1 Server Actions 扩展（`/admin/models/actions.ts`）

- [x] 2.1.1 `saveProviderKey(provider, apiKey)` — 加密写入 `IntegrationConfig`，key 格式 `PROVIDER_KEY_{provider}`；需 ADMIN 权限
- [ ] 2.1.2 `getProviderKeyMask(provider)` — 返回已保存 Key 的掩码（如 `sk-••••••••ab12`），供 UI 展示；不返回明文
- [ ] 2.1.3 `testProviderConnection(provider)` — 使用 DB Key（fallback env var）发最轻量 API 调用，返回 `{ ok, latencyMs?, error? }`
- [ ] 2.1.4 `verifyModelAccess(provider, modelId)` — 验证指定 provider+model 是否可访问，返回 `{ ok, error? }`
- [ ] 2.1.5 更新 `getProviderStatuses()` — 同时检查 DB Key 和 env var，返回 `source: 'db' | 'env' | 'none'`

### 2.2 Provider Key 读取升级

- [ ] 2.2.1 `src/lib/integrations/config.ts` 新增 `getProviderApiKey(provider)` — 先查 `IntegrationConfig[PROVIDER_KEY_{provider}]`，解密后返回；若无则 fallback 到对应 env var
- [ ] 2.2.2 更新 `gemini-provider.ts` — 调用时通过 `getProviderApiKey('gemini')` 获取 Key，而非直接读 `process.env.GOOGLE_API_KEY`
- [ ] 2.2.3 更新 `claude-provider.ts` — 同上，改为 `getProviderApiKey('claude')`
- [ ] 2.2.4 更新 `deepseek-provider.ts` — 同上，改为 `getProviderApiKey('deepseek')`

### 2.3 ProviderStatusCards UI 升级

- [ ] 2.3.1 每个 Provider 卡片加 API Key 输入区域：
  - 已有 Key 时显示掩码 + 「修改」按钮
  - 点击修改展开密码输入框 + 「保存 Key」按钮
  - 保存成功后重新掩码显示
- [ ] 2.3.2 每个 Provider 卡片加「测试连接」按钮，显示延迟或错误
- [ ] 2.3.3 VPS 卡片不显示 Key 输入（只保留「测试连接」，走现有 `/v1/models` 验证）

### 2.4 ContextModelAssignment 验证按钮

- [ ] 2.4.1 每个上下文行「保存」成功后，出现「验证」按钮
- [ ] 2.4.2 点击「验证」调用 `verifyModelAccess(provider, modelId)`，展示 ✓ 可用 / ✗ 无法访问
- [ ] 2.4.3 保存新配置后自动清除上一次验证结果

### 2.5 Gemini Embedding Provider

- [ ] 2.5.1 新建 `src/lib/skills/providers/gemini-embedding-provider.ts`：
  - `embedText(text, modelId?)` → `Promise<number[]>`（默认 `text-embedding-004`，768 维）
  - `embedBatch(texts, modelId?)` → `Promise<number[][]>`
  - 通过 `getProviderApiKey('gemini')` 获取 Key
- [ ] 2.5.2 在 `src/lib/skills/index.ts` 导出 `GeminiEmbeddingProvider`
- [ ] 2.5.3 在 `model-resolver.ts` 补充 `resolveEmbeddingProvider()` — 读取 `ModelConfig[embedding]`，返回 embedding provider 实例

### 2.6 验收

- [ ] 2.6.1 在 `/admin/models` 保存 Gemini API Key，Provider 状态变为 `source: 'db'`
- [ ] 2.6.2 点击「测试连接」，Gemini 卡片显示延迟（非报错）
- [ ] 2.6.3 设置 `embedding` 上下文为 `gemini / text-embedding-004`，点击「验证」显示可用
- [ ] 2.6.4 调用 `GeminiEmbeddingProvider.embedText('hello')` 返回 768 维 number[]
- [ ] 2.6.5 `npx tsc --noEmit` 无新增错误

---

## Sprint 4（后续）— 咨询方案生成系统

> 依赖：`resolveModelForContext('consultation')` 已在 ModelConfig 中配置

### 4.1 Geo-writer 工具公开引流
- [ ] 4.1.1 公开导航加入 Geo-writer 入口
- [ ] 4.1.2 未登录时跳转 login，登录后跳回

### 4.2 Case Studies 页面
- [ ] 4.2.1 建立 3 个匿名代表性案例
- [ ] 4.2.2 公开页 `/case-studies`

### 4.3 咨询方案生成系统
- [ ] 4.3.1 多步引导表单（服务类型 → 业务详情 → 联系方式）
- [ ] 4.3.2 表单提交 → 调用 CLIProxyAPI 分析需求 + 生成方案草稿
- [ ] 4.3.3 Admin 审核面板：查看/编辑草稿 → 一键发布
- [ ] 4.3.4 公开方案页 `/proposal/[token]`

---

> Sprint 3（RAG 知识库）暂缓，等待发布文章和真实用户后再启动。
