# AI Native 迁移与开发路线图 — 提案

## Why

ScaletoTop 目前依赖 Supabase 托管服务（PostgreSQL + Storage），计划迁移到自建服务器（Coolify 管理），同时将产品从单一内容平台进化为 AI Native SaaS：具备 AI 客服、邮件营销自动化、用户侧 MCP 接入和 SEM 广告数据分析能力。项目目前流量极低，是执行基础设施迁移的最佳时机。

## What Changes

分 8 个 Sprint 迭代交付（Sprint 0 是基础设施，1-7 是产品功能）：

| Sprint | 主题 | 预估工时 |
|--------|------|--------|
| **Sprint 0** | 脱离 Supabase，自托管 PostgreSQL (pgvector) + MinIO | ~2 天 |
| **Sprint 1** | PostHog 全面追踪（方向 B，覆盖获客→付费全链路） | ~2-3 天 |
| **Sprint 2** | 邮件营销接入（Resend 事务邮件 + systeme.io 营销序列） | ~3 天 |
| **Sprint 3** | AI 客服基础（pgvector 知识库 + n8n RAG 工作流） | ~4 天 |
| **Sprint 4** | 工具入口公开化 + Case Studies / Consultation 页面实装 | ~3 天 |
| **Sprint 5** | 用户侧 MCP Server（让用户从 Claude Desktop/Cursor 接入） | ~8 天 |
| **Sprint 6** | Google Ads 数据分析模块（自用 + 客户多租户） | ~10 天 |
| **Sprint 7** | Meta Ads 数据分析模块 | ~10 天 |

## Capabilities

### 新增

- `self-hosted-infra`: pgvector PostgreSQL + MinIO 取代 Supabase，Coolify 管理
- `posthog-full-tracking`: 覆盖获客、激活、留存、付费全链路的 PostHog 事件体系
- `transactional-email`: Resend 事务邮件（欢迎、低积分预警、购买确认、审计完成）
- `marketing-sequences`: systeme.io 邮件序列（注册引导、再营销、升级推送）
- `ai-customer-service`: pgvector 知识库 + n8n AI 客服工作流（RAG + Claude）
- `tool-public-entry`: 首页/导航增加 geo-writer 工具入口
- `real-pages`: Case Studies 真实内容 + Consultation 表单提交功能
- `mcp-server`: `/api/mcp` SSE 端点，暴露站点分析、文章生成等工具给 AI 客户端
- `google-ads-analytics`: Google Ads OAuth + 数据同步 + 广告 vs SEO 分析看板
- `meta-ads-analytics`: Meta Marketing API 接入 + 统一广告看板

### 修改

- `storage`: `src/lib/storage.ts` 替换 Supabase SDK → AWS S3 SDK（兼容 MinIO）
- `email`: `src/lib/email.ts` 扩展为完整邮件模板系统
- `site-intelligence`: 新增 Ads 标签页（Sprint 6-7）
- `dashboard-settings`: 新增 API Key 管理（Sprint 5）

## Impact

**关键文件改动**

- `src/lib/storage.ts` — S3 SDK 替换（Sprint 0）
- `src/lib/supabase/` — 全部删除（Sprint 0 完成后）
- `src/lib/email.ts` + `src/lib/email/` — 扩展为模板系统（Sprint 2）
- `src/app/api/webhooks/creem/route.ts` — 补充 PostHog + Resend 调用（Sprint 1-2）
- `src/app/api/skills/execute/route.ts` — 补充 PostHog 追踪（Sprint 1）
- `prisma/schema.prisma` — 新增 ApiKey、GoogleAdsConnection、MetaAdsConnection、knowledge_base（Sprint 3,5,6,7）
- `src/app/api/mcp/route.ts` — 新建（Sprint 5）

**新增依赖**

- `@aws-sdk/client-s3` + `@aws-sdk/lib-storage` — MinIO/S3 存储（Sprint 0）
- `posthog-node` — 服务端 PostHog（Sprint 1）
- `@modelcontextprotocol/sdk` — MCP Server（Sprint 5）

**无需改动**

- `better-auth` 认证体系（完全独立于 Supabase）
- `prisma/schema.prisma` 现有模型（只新增，不修改）
- n8n、CLIProxyAPI（继续使用）

## Non-Goals

- 不评估 InsForge（3-6 个月后重新评估）
- 不引入 LiteLLM（业务量增长后触发）
- 不做深色模式
- 不重构现有 Site Intelligence 核心逻辑
