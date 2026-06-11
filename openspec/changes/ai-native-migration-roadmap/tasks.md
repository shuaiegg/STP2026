# AI Native 迁移与开发路线图 — 任务清单

---

## Sprint 0 — 基础设施迁移（~2 天）

> 目标：完全脱离 Supabase，自托管 PostgreSQL (pgvector) + MinIO

### 0.1 服务器部署

- [x] 0.1.1 通过 Coolify API 或面板部署 `pgvector/pgvector:pg17` 容器，映射端口 5432（仅内网），配置持久卷
- [x] 0.1.2 通过 Coolify API 或面板部署 MinIO 容器，配置持久卷，设置 `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`
- [x] 0.1.3 登录 MinIO Console，创建 `media` bucket，设置 public read 访问策略
- [x] 0.1.4 在 MinIO 创建专用 Access Key（非 root），记录 `ACCESS_KEY_ID` 和 `SECRET_ACCESS_KEY`
- [ ] 0.1.5 **⚠ 阻塞** 通过 Coolify 面板确认两个容器在同一 Docker 网络，Next.js 容器可访问
      > `media.scaletotop.com` 当前 504 — Coolify 反向代理未正确将域名路由到 MinIO S3 端口。
      > 修复：在 Coolify 中为 MinIO 服务配置正确的 Proxy Host，确保 S3 API 端口（默认 9000）可通过 HTTPS 访问。
      > 生产环境 `MINIO_ENDPOINT` 应设为内部 Docker 网络地址（如 `http://minio:9000`），`MINIO_PUBLIC_URL` 保持 `https://media.scaletotop.com`

### 0.2 数据库迁移

- [x] 0.2.1 pg_dump 导出完整数据
- [x] 0.2.2 导入到新服务器
- [x] 0.2.3 验证行数一致
- [x] 0.2.4 启用 pgvector 扩展
- [x] 0.2.5 更新环境变量（`.env.local` 中 DATABASE_URL 已指向新 PostgreSQL `154.12.243.94:54320`）

### 0.3 媒体文件迁移

- [x] ~~0.3.1–0.3.5~~ **已跳过** — 检查数据库确认 `Media` 表完全为空（0 行），Content 表无 Supabase URL，无需迁移任何文件。

### 0.4 代码：storage.ts 替换

- [x] 0.4.1 `@aws-sdk/client-s3` 已安装（见 package.json）
- [x] 0.4.2 `src/lib/storage.ts` 已重写，使用 S3Client + PutObjectCommand，`forcePathStyle: true`
- [x] 0.4.3 环境变量 `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` 已在 `.env.local` 中配置
- [x] 0.4.4 已删除 `src/lib/supabase/` 目录（client.ts, server.ts, index.ts）；`.env` 中 Supabase 变量已清除

### 0.5 回归测试

- [x] 0.5.1 本地开发环境指向新数据库（`.env.local` DATABASE_URL），Prisma 查询正常
- [ ] 0.5.2 **⚠ 待验证（依赖 0.1.5 修复）** 触发 Notion 同步，验证图片上传到 MinIO
- [ ] 0.5.3 **⚠ 待验证（依赖 0.5.2）** 访问 `/blog`，确认封面图片指向 MinIO URL
- [x] 0.5.4 登录流程、dashboard、billing 页面全流程正常
- [x] 0.5.5 `src/lib/supabase/` 已安全删除，`npm run build` 无报错（46 条路由全部通过）

---

## Sprint 1 — PostHog 全面追踪（~2-3 天）

> 目标：在用户增长前建立完整的数据基础，覆盖获客→激活→付费全链路

### 1.1 服务端 PostHog 基础

- [x] 1.1.1 `npm install posthog-node`
- [x] 1.1.2 创建 `src/lib/analytics/posthog-server.ts`：初始化 `PostHog` 客户端（lazy init），导出 `captureServerEvent(distinctId, event, properties)` 工具函数
- [x] 1.1.3 确认 `NEXT_PUBLIC_POSTHOG_KEY` 在服务端可用（已有）

