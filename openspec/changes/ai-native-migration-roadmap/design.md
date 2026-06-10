## Context

**服务器环境**：自建服务器，12GB RAM，已运行 Coolify + n8n + CLIProxyAPI。

**当前 Supabase 依赖范围**（经代码审计）：
- `src/lib/supabase/` — 3 个文件，只在 `storage.ts` 中实际使用
- `src/lib/storage.ts` — 唯一业务入口，约 80 行，上传/获取图片
- 认证、数据库访问（Prisma）、业务逻辑均不依赖 Supabase

**Resend 已接入**：`src/lib/email.ts` 已有基础 `sendEmail()` 实现，有 `RESEND_API_KEY`。

**PostHog 已接入**：客户端 provider + 用户 identify 已有，仅 geo-writer 有 3 个自定义事件，其余页面无追踪。

**Onboarding 结构**：单页流程（IDLE → ANALYZING → DONE），不是多步骤向导。

---

## Goals / Non-Goals

**Goals**
- 完全脱离 Supabase，所有数据和存储自托管
- 建立覆盖完整用户旅程的 PostHog 数据基础
- 上线 AI 客服，减少人工回复
- 建立邮件营销自动化能力（事务 + 序列分离）
- 让用户可以通过 MCP 协议接入 ScaletoTop
- 提供 Google Ads + Meta Ads 数据分析（自用 + 客户）

**Non-Goals**
- 不评估 InsForge（3-6 个月后重新评估）
- 不引入 LiteLLM（业务量增长后触发）
- 不做深色模式
- 不重构现有 Site Intelligence 核心逻辑

---

## Key Decisions

### 决策 1：存储替换用 `@aws-sdk/client-s3` 而非 MinIO 专属 SDK

**选择**：`@aws-sdk/client-s3`，将 `endpoint` 指向 MinIO 地址。

**理由**：MinIO 完全兼容 S3 API，AWS SDK 是业界标准，未来可无缝切换到 R2、Backblaze 等任何 S3 兼容服务；MinIO 官方 SDK 功能冗余，不值得引入额外依赖。

**接口保持不变**：`storage.ts` 的 `uploadImageFromUrl()` 和 `getMedia()` 对外签名不变，只替换内部实现。

---

### 决策 2：Embedding 方案先用 Gemini text-embedding-004

**选择**：Gemini text-embedding-004（768 维），通过 Google AI Studio API Key 调用。

**理由**：
- 已有 `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`（GSC/GA4 集成），申请 AI Studio Key 5 分钟
- 12GB RAM 中可运行 BGE-M3（需 ~3GB），但暂无必要引入 Ollama 维护复杂度
- 免费额度：每分钟 1500 次请求，完全覆盖当前规模
- 3 个月后若有充分理由（中文检索准确率不够）再迁移到 BGE-M3

**切换路径**：knowledge_base 表的 `model_name` 字段记录使用的模型，切换时重建向量即可。

---

### 决策 3：邮件分两层 — Resend（事务）+ systeme.io（序列）

**选择**：两个服务各司其职，不合并。

| 服务 | 职责 | 触发方式 |
|------|------|----------|
| Resend | 事务邮件（欢迎、低积分预警、购买确认、审计完成、密码重置）| 代码直接调用 `sendEmail()` |
| systeme.io | 营销序列（注册引导、7天再营销、升级推送）| API 添加联系人/标签触发自动化 |

**理由**：事务邮件需要即时、可靠、有送达追踪；营销序列需要可视化编辑、A/B测试、退订管理——两类需求不同，用专门工具更合适。Resend 已有基础实现，systeme.io 作为新集成。

**better-auth 邮件**：密码重置、邮箱验证直接通过 Resend 发送，在 `src/lib/auth.ts` 配置 email provider 指向 `sendEmail()`。

---

### 决策 4：AI 客服工作流用 n8n，不用 InsForge Compute

**选择**：n8n 已安装，直接构建 AI 客服 Workflow，不等待 InsForge Compute。

**理由**：InsForge Compute 仍在私密预览，n8n 生产级可用且已部署，可视化调试优于自建代码。n8n 的 HTTP Request 节点 + AI Agent 节点完全覆盖 RAG + LLM 调用场景。

**Embedding 服务**：n8n Workflow 中通过 HTTP Request 节点调用 Gemini Embedding API，结果写入 PostgreSQL（pgvector）。

---

### 决策 5：MCP Server 内置在 Next.js，使用 SSE 传输

**选择**：在 `src/app/api/mcp/route.ts` 实现 SSE 端点，不单独部署服务。

**理由**：减少运维复杂度；Next.js API Routes 天然支持 SSE；MCP SDK 支持 HTTP+SSE 传输，Claude Desktop 和 Cursor 均可接入。

**API Key 认证**：用户在 Dashboard Settings 生成 API Key，Bearer Token 认证，每个 Key 只能访问该用户自己的数据。

---

### 决策 6：SEM 先做 Google Ads，Meta 第二期

**选择**：Sprint 6 只做 Google Ads，Sprint 7 做 Meta。

**理由**：
- Google Ads OAuth 可复用现有 GSC/GA4 的 OAuth 基础设施（同一 Google Client）
- Meta Marketing API 需要独立 App Review（约 2 周），提前申请
- 两者数据模型类似，Google 先行可验证通用架构
- 目标用户（中国出海企业）Google Ads 使用率高于 Meta

**Meta App Review**：Sprint 6 开始时同步提交 Meta App Review 申请，Sprint 7 开始前应已通过。

---

### 决策 7：PostHog 服务端追踪用 posthog-node

**选择**：安装 `posthog-node`，在 Server Actions 和 API Routes 中追踪服务端事件。

**关键服务端事件**：skill_executed（含 skill_name、credits_cost、duration_ms）、purchase_completed（Creem webhook）、credits_depleted。

**distinct_id**：服务端追踪统一使用 `userId`（better-auth session），与客户端 `posthog.identify(userId)` 匹配，保证同一用户的客户端和服务端事件合并到同一 Person。