### 1.2 获客漏斗（公开页，客户端）

- [x] 1.2.1 `src/app/(public)/HomePageCTA.tsx`（新建）：首页主/副 CTA 按钮 `posthog.capture('homepage_cta_clicked', { cta: 'primary' | 'secondary' | 'bottom_primary' | 'bottom_secondary' })`
- [x] 1.2.2 `src/app/(public)/pricing/PricingClient.tsx`：
  - 页面加载时 `posthog.capture('pricing_viewed')`（useEffect）
  - 每个套餐的购买按钮点击 `posthog.capture('pricing_plan_selected', { plan, credits, price })`
- [x] 1.2.3 `src/app/(public)/blog/[slug]/ArticleReadTracker.tsx`（新建）：文章阅读进度追踪（滚动到 50%/95%）`posthog.capture('blog_article_read', { slug, category, read_pct })`
- [ ] 1.2.4 `src/app/(public)/tools/page.tsx`：工具页访问 `posthog.capture('tools_page_viewed')`（低优先级，可延后）

### 1.3 注册与激活漏斗（客户端）

- [x] 1.3.1 `src/app/(public)/register/page.tsx`：
  - 新用户提交姓名时 `posthog.capture('signup_started', { method: 'email' })`
  - OTP 验证成功且 isNewUser 时 `posthog.capture('signup_completed', { method: 'email' })`
- [ ] 1.3.2 Google OAuth 登录入口：当前未接入 Google OAuth，跳过
- [x] 1.3.3 `src/app/(protected)/dashboard/onboarding/OnboardingClient.tsx`：
  - IDLE → ANALYZING 时 `posthog.capture('onboarding_started')`
  - saveData.success 时 `posthog.capture('onboarding_completed', { domain })`

### 1.4 核心产品使用（客户端）

- [x] 1.4.1 `src/app/(protected)/dashboard/site-intelligence/EmptyState.tsx`：添加站点成功后 `posthog.capture('first_site_added', { domain })`
- [x] 1.4.2 `IntegrationsPanel.tsx`：GSC 连接成功回调 `posthog.capture('gsc_connected', { siteId })`
- [x] 1.4.3 `IntegrationsPanel.tsx`：GA4 连接成功回调 `posthog.capture('ga4_connected', { siteId })`
- [ ] 1.4.4 内容计划创建：`posthog.capture('content_plan_created', { siteId })`（待找到创建入口）
- [x] 1.4.5 `src/app/(protected)/dashboard/billing/BillingClient.tsx`：页面加载 `posthog.capture('billing_page_viewed', { credits_remaining })`（creditsRemaining 从 page.tsx 传入）

### 1.5 AI Skills 使用（服务端，posthog-node）

- [x] 1.5.1 `src/app/api/skills/execute/route.ts`：skill 执行成功后 `captureServerEvent(userId, 'skill_executed', { skill_name, credits_cost, duration_ms, success: true })`
- [x] 1.5.2 同文件：执行失败时 `captureServerEvent(userId, 'skill_executed', { skill_name, success: false, error_type })`
- [x] 1.5.3 credits 扣减后：若余量 `< 50` 则 `captureServerEvent(userId, 'credits_low', { remaining })`

### 1.6 付费事件（服务端）

- [x] 1.6.1 `src/app/api/webhooks/creem/route.ts`：`checkout.completed` 成功后 `captureServerEvent(userId, 'purchase_completed', { product_id, credits_added, amount_usd })`
- [ ] 1.6.2 Library 保存文章：`posthog.capture('article_saved_to_library', { word_count, skill_used })`（待实现）

### 1.7 验证

- [ ] 1.7.1 PostHog Live Events 面板确认所有事件正常到达
- [ ] 1.7.2 完整走一遍注册 → onboarding → 触发审计 → billing 页面，确认 person 下有完整事件序列

---

## Sprint 2 — 邮件营销接入（~3 天）

> 目标：Resend 事务邮件上线 + systeme.io 营销序列接入

### 2.1 Resend 邮件模板

- [ ] 2.1.1 创建 `src/lib/email/templates/` 目录
- [ ] 2.1.2 `welcome.ts`：欢迎邮件模板（HTML，含用户名、入门步骤、dashboard 链接）
- [ ] 2.1.3 `credits-warning.ts`：积分低预警模板（含剩余积分、充值链接）
- [ ] 2.1.4 `purchase-success.ts`：购买成功确认（含积分数量、当前余额）
- [ ] 2.1.5 `audit-complete.ts`：站点审计完成通知（含站点域名、查看报告链接）
- [ ] 2.1.6 更新 `src/lib/email.ts`，增加各模板的具名导出函数：`sendWelcomeEmail(user)`, `sendCreditsWarningEmail(user, remaining)`, `sendPurchaseSuccessEmail(user, credits)`, `sendAuditCompleteEmail(user, siteId, domain)`

### 2.2 better-auth 邮件配置

- [ ] 2.2.1 在 `src/lib/auth.ts` 配置 `emailAndPassword.sendResetPassword`，使用 `sendEmail()` 发送密码重置邮件
- [ ] 2.2.2 测试密码重置流程，确认邮件正常到达

### 2.3 事务邮件触发点

- [ ] 2.3.1 `src/app/actions/auth.ts` 注册成功后：`await sendWelcomeEmail(user)`（非阻塞，try/catch 包裹）
- [ ] 2.3.2 `src/app/api/skills/execute/route.ts` credits 低于 50 时：`await sendCreditsWarningEmail(user, remaining)`（每 24 小时最多发一次，用 `User.lastCreditWarningAt` 字段控制）
- [ ] 2.3.3 `src/app/api/webhooks/creem/route.ts` 购买成功后：`await sendPurchaseSuccessEmail(user, creditsAdded)`
- [ ] 2.3.4 站点审计完成后（找到 audit complete 的回调位置）：`await sendAuditCompleteEmail(user, siteId, domain)`

### 2.4 systeme.io 集成

- [ ] 2.4.1 创建 `src/lib/email/systeme.ts`：封装 systeme.io API（添加联系人、添加标签）
  - `addContact(email, name, tags[])` — 添加联系人并打标签
  - 环境变量 `SYSTEME_IO_API_KEY`
- [ ] 2.4.2 注册成功后：`await addContact(email, name, ['registered'])` 触发 systeme.io 注册引导序列
- [ ] 2.4.3 Onboarding 完成后：`await addContact(email, name, ['onboarding_completed'])`
- [ ] 2.4.4 在 systeme.io 配置自动化规则：`registered` 标签 → 7天引导邮件序列

### 2.5 n8n 再营销 Workflow

- [ ] 2.5.1 在 n8n 创建 Workflow：每日 cron → 查询注册超 7 天且未完成 onboarding（`siteCount = 0`）的用户 → 调用 systeme.io API 打 `inactive_7d` 标签
- [ ] 2.5.2 在 n8n 创建 Workflow：每日 cron → 查询注册超 14 天未消耗任何 credits 的用户 → 打 `inactive_14d` 标签

### 2.6 Prisma Schema 更新

- [ ] 2.6.1 在 `User` 模型添加 `lastCreditWarningAt DateTime?` 字段（防止低积分邮件重复发送）
- [ ] 2.6.2 `npx prisma db push` 应用

---

## Sprint 3 — AI 客服基础（~4 天）

> 目标：pgvector 知识库上线 + n8n AI 客服工作流

### 3.1 知识库 Schema

- [ ] 3.1.1 在 `prisma/schema.prisma` 添加 `KnowledgeBase` 模型（或直接用 raw SQL，因 Prisma 不支持 vector 类型原生）
- [ ] 3.1.2 执行 SQL 建表：
  ```sql
  CREATE TABLE knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding vector(768),
    source_type VARCHAR(50),
    source_id VARCHAR(255),
    metadata JSONB,
    model_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX ON knowledge_base USING hnsw (embedding vector_cosine_ops) WITH (m=16, ef_construction=64);
  ```
- [ ] 3.1.3 申请 Google AI Studio API Key（`GOOGLE_AI_API_KEY`），与现有 `GOOGLE_CLIENT_ID` 不同（AI Studio 专用）

### 3.2 Embedding 工具函数

- [ ] 3.2.1 创建 `src/lib/embeddings/gemini.ts`：封装 Gemini text-embedding-004 调用
  - `generateEmbedding(text: string): Promise<number[]>`
  - 环境变量 `GOOGLE_AI_API_KEY`

### 3.3 n8n 知识库同步 Workflow

- [ ] 3.3.1 在 n8n 创建 Workflow（手动 + 每日 cron）：
  - 查询 `Content` 表中 `status=PUBLISHED` 的文章
  - 对每篇文章的 `title + summary + contentMd` 分块（约 512 tokens/块）
  - 调用 Gemini Embedding API（HTTP Request 节点）
  - UPSERT 到 `knowledge_base` 表（按 `source_id` 去重）
- [ ] 3.3.2 运行一次全量同步，验证 `knowledge_base` 表有正确的向量数据

### 3.4 n8n AI 客服 Workflow

- [ ] 3.4.1 创建客服入口（选其一：邮件 Webhook / Chatwoot / 手动测试用 HTTP 端点）
- [ ] 3.4.2 Workflow 逻辑：
  1. 接收用户问题 + 邮件地址
  2. 查询 Prisma（HTTP Request → Next.js API）获取用户账户上下文（credits、plan、last activity）
  3. 生成问题 Embedding（Gemini）
  4. pgvector 检索 Top-5 相关文档（`SELECT content FROM knowledge_base ORDER BY embedding <=> $vec LIMIT 5`）
  5. 构建 RAG Prompt（用户信息 + 知识片段 + 问题）
  6. 调用 Claude via CLIProxyAPI（AI Agent 节点）
  7. 置信度评分：含"我不确定"→ 转人工队列；否则自动回复
- [ ] 3.4.3 测试：发送 5 个典型客服问题，验证回复质量

---

## Sprint 4 — 工具入口公开化 + 页面实装（~3 天）

> 目标：工具更易发现；Case Studies 和 Consultation 成为有实际内容的页面

### 4.1 工具入口优化（仅导航/UI 调整，工具本身不变）

- [ ] 4.1.1 在公开导航（`src/app/(public)/layout.tsx` 或 Header 组件）中增加"AI 工具"直接链接，指向 `/tools/geo-writer`
- [ ] 4.1.2 首页新增工具快速入口区块（在现有流程/方法区块下方），1-2 个工具卡片展示 geo-writer

### 4.2 Case Studies 页面

- [ ] 4.2.1 设计 Case Studies 页面结构（客户名（可匿名）/ 行业 / 挑战 / 方案 / 结果数据）
- [ ] 4.2.2 实装至少 3 个真实案例（内容由你提供，代码层面组件化，易于后续追加）
- [ ] 4.2.3 每个案例页有结构化数据（JSON-LD: `CaseStudy` 或 `Article`）

### 4.3 Consultation 表单

- [ ] 4.3.1 实装 Consultation 页面表单（姓名、邮箱、公司、业务描述、预算范围）
- [ ] 4.3.2 表单提交 Server Action：
  - `sendEmail()` 通知 jack@scaletotop.com
  - `systeme.io addContact()` 打 `consultation_request` 标签
  - 向用户发送确认邮件（使用 Resend）
- [ ] 4.3.3 提交成功页面 / 感谢状态，PostHog 追踪 `consultation_submitted`

---

## Sprint 5 — 用户侧 MCP Server（~8 天）

> 目标：用户可通过 Claude Desktop / Cursor 接入 ScaletoTop

### 5.1 MCP 基础设施

- [ ] 5.1.1 `npm install @modelcontextprotocol/sdk`
- [ ] 5.1.2 在 `prisma/schema.prisma` 添加 `ApiKey` 模型：
  ```prisma
  model ApiKey {
    id          String   @id @default(uuid())
    userId      String
    name        String
    keyHash     String   @unique
    keyPrefix   String   // 展示用，如 "stt_abc..."
    lastUsedAt  DateTime?
    createdAt   DateTime @default(now())
    user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  }
  ```
- [ ] 5.1.3 `npx prisma db push` + `npx prisma generate`

### 5.2 API Key 管理

- [ ] 5.2.1 Server Action：`generateApiKey(userId, name)` — 生成随机 key，hash 后存库，返回明文（仅展示一次）
- [ ] 5.2.2 Server Action：`revokeApiKey(keyId, userId)` — 删除
- [ ] 5.2.3 在 `src/app/(protected)/dashboard/settings/page.tsx` 新增 "API Keys" 区块：列出已有 key（仅显示 prefix）、生成新 key（展示一次明文）、吊销按钮

### 5.3 MCP Server 实现

- [ ] 5.3.1 创建 `src/lib/mcp/server.ts`：初始化 MCP Server，注册所有工具
- [ ] 5.3.2 创建 `src/app/api/mcp/route.ts`：GET（SSE 连接）+ POST（消息处理）
  - Bearer Token 认证：从 `Authorization` header 提取 key，hash 后查 `ApiKey` 表
  - 速率限制：每个 key 每分钟最多 20 次调用
- [ ] 5.3.3 实现工具 `get_site_audit(siteId)` — 返回最新审计摘要
- [ ] 5.3.4 实现工具 `get_keywords(siteId, limit?)` — 返回 GSC 关键词数据
- [ ] 5.3.5 实现工具 `get_content_plan(siteId)` — 返回内容计划
- [ ] 5.3.6 实现工具 `generate_article(topic, keywords[])` — 调用 stellar-writer skill
- [ ] 5.3.7 实现工具 `get_account_info()` — 返回用户基本信息、credits、站点列表
- [ ] 5.3.8 实现工具 `search_knowledge_base(query)` — pgvector 语义检索，返回 Top-5

### 5.4 文档与 PostHog

- [ ] 5.4.1 在 Dashboard Settings 页面添加 MCP 接入说明（Claude Desktop 配置示例 JSON）
- [ ] 5.4.2 服务端追踪：`captureServerEvent(userId, 'mcp_tool_called', { tool_name, success })`

### 5.5 测试

- [ ] 5.5.1 用 curl 测试 SSE 连接和工具调用
- [ ] 5.5.2 在本地 Claude Desktop 配置 MCP Server，完整测试所有工具

---

## Sprint 6 — Google Ads 数据分析（~10 天）

> 目标：Google Ads OAuth 接入，广告 + SEO 数据联合分析，支持自用和客户多租户

### 6.1 准备工作（Sprint 5 期间并行）

- [ ] 6.1.1 向 Meta 提交 App Review 申请（Marketing API 权限），约 2 周审核，与 Sprint 6 并行

### 6.2 Prisma Schema

- [ ] 6.2.1 添加 `GoogleAdsConnection` 模型（accessToken, refreshToken, customerId, accountName, siteId）
- [ ] 6.2.2 添加 `AdsCampaign` 模型（campaignId, name, status, channel, siteId, provider）
- [ ] 6.2.3 添加 `AdsMetric` 模型（campaignId, date, impressions, clicks, cost, conversions, roas）
- [ ] 6.2.4 `npx prisma migrate dev` 创建迁移文件

### 6.3 Google Ads OAuth

- [ ] 6.3.1 在现有 Google OAuth Client（`GOOGLE_CLIENT_ID`）中增加 `https://www.googleapis.com/auth/adwords` scope
- [ ] 6.3.2 创建 `src/app/api/dashboard/sites/[siteId]/google-ads/connect/route.ts`：OAuth 发起
- [ ] 6.3.3 创建 `src/app/api/dashboard/sites/[siteId]/google-ads/callback/route.ts`：处理回调，存 Token
- [ ] 6.3.4 创建 `src/lib/google-ads/client.ts`：封装 Google Ads API 查询（Campaign 列表、Metrics 查询）

### 6.4 数据同步

- [ ] 6.4.1 创建 `src/app/api/dashboard/sites/[siteId]/google-ads/sync/route.ts`：触发同步
- [ ] 6.4.2 n8n cron Workflow：每日同步所有已连接站点的 Google Ads 数据（调用上述 API）
- [ ] 6.4.3 关键词重叠分析：查询 `AdsMetric` 中的广告关键词 与 `SiteKeyword`（GSC）对比，找出重叠和空白

### 6.5 UI：广告分析看板

- [ ] 6.5.1 在 `src/app/(protected)/dashboard/site-intelligence/[siteId]/page.tsx` 新增 "广告" 标签页
- [ ] 6.5.2 实现：广告账户连接状态 + OAuth 授权按钮
- [ ] 6.5.3 实现：广告 KPI 卡片（总花费、总点击、平均 CPC、ROAS）
- [ ] 6.5.4 实现：广告 vs SEO 关键词重叠表格（已投放 / 纯 SEO / 空白关键词）
- [ ] 6.5.5 实现：广告系列列表（按花费排序，含转化率）

---

## Sprint 7 — Meta Ads 数据分析（~10 天）

> 前提：Meta App Review 已通过（Sprint 6 期间提交）

### 7.1 Prisma Schema

- [ ] 7.1.1 添加 `MetaAdsConnection` 模型（accessToken, adAccountId, siteId）
- [ ] 7.1.2 `AdsCampaign` 和 `AdsMetric` 已有 `provider` 字段，无需新增模型

### 7.2 Meta OAuth

- [ ] 7.2.1 创建 Facebook App，配置 Marketing API 权限（`ads_read`, `business_management`）
- [ ] 7.2.2 创建 `src/app/api/dashboard/sites/[siteId]/meta-ads/connect/route.ts`
- [ ] 7.2.3 创建 Meta callback handler，存 Token
- [ ] 7.2.4 创建 `src/lib/meta-ads/client.ts`：封装 Meta Marketing API（Campaign, Insights）

### 7.3 数据同步

- [ ] 7.3.1 扩展 n8n 广告同步 Workflow，增加 Meta Ads 数据源
- [ ] 7.3.2 统一 `AdsMetric` 数据格式（Google 和 Meta 存入同一表，`provider` 字段区分）

### 7.4 UI：统一广告看板

- [ ] 7.4.1 广告标签页新增 Meta 账户连接区块
- [ ] 7.4.2 总览 KPI 卡片支持 Google + Meta 数据合并展示
- [ ] 7.4.3 按 provider 过滤（全部 / Google / Meta）
- [ ] 7.4.4 广告花费 vs 自然流量趋势对比图

---

## 完成标志

每个 Sprint 的完成标准：

| Sprint | 完成标志 |
|--------|---------|
| Sprint 0 | Notion 同步正常，图片在 MinIO，博客页面正常显示，Supabase 变量已删除 |
| Sprint 1 | PostHog Live Events 中所有 11 类事件均可触发，用户旅程可追踪 |
| Sprint 2 | 注册触发欢迎邮件，purchases 触发确认邮件，systeme.io 有 contact 入库 |
| Sprint 3 | n8n 知识库同步跑通，AI 客服能回答 5 个标准问题 |
| Sprint 4 | Case Studies 有真实内容，Consultation 表单提交有邮件通知 |
| Sprint 5 | Claude Desktop 可成功调用 `get_site_audit` 和 `generate_article` |
| Sprint 6 | Google Ads 账户连接后数据同步，关键词重叠表格有数据 |
| Sprint 7 | Meta + Google 统一看板显示合并 KPI |
