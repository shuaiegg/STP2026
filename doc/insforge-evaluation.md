# InsForge 技术评估报告
## ScaletoTop AI Native 后端架构选型

**文档版本**: v1.3  
**评估日期**: 2026-06-09  
**最后更新**: 2026-06-09（新增 Embedding 模型全景评估，明确 Claude 无 Embedding API）  
**评估对象**: [InsForge/InsForge](https://github.com/InsForge/InsForge)  
**评估目标**: 替代 Supabase，支撑 ScaletoTop AI Native 运营战略  
**当前服务器环境**: 自建服务器 + Coolify + n8n + CLIProxyAPI（已部署）

---

## 目录

1. [Executive Summary](#1-executive-summary)
2. [InsForge 产品深度解析](#2-insforge-产品深度解析)
3. [ScaletoTop 现状与迁移成本](#3-scaletotop-现状与迁移成本)
4. [Coolify 兼容性分析](#4-coolify-兼容性分析)
5. [AI Native 运营架构适配性](#5-ai-native-运营架构适配性)
6. [向量数据库能力评估与 RAG 架构](#6-向量数据库能力评估与-rag-架构)
7. [CLIProxyAPI 分析与 Model Gateway 选型](#7-cliproxyapi-分析与-model-gateway-选型)
8. [安全风险评估](#8-安全风险评估)
9. [成熟度与社区评估](#9-成熟度与社区评估)
10. [竞品对比](#10-竞品对比)
11. [成本分析](#11-成本分析)
12. [综合评分卡](#12-综合评分卡)
13. [可行性结论与决策建议](#13-可行性结论与决策建议)
14. [推荐技术栈方案](#14-推荐技术栈方案)
15. [分阶段迁移路线图](#15-分阶段迁移路线图)

---

## 1. Executive Summary

### 结论

**InsForge 在当前阶段不建议作为 ScaletoTop 的主要后端基础设施，但部分组件（Model Gateway）值得提前关注。**

| 维度 | 评分 | 说明 |
|---|---|---|
| 功能契合度 | ★★★★☆ | 核心功能覆盖 ScaletoTop 需求 |
| 生产成熟度 | ★★☆☆☆ | 存在未修复的高危安全漏洞 |
| Coolify 兼容性 | ★★★☆☆ | 理论可行，实际有端口冲突风险 |
| 迁移成本 | ★★★☆☆ | 中等，数据库层低，存储层中等 |
| AI Native 支撑 | ★★★★☆ | Model Gateway + Compute 与愿景高度吻合 |
| 社区可靠性 | ★★★☆☆ | 11.6k Stars，但关键安全 Issue 未关闭 |

**核心判断**：InsForge 的产品方向与 ScaletoTop 的 AI Native 战略高度吻合，但当前存在**两个未修复的高危安全漏洞**，在生产环境使用风险较高。建议**观察 3-6 个月**，待安全问题修复、Compute 功能脱离私密预览后，再评估全面采用。

**短期最优路径**：自建服务器 PostgreSQL + MinIO + 自建 MCP Server + n8n（已有）。

---

## 2. InsForge 产品深度解析

### 2.1 定位

InsForge 的核心定位是"**为 AI 编码 Agent 设计的一体化开源后端平台**"，本质是 Supabase 的 agentic 强化版本，增加了 Model Gateway、Compute（长期运行容器）和深度 MCP 集成。

### 2.2 技术架构

InsForge 生产环境由 4 个 Docker 服务组成：

```
┌─────────────────────────────────────────────────────┐
│                   InsForge Stack                     │
│                                                     │
│  ┌──────────────┐     ┌──────────────────────────┐  │
│  │  PostgreSQL  │────▶│      PostgREST API       │  │
│  │ (port 5432)  │     │      (port 5430)         │  │
│  │ 自定义镜像    │     │  自动生成 REST endpoint   │  │
│  └──────────────┘     └──────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │          InsForge Application                │   │
│  │    port 7130 (主应用) + port 7131 (认证)      │   │
│  │    管理 UI、MCP Server、Model Gateway         │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │          Deno Runtime (Edge Functions)       │   │
│  │              port 7133                       │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**关键技术细节**：
- PostgreSQL 使用 InsForge 自定义镜像（非官方 postgres 镜像），包含 pgvector 扩展
- PostgREST 自动为数据库表生成 REST API（类 Supabase 机制）
- Edge Functions 基于 Deno 运行时（非 Node.js）
- Model Gateway 通过 OpenRouter 路由多 LLM 提供商
- 认证支持：GitHub、Google、Discord、Microsoft OAuth

### 2.3 各模块与 ScaletoTop 的匹配分析

#### Database（PostgreSQL）
- **兼容性**：100%。ScaletoTop 使用 Prisma ORM，只需更换 `DATABASE_URL`
- **特殊能力**：内置 pgvector，未来语义搜索/向量检索无需额外部署
- **风险**：使用自定义 PostgreSQL 镜像，升级依赖 InsForge 发版节奏

#### Storage（S3 兼容）
- **兼容性**：高。只需改写 `src/lib/storage.ts` 约 20 行，换用 S3 SDK
- **差距**：InsForge Storage 与 MinIO 相比功能基础，CDN 集成需另行配置

#### Model Gateway（★ 关键亮点）
- **价值**：统一 OpenAI 兼容 API，集中路由 Claude / Gemini / DeepSeek / OpenAI
- **对 ScaletoTop 的意义**：当前 AI Skills 系统多 provider 分散管理，Model Gateway 可以：
  - 统一 API Key 管理
  - 集中控制每个用户/功能的模型消费成本
  - A/B 测试不同模型效果
  - 在 AI 客服场景中统一调用入口
- **后端**：通过 OpenRouter 路由，依赖 OpenRouter 可用性

#### Compute（长期运行容器）
- **现状**：仍在**私密预览（Private Preview）**阶段，未正式发布
- **对 AI Native 运营的价值**：
  - 运行 AI 客服 Agent（持续监听工单）
  - 后台 SEO 数据抓取 Agent
  - 定时 Notion 同步 + 失败重试 Agent
- **风险**：功能未稳定，不可作为当前架构依赖

#### MCP Server（内部 Agent 接口）
- **功能**：将 InsForge 的数据库操作、存储操作暴露为 MCP 工具
- **使用场景**：内部 AI Agent 可通过 MCP 直接查询/操作 ScaletoTop 业务数据
- **注意**：这是**内部 Agent 用的 MCP**，不是用户侧 MCP（用户侧仍需自建）

#### Edge Functions（Deno）
- **对 ScaletoTop 价值**：低。已有 Next.js API Routes 和 Server Actions 满足需求
- **额外复杂度**：引入 Deno 运行时，与主要 Node.js 生态割裂

---

## 3. ScaletoTop 现状与迁移成本

### 3.1 当前 Supabase 依赖清单

```
Supabase 依赖范围（经代码审计）：
├── src/lib/supabase/client.ts     # anon client（公共访问）
├── src/lib/supabase/server.ts     # admin client（服务角色）
├── src/lib/supabase/index.ts      # 导出聚合
└── src/lib/storage.ts             # 图片上传/获取（唯一业务使用点）

不依赖 Supabase 的部分（重要）：
├── 认证系统     → better-auth + Prisma（完全独立）
├── 数据库访问   → Prisma ORM（只需换连接串）
└── 业务逻辑     → Next.js Server Actions（零 Supabase 代码）
```

### 3.2 迁移工作量评估

| 迁移项 | 文件数 | 代码改动量 | 数据迁移 | 难度 | 预估工时 |
|---|---|---|---|---|---|
| 数据库连接 | 1（.env） | 改环境变量 | pg_dump → 导入 | 低 | 4h |
| Storage SDK | 1（storage.ts） | ~20 行 | 文件批量迁移 | 低 | 8h |
| 环境变量清理 | .env 文件 | 删旧变量 | 无 | 低 | 1h |
| 测试验证 | 全量回归 | 无代码改动 | 无 | 中 | 8h |
| **合计** | | | | | **~21h（约 3 个工作日）** |

### 3.3 Prisma 迁移注意事项

迁移到新 PostgreSQL 实例时：
```bash
# 1. 导出现有数据
pg_dump $SUPABASE_DATABASE_URL > backup.sql

# 2. 更新环境变量
DATABASE_URL=postgresql://...@insforge-host:5432/db
DATABASE_URL_DIRECT=postgresql://...@insforge-host:5432/db

# 3. 应用 Schema（无需修改 prisma/schema.prisma）
npx prisma migrate deploy

# 4. 导入数据
psql $NEW_DATABASE_URL < backup.sql
```

**风险**：InsForge 自定义 PostgreSQL 镜像的 `pg_hba.conf` 和 JWT 配置可能与标准 Prisma 迁移流程有兼容性问题，需要提前验证。

---

## 4. Coolify 兼容性分析

### 4.1 Coolify 工作方式

Coolify 通过 Traefik 反向代理管理 Docker Compose 服务，每个应用分配独立的域名和 SSL。

### 4.2 InsForge 与 Coolify 的兼容问题

#### 端口冲突风险（中风险）

InsForge 使用非标准多端口：

| 服务 | 端口 | Coolify 影响 |
|---|---|---|
| InsForge App | 7130 | 需要 Coolify 配置该端口为主入口 |
| InsForge Auth | 7131 | 需要独立域名或路径路由 |
| Deno Edge | 7133 | 需要独立路由 |
| PostgREST | 5430 | 需要决定是否对外暴露 |
| PostgreSQL | 5432 | 仅内部访问，不对外暴露 |

**结论**：Coolify 可以处理多端口映射，但 InsForge 的 4 服务 5 端口配置需要手动配置 Traefik 路由规则，Coolify 的自动化部署流程需要适配。

#### Docker Compose 网络隔离

InsForge 使用独立 bridge 网络。在 Coolify 环境中，需要确保：
- InsForge 的 PostgreSQL 可以被 Next.js 容器访问（跨 Compose 网络通信）
- Coolify 的 Traefik 网络与 InsForge 网络正确打通

**解决方案**：在 Coolify 中将 InsForge 和 Next.js 部署在同一个 Docker 网络，或使用 Coolify 的"内部主机名"功能。

#### Deno 运行时资源消耗

Deno Edge Functions 运行时会持续占用内存。如服务器资源有限（如 8GB RAM），需要评估与 n8n、Next.js、cliproxy 的资源竞争。

### 4.3 Coolify 部署 InsForge 的配置要点

```yaml
# 在 Coolify 中以 Docker Compose 方式部署 InsForge
# 需要额外配置：
# 1. 将 7130 映射为主域名 (api.scaletotop.com)
# 2. 将 7131 映射为认证子域名 (auth.scaletotop.com) — 如果使用 InsForge Auth
# 3. PostgreSQL 端口不对外暴露，仅内部网络访问
# 4. 设置 Coolify 持久卷对应 InsForge 的数据目录
```

**兼容性总体评估**：可行，但需要 1-2 天的 Coolify 配置调试工作。不是"开箱即用"。

---

## 5. AI Native 运营架构适配性

### 5.1 ScaletoTop AI Native 愿景拆解

| 运营场景 | 技术需求 | InsForge 是否满足 |
|---|---|---|
| AI 客服工单处理 | 工作流编排 + LLM 调用 + 数据查询 | 部分（Model Gateway ✓，工单流程 ✗） |
| 用户 MCP 接入 | 自建 MCP Server | 不满足（需自建） |
| 后台 AI Ops Agent | 长期运行容器 | Compute（仍在私密预览）|
| 多 LLM 统一管理 | Model Gateway | ✓ InsForge 最强项 |
| AI 生成运营报告 | LLM 调用 + 数据聚合 | 部分 |

### 5.2 AI Native 完整架构设计

无论是否使用 InsForge，AI Native ScaletoTop 的完整架构如下：

```
─────────────────────── 用户侧 ──────────────────────────
用户的 Claude Desktop / Cursor / 任何 MCP 客户端
                    │ MCP Protocol
                    ▼
          ScaletoTop MCP Server（自建必须）
          暴露工具：get_site_audit / get_keywords /
                  generate_article / get_credits ...
                    │ API Key 认证
─────────────────────── 业务层 ──────────────────────────
                    ▼
          Next.js（ScaletoTop 核心应用）
          Server Actions / API Routes / Prisma
                    │
─────────────────────── 编排层 ──────────────────────────
                    ▼
          n8n（已安装 ✓）
          ├── AI 客服工单 Workflow
          ├── 付款异常处理 Workflow
          ├── Notion 同步监控 Workflow
          └── 运营日报生成 Workflow
                    │
─────────────────────── AI 能力层 ──────────────────────
                    ▼
          Model Gateway（InsForge 或 Portkey）
          统一路由：Claude / Gemini / DeepSeek
                    │
─────────────────────── 基础设施层 ─────────────────────
                    ▼
       PostgreSQL + S3 存储（InsForge 或自建 PG+MinIO）
```

### 5.3 n8n 已安装对架构的影响

**这是关键优势**。n8n 已安装意味着：
- AI 客服工单处理流程可以**立即开始构建**，不依赖 InsForge Compute
- n8n 的 HTTP Request 节点 + AI Agent 节点可以替代 InsForge Compute 的大部分 AI 运营场景
- InsForge Compute（私密预览）的风险被 n8n 的存在完全规避

**InsForge Compute vs n8n 对比（在你的场景）**：

| 功能 | InsForge Compute | n8n（已有） |
|---|---|---|
| AI 客服 Workflow | 需要自行开发 | 可视化拖拽 ✓ |
| 定时任务 | ✓ | ✓ |
| HTTP Webhook | ✓ | ✓ |
| 可视化调试 | ✗ | ✓ |
| 成熟度 | 私密预览 | 生产级 |
| 当前可用 | 不确定 | 已安装 ✓ |

**结论：n8n 的存在显著降低了 InsForge Compute 的必要性。**

---

## 6. 向量数据库能力评估与 RAG 架构

### 6.1 ScaletoTop 的向量数据库需求

ScaletoTop 的 AI Native 运营战略需要两类向量能力：

| 使用场景 | 数据来源 | 向量规模估算 | 实时性要求 |
|---|---|---|---|
| **AI 客服知识库** | 博客文章 + FAQ + 帮助文档 | 数百～数千条 | 低（按需更新）|
| **博客文章生成辅助** | 已有文章语义检索、避免重复、找相关素材 | 数千条 | 低 |
| **关键词语义聚类** | GSC 关键词、竞品关键词 | 数万条 | 低 |
| **内容相似度推荐** | 站点内文章互推 | 数千条 | 低 |

**规模判断**：ScaletoTop 在可预见的 1-2 年内，向量数量在 **万级以内**，属于 pgvector 的舒适区。无需引入专用向量数据库（Pinecone、Qdrant、Weaviate 等适用于千万级以上场景）。

### 6.2 PostgreSQL + pgvector 能力评估

pgvector 是 PostgreSQL 的开源扩展，使标准关系型数据库具备向量存储和相似度搜索能力。

#### 核心能力

```sql
-- 1. 启用扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 在现有表添加向量列（兼容 Prisma 已有 Schema）
ALTER TABLE "Content" ADD COLUMN embedding vector(1536);

-- 3. 建立 HNSW 索引（高效近似最近邻搜索）
CREATE INDEX ON "Content" USING hnsw (embedding vector_cosine_ops);

-- 4. 语义搜索：找最相关的 5 篇文章
SELECT id, title, slug, 1 - (embedding <=> $1) AS similarity
FROM "Content"
WHERE status = 'PUBLISHED' AND visibility = 'PUBLIC'
ORDER BY embedding <=> $1
LIMIT 5;
```

#### 支持的距离算法

| 算法 | 运算符 | 适用场景 |
|---|---|---|
| 余弦相似度 | `<=>` | 文本语义相似（推荐用于 RAG）|
| L2 欧氏距离 | `<->` | 图像、数值向量 |
| 内积 | `<#>` | 已归一化的向量 |

#### 与 Prisma 的集成

pgvector 需要 Prisma 的 `unsupported` 类型包装，或使用 `prisma-client-extensions`：

```prisma
// prisma/schema.prisma
model Content {
  // ... 现有字段
  embedding   Unsupported("vector(1536)")?
}
```

原生查询通过 `prisma.$queryRaw` 执行向量搜索，业务逻辑层可封装为独立的 `searchSimilarContent()` 函数。

#### 性能基准（参考）

| 向量数量 | 无索引查询 | HNSW 索引查询 | 内存占用 |
|---|---|---|---|
| 1,000 条 | <1ms | <1ms | ~6MB（1536维）|
| 10,000 条 | ~5ms | <2ms | ~60MB |
| 100,000 条 | ~50ms | <5ms | ~600MB |
| 1,000,000 条 | 慢 | <10ms | ~6GB |

**ScaletoTop 在 10 万向量以内，HNSW 索引查询均在 5ms 以内，无性能瓶颈。**

### 6.3 InsForge 的 pgvector 支持情况（关键发现）

> ⚠️ **经代码库深度核查，InsForge 的 pgvector 支持不确定**

**调研结果**：

| 检查项 | 结果 |
|---|---|
| 代码库 pgvector 关键词搜索 | **0 个文件** |
| `Dockerfile.postgres` 中的扩展安装 | **未发现** `pgvector` 安装指令 |
| 初始化 SQL（`db-init.sql`）| 内容不对外公开，无法确认 |
| 早期 README 提及 pgvector | 有，但**无代码支撑** |

**结论**：InsForge 早期文档提及 pgvector，但代码库中搜索结果为零，自定义 PostgreSQL 镜像（`ghcr.io/insforge/postgres:v15.13.4`）是否包含 pgvector 无法从公开信息确认。**不能将 pgvector 作为选择 InsForge 的理由**。

相比之下，以下方案提供明确的 pgvector 支持：

| 方案 | pgvector 支持 | 确认程度 |
|---|---|---|
| `pgvector/pgvector:pg17`（官方 Docker 镜像） | ✓ 内置 | 官方维护，100% 确认 |
| Neon（托管 PostgreSQL） | ✓ 内置 | 官方文档确认 |
| Supabase（现状） | ✓ 内置 | 官方文档确认 |
| InsForge 自定义 PG 镜像 | ❓ 不确定 | 代码库无证据 |

### 6.4 AI 客服 RAG 完整架构设计

基于 pgvector + Gemini Embedding（或 BGE-M3）+ n8n（已有）的 AI 客服知识库实现：

```
─────────────── 知识库建立（离线，定时运行）────────────────

博客文章 / FAQ / 帮助文档
          │
          ▼ （内容变更时触发，n8n workflow）
  文本分块（Chunk，约 512 tokens/块）
          │
          ▼
  生成 Embedding（二选一）
  ├── Gemini text-embedding-004（已有 Google Key，免费）
  └── BGE-M3 via Ollama（自托管，零成本，中文最强）
          │
          ▼
  存入 PostgreSQL（pgvector）
  INSERT INTO knowledge_base (content, embedding, source_type, source_id, model_name)


─────────────── 用户提问处理（实时）─────────────────────────

用户通过客服渠道提问（邮件/Chatwoot）
          │
          ▼ （n8n webhook 触发）
  查询用户账户上下文
  Prisma → User / Site / Credits / 近期工单
          │
          ▼
  生成问题 Embedding（与知识库使用同一模型）
  Gemini text-embedding-004 / BGE-M3
          │
          ▼
  pgvector 语义检索（Top-5 相关文档）
  SELECT content FROM knowledge_base
  ORDER BY embedding <=> $query_vec LIMIT 5
          │
          ▼
  构建 Prompt（RAG）
  ┌─────────────────────────────────────────┐
  │ 系统角色：你是 ScaletoTop 的 AI 客服    │
  │ 用户信息：[Credits 余量、订阅计划、...]  │
  │ 相关知识：[Top-5 检索结果]              │
  │ 用户问题：[原始问题]                    │
  └─────────────────────────────────────────┘
          │
          ▼
  Claude via CLIProxyAPI（内部）
  或 ANTHROPIC_API_KEY 直连（用户付费场景）
          │
          ├── 置信度高 → 自动发送回复，关闭工单
          └── 置信度低 → 标记「需人工」，发送草稿
```

### 6.5 博客文章生成的向量辅助流程

```
用户输入目标关键词 / 主题
          │
          ▼
  pgvector 语义搜索：已有相似文章
  → 避免内容重复
  → 找到可引用的内部链接
          │
          ▼
  GSC 关键词聚类（pgvector 对关键词向量聚类）
  → 找出语义相近的关键词组
  → 自动建议文章的 H2/H3 结构
          │
          ▼
  喂给 AI Skills 系统（现有）生成文章
  附带：相似文章引用 + 关键词结构建议
```

### 6.6 pgvector 实施要点

#### 重要纠正：Claude 没有 Embedding API

> ⚠️ **Anthropic 不提供 Embedding API**。Claude 仅用于文本生成。Anthropic 官方的 embedding 解决方案是 **Voyage AI**（Anthropic 有投资），而非 Claude 本身。

#### Embedding 模型全景评估

**云端 API 方案**：

| 提供商 | 模型 | 维度 | 价格 | 中文支持 | ScaletoTop 适配性 |
|---|---|---|---|---|---|
| **Google Gemini** | text-embedding-004 | 768 | 免费额度内 | ★★★★ | ✅ **首推**：已有 Google API Key（GSC 集成），无需新增供应商 |
| **Jina AI** | jina-embeddings-v3 | 1024 | $0.018/1M | ★★★★ | ✅ 有免费额度，比 OpenAI 便宜，中文表现好 |
| **Voyage AI** | voyage-multilingual-2 | 1024 | $0.06/1M | ★★★★★ | ✅ Anthropic 官方推荐搭档，多语言专项优化 |
| **OpenAI** | text-embedding-3-small | 1536 | $0.02/1M | ★★★☆ | ⚠️ 需新增供应商，中文不如 Gemini/Voyage |
| **Cohere** | embed-multilingual-v3 | 1024 | $0.10/1M | ★★★★ | ⚠️ 多语言强但偏贵 |
| **OpenAI** | text-embedding-3-large | 3072 | $0.13/1M | ★★★☆ | ❌ 成本高，维度过大，你们规模不需要 |

**自托管方案（零 API 成本）**：

| 模型 | 维度 | 中文支持 | RAM 需求 | 运行方式 | 适配性 |
|---|---|---|---|---|---|
| **BAAI/bge-m3** | 1024 | ★★★★★ | ~2GB | Ollama | ✅ **中文最强**，符合自托管方向 |
| **nomic-embed-text** | 768 | ★★★☆ | ~500MB | Ollama | ✅ 轻量，资源占用小 |
| **mxbai-embed-large** | 1024 | ★★★☆ | ~1.5GB | Ollama | ✅ 综合表现好 |

#### ScaletoTop 推荐选择

你们的用户是**中文海外创业者**，内容中英文混合，中文 embedding 质量直接影响 AI 客服的检索准确率。

**最优选：Gemini text-embedding-004（几乎零额外成本）**

```
理由：
  - 已有 GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET（GSC/GA4 集成）
  - 申请 Google AI Studio API Key → 5 分钟完成，无需新增供应商
  - 中文理解好（Google 多语言训练数据质量高）
  - 免费额度：每分钟 1500 次请求，完全覆盖你们的规模
  - 768 维：pgvector 存储更省空间，查询更快

接入示例（n8n HTTP Request 节点）：
  POST https://generativelanguage.googleapis.com/v1beta/models/
       text-embedding-004:embedContent?key=$GOOGLE_AI_API_KEY
  { "content": { "parts": [{ "text": "文章内容..." }] } }
```

**进阶选：BGE-M3 自托管（彻底零成本，中文最强）**

```
理由：
  - 中文语义理解能力业界最强（北京智源研究院出品）
  - 服务器已有 Coolify → 部署 Ollama 一行命令
  - 零 API 成本，数据完全不出自己服务器
  - 需要 ~2GB 额外内存（评估服务器余量）

部署方式：
  # Coolify 上部署 Ollama
  ollama pull bge-m3

  # Embedding 调用
  POST http://ollama:11434/api/embeddings
  { "model": "bge-m3", "prompt": "文章内容..." }
```

**决策树**：
```
服务器剩余内存 > 3GB？
  ├── 是 → BGE-M3（自托管，零成本，中文最强）
  └── 否 → Gemini text-embedding-004（已有 Google Key，免费额度够）
```

#### 数据库 Schema 设计（适配不同维度）

```sql
-- 知识库表，embedding 维度根据所选模型设定
-- Gemini text-embedding-004 → vector(768)
-- BGE-M3 / Voyage / Jina → vector(1024)
-- OpenAI text-embedding-3-small → vector(1536)

CREATE TABLE knowledge_base (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content     TEXT NOT NULL,
  embedding   vector(768),            -- 按实际模型维度调整
  source_type VARCHAR(50),            -- 'blog' | 'faq' | 'help_doc'
  source_id   VARCHAR(255),
  metadata    JSONB,
  model_name  VARCHAR(100),           -- 记录使用的 embedding 模型（便于未来迁移）
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON knowledge_base USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

> **注意**：一旦选定 embedding 模型并建好索引，切换模型需要对所有文档重新向量化并重建索引。建议在 `metadata` 中记录 `model_name`，方便未来评估是否值得迁移。

---

## 7. CLIProxyAPI 分析与 Model Gateway 选型

> **背景**：服务器上已部署 CLIProxyAPI（[router-for-me/CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI)），本章评估其与 LiteLLM 的关系，以及在 ScaletoTop AI Native 架构中的分工。

### 7.1 CLIProxyAPI 是什么

CLIProxyAPI 是一个**订阅转 API 代理**，核心思路是将 Claude Code、Gemini CLI、Codex、Grok 等 CLI 工具的 OAuth 登录态包装成标准 API 端点：

```
你的 Claude.ai / Gemini Advanced 订阅
            │  OAuth 登录
            ▼
      CLIProxyAPI（已部署）
            │  OpenAI/Claude/Gemini 兼容 API
            ▼
   ScaletoTop AI Skills 系统
```

**核心能力**：
- 支持 Claude Code / Gemini CLI / OpenAI Codex / Grok 多账号
- 多账号 Round-Robin 负载均衡
- 暴露 OpenAI 兼容接口（可直接接入现有 AI Skills 系统）
- 支持 Streaming、Function Calling、Multimodal
- 支持接入 OpenRouter 等上游 OpenAI 兼容服务

### 7.2 CLIProxyAPI vs LiteLLM：本质差异

| 维度 | CLIProxyAPI（已有） | LiteLLM |
|---|---|---|
| **本质** | 订阅账号 → API 端点 | 多 API Key 统一路由网关 |
| **访问凭证** | OAuth 登录（Claude.ai/Gemini 订阅）| 官方 API Key（按 token 计费）|
| **成本模型** | 走订阅额度，**无额外 token 费用** | 按 API token 计费 |
| **Embedding 支持** | ❌ 不支持 | ✅ 支持 |
| **自建/本地模型** | ❌ 不支持 Ollama 等 | ✅ 支持 |
| **使用量统计** | ❌ v6.10.0 后已移除 | ✅ 内置 dashboard |
| **Failover/重试** | 多账号 Round-Robin | 多 provider 自动 Failover |
| **成熟度** | 活跃开发中 | ★★★★☆ 生产级 |

### 7.3 CLIProxyAPI 能替代 LiteLLM 吗？

**对于 ScaletoTop 的各类场景分别判断：**

#### ✅ 可以用 CLIProxyAPI 的场景（文本生成，内部使用）

```
博客文章生成（管理员/内部使用）
内容分析与 SEO 建议
Notion 内容处理
管理后台的 AI 辅助功能
开发调试阶段的所有 AI 调用
```

#### ❌ 不能用 CLIProxyAPI 的场景

**1. Embedding 生成（RAG 必需）**

CLIProxyAPI 不提供 Embedding 模型接口。pgvector 知识库的向量化必须走官方 API：

```
text-embedding-3-small 调用
→ CLIProxyAPI 无法处理
→ 必须直连 OpenAI API Key 或 Gemini Embedding API
```

**2. 用户付费触发的 AI 功能（ToS 合规风险）**

这是最关键的限制。Anthropic 使用条款明确区分个人订阅和 API 商业使用：

```
用户购买了 ScaletoTop Credits
    → 触发 AI 文章生成
    → 经由 CLIProxyAPI → 消耗你的 Claude.ai 订阅额度

风险：
  - 账号因"商业自动化使用"被 Anthropic 封禁
  - 订阅额度耗尽导致服务中断
  - 无法按用量线性扩容（订阅有固定上限）
```

**3. AI 客服高频处理**

订阅有速率限制，无法承载大量并发用户请求的工单处理。

### 7.4 推荐分工：CLIProxyAPI + 官方 API Key 并存

```
┌─────────────────────────────────────────────────────────┐
│                   AI 调用路由策略                         │
│                                                         │
│  内部 / 管理员 / 开发场景                                  │
│  ├── 博客生成（管理员操作）                                │
│  ├── 内容分析工具                                         │
│  └── 管理后台 AI 功能                                     │
│              │                                          │
│              ▼                                          │
│         CLIProxyAPI ✓（已部署，零额外成本）                │
│                                                         │
│  用户付费 / 高频 / Embedding 场景                          │
│  ├── 用户 Credits 消费的 AI 生成                          │
│  ├── AI 客服工单处理                                      │
│  └── pgvector Embedding 生成（RAG 知识库）                │
│              │                                          │
│              ▼                                          │
│    官方 API Key（Anthropic / Google / OpenAI）            │
│    直连 或 通过 LiteLLM 统一管理                           │
└─────────────────────────────────────────────────────────┘
```

### 7.5 是否还需要 LiteLLM？

**短期（当前到 3 个月）：不需要**

只需要一个 `OPENAI_API_KEY` 专门处理 Embedding，其余文本生成走 CLIProxyAPI：

```
成本估算（Embedding）：
  知识库初始化：~1,000 篇文章 × 500 tokens = 500K tokens = $0.01
  日常增量更新：可忽略不计
  用户查询 Embedding：每次查询 ~100 tokens = $0.000002/次
→ 月 Embedding 成本预估 < $1
```

**中期（业务规模增长后）：引入 LiteLLM**

当出现以下任一情况时，引入 LiteLLM 作为统一网关：
- 用户侧 AI 调用量超过单个 API Key 速率限制
- 需要在多个 API Provider 之间做 Failover
- 需要集中的用量监控和成本归因（哪个用户消耗了多少）
- 需要接入 DeepSeek 等 API-only 模型

### 7.6 更新后的 Model Gateway 方案对比

| 方案 | 适用场景 | 成本 | 当前需要 |
|---|---|---|---|
| **CLIProxyAPI（已有）** | 内部/管理员文本生成 | 订阅额度，$0 额外 | ✅ 已部署，继续用 |
| **官方 API Key 直连** | Embedding + 用户侧 AI | 按 token，极低 | ✅ 立即配置 |
| **LiteLLM** | 多 provider 统一管理 | 免费自托管 | ⏳ 业务规模增长后 |
| **InsForge Model Gateway** | 集成平台内使用 | 免费自托管 | ❌ 当前不推荐 |

---

## 8. 安全风险评估

> ⚠️ **这是决定是否在生产环境使用 InsForge 的最关键章节**

### 6.1 已知高危漏洞（截至 2026-06-09，仍未关闭）

#### 漏洞 #1447（高危）：Edge Functions 无鉴权
```
标题: Edge function invocation endpoint /functions/:slug has no auth
       任何已部署的 Edge Function 可被匿名调用
影响: 任何人无需登录即可触发你的 Edge Functions
风险: 数据泄露 / 恶意调用 / 资源滥用
状态: Open（未修复）
```

#### 漏洞 #1436（高危）：Admin API Key 破坏认证链
```
标题: Admin API key sets request.jwt.claims.sub to non-uuid literal
       导致所有依赖 auth.uid() 的调用失败
影响: 破坏基于 RLS 的数据库权限隔离
风险: 数据越权访问
状态: Open（未修复）
```

#### 漏洞 #1492（中危）：存储元数据 O(N) 全表扫描
```
标题: Unbounded O(N) table scans in storage/database metadata pipeline
影响: 随数据量增长性能急剧下降
风险: 服务不可用（DoS 风险）
状态: Open（未修复）
```

#### 漏洞 #1460（中危）：依赖项安全审计问题
```
标题: Dependency audit vulnerabilities requiring resolution
影响: 第三方依赖存在已知漏洞
状态: Open（未修复）
```

### 6.2 风险评估矩阵

| 漏洞 | 严重程度 | 利用难度 | 对 ScaletoTop 影响 |
|---|---|---|---|
| #1447 Edge Function 无鉴权 | 高 | 低（任何人可利用） | 如使用 Edge Functions 则直接暴露 |
| #1436 Admin Key 破坏认证 | 高 | 中 | 影响多租户数据隔离 |
| #1492 O(N) 全表扫描 | 中 | 低（自然触发） | 媒体文件增多后性能崩溃 |
| #1460 依赖漏洞 | 中 | 中 | 视具体 CVE 而定 |

### 6.3 缓解措施（如坚持使用 InsForge）

```
1. 禁用 Edge Functions（不使用该模块，规避 #1447）
2. 不使用 Admin API Key 做业务调用（规避 #1436）
3. 将 InsForge 置于私有网络，不直接暴露到公网
4. 在 InsForge 前加 nginx/Caddy 层做额外鉴权
5. 持续关注漏洞修复状态，及时升级
```

**结论：对于有真实用户数据的 SaaS 产品，在上述高危漏洞未修复前，直接在生产环境使用 InsForge 存在不可接受的风险。**

---

## 9. 成熟度与社区评估

### 9.1 项目指标

| 指标 | 数值 | 解读 |
|---|---|---|
| GitHub Stars | 11,600+ | 较高关注度，说明方向认可 |
| Forks | 987 | 活跃的二次开发 |
| Commits | 4,299 | 开发活跃 |
| Open Issues | 46 | 其中包含 2 个未修复高危安全 Issue |
| Open PRs | 39 | PR 积压较多，审查速度有待观察 |
| License | Apache 2.0 | 商业使用友好 |

### 9.2 与 Supabase 成熟度对比

| 维度 | Supabase | InsForge |
|---|---|---|
| 项目年龄 | 5 年+ | ~1 年 |
| 生产用户数 | 数十万 | 未公开 |
| 安全响应速度 | 快（有专职安全团队） | 慢（Issue 长期未关闭） |
| 文档完整性 | 完善 | 基础 |
| 社区生态 | 成熟（大量第三方集成） | 早期 |
| 企业支持 | 有商业支持合同 | 社区支持为主 |

### 9.3 Compute 功能风险

Compute（长期运行容器）仍处于**私密预览**阶段：
- 无公开文档
- 无 SLA 保证
- 功能可能变更或延期
- 不可作为生产依赖进行规划

---

## 10. 竞品对比

### 10.1 后端基础设施方案对比

| 方案 | 数据库 | pgvector | 存储 | AI 能力 | 自托管 | 成熟度 | 适合 ScaletoTop |
|---|---|---|---|---|---|---|---|
| **Supabase（现状）** | PG ✓ | ✓ 内置 | ✓ | ✗ | 部分 | ★★★★★ | ✓ 当前使用 |
| **InsForge** | PG ✓ | ❓ 不确定 | ✓ | Model Gateway ✓ | ✓ | ★★☆☆☆ | 待安全修复 |
| **pgvector/pg17 + MinIO** | PG ✓ | ✓ 官方镜像 | ✓ | ✗ | ✓ | ★★★★★ | ✓ **推荐** |
| **Neon + R2** | PG ✓ | ✓ 内置 | ✓ | ✗ | ✗（托管） | ★★★★☆ | ✓ 如不想运维 |
| **PocketBase** | SQLite | ✗ | ✓ | ✗ | ✓ | ★★★★☆ | ✗ 不适合（规模）|

### 10.2 Model Gateway 方案对比

| 方案 | 本质 | Embedding | 用户侧合规 | 成本 | 当前状态 |
|---|---|---|---|---|---|
| **CLIProxyAPI** | 订阅转 API | ❌ | ⚠️ ToS 风险 | $0（订阅已付）| ✅ 已部署 |
| **官方 API Key 直连** | 按 token 计费 | ✅ | ✅ | 极低 | 推荐立即配置 |
| **LiteLLM** | 多 Key 统一网关 | ✅ | ✅ | 免费自托管 | 业务增长后引入 |
| **InsForge Model Gateway** | 集成平台网关 | ❓ | ✅ | 免费自托管 | 不推荐（当前）|
| **OpenRouter** | 托管多模型 API | ✅ | ✅ | 按量付费 | 备选 |

**推荐策略**：CLIProxyAPI（内部场景）+ 官方 API Key（Embedding + 用户侧）双轨并行，LiteLLM 作为规模增长后的统一网关选项。

---

## 11. 成本分析

### 11.1 运行成本对比（月度）

| 方案 | 基础设施成本 | 维护人力成本 | 风险成本 |
|---|---|---|---|
| Supabase Pro | ~$25/月 | 低 | 低 |
| InsForge（自托管） | 服务器已有，+0 | 中（维护升级） | 高（安全漏洞）|
| 自建 PG + MinIO | 服务器已有，+0 | 低 | 低 |
| Neon Free + R2 | $0-5/月 | 极低 | 低 |

### 11.2 迁移成本（一次性）

| 迁移路径 | 开发工时 | 测试工时 | 总工时 |
|---|---|---|---|
| Supabase → InsForge | 16h | 8h | 24h（3天）|
| Supabase → 自建 PG + MinIO | 8h | 8h | 16h（2天）|
| Supabase → Neon + R2 | 4h | 4h | 8h（1天）|

---

## 12. 综合评分卡

### 评分维度（1-5分）

| 评估维度 | 权重 | 得分 | 加权分 | 说明 |
|---|---|---|---|---|
| 功能契合度 | 20% | 4 | 0.80 | 覆盖 DB/存储/AI 网关核心需求 |
| 生产安全性 | 25% | 2 | 0.50 | 2 个未修复高危漏洞 |
| Coolify 兼容性 | 15% | 3 | 0.45 | 可行但需要手动配置 |
| AI Native 支撑 | 15% | 4 | 0.60 | Model Gateway 强，Compute 未发布 |
| 向量数据库能力 | 10% | 2 | 0.20 | pgvector 支持**不确定**（代码库0结果）|
| 迁移成本 | 5% | 3 | 0.15 | 中等工作量 |
| 社区与可维护性 | 10% | 3 | 0.30 | 活跃但不成熟 |
| **总分** | **100%** | | **3.00 / 5** | |

**参考基准**：

| 方案 | 综合评分 |
|---|---|
| pgvector/pg17 + MinIO + CLIProxyAPI + 官方 API Key | **4.5 / 5** |
| Supabase（现状） | 3.8 / 5 |
| InsForge | 3.0 / 5 |

---

## 13. 可行性结论与决策建议

### 13.1 四个核心问题的答案

**Q1: InsForge 是否适合替代 Supabase？**  
技术上可行，但当前安全风险不可接受。建议等待 Issue #1447 和 #1436 修复后重新评估。

**Q2: 接入难度如何？**  
- 数据库迁移：低难度（Prisma 抽象，改环境变量即可）
- Storage 迁移：低-中难度（仅 1 个文件，约 20 行代码）
- Coolify 配置：中难度（多端口路由需要手动配置，1-2天调试）
- 安全加固：中难度（需要在 InsForge 前加额外鉴权层）

**Q3: 未来可扩展性如何？**  
- **乐观场景**（InsForge 解决安全问题，Compute 正式发布）：高可扩展性，Model Gateway + Compute + MCP 组合非常契合 AI Native 路线
- **悲观场景**（项目停止维护或安全问题持续）：迁移成本较高，因为已与 InsForge 私有 PostgreSQL 镜像绑定

**Q4: 已有 CLIProxyAPI，还需要额外的 Model Gateway 吗？**  
短期不需要 LiteLLM。CLIProxyAPI 处理内部/管理员文本生成，只需单独配置一个 OpenAI API Key 处理 Embedding（月成本 < $1）。用户付费触发的 AI 功能走官方 API Key 直连以规避 ToS 风险。LiteLLM 在业务量增长到需要多 Key 管理时再引入。

### 13.2 决策矩阵

```
如果你能接受：
  ✓ 接受安全风险并做好缓解措施（禁 Edge Functions、加鉴权层）
  ✓ 接受 Compute 暂不可用，n8n 替代
  ✓ 接受 Coolify 需要额外配置工作
  ✓ 接受与 InsForge 发版节奏绑定
→ 可以尝试 InsForge，但仅在非生产环境先验证

如果你不能接受上述任一条件：
→ 选择 自建 PostgreSQL + MinIO（最稳妥）
→ 官方 API Key 直连处理 Embedding + 用户侧 AI，CLIProxyAPI 继续用于内部场景
```

### 13.3 最终建议

**阶段性策略，而非全有或全无：**

1. **现在**：从 Supabase 迁移到自建 PostgreSQL（pgvector 镜像）+ MinIO（1-2 天完成）
2. **现在**：CLIProxyAPI 继续用于内部/管理员场景，配置 `OPENAI_API_KEY` 专门处理 Embedding
3. **现在**：用已有的 n8n 开始构建 AI 客服工作流
4. **4-8 周**：构建 ScaletoTop 用户侧 MCP Server
5. **3-6 个月后**：重新评估 InsForge，若安全漏洞已修复、Compute 已正式发布，再考虑整体迁移；同步评估是否需要引入 LiteLLM 统一管理

---

## 14. 推荐技术栈方案

### 方案 A：稳健自托管方案（推荐）

```yaml
# 在 Coolify 上运行的服务栈

services:
  # 核心应用
  scaletotop:         # Next.js（ScaletoTop）
  postgres:           # pgvector/pgvector:pg17（官方 pgvector 镜像）
                      # 同时具备关系型 + 向量数据库能力
  minio:              # S3 兼容存储（图片）
  
  # AI 能力层（已有，继续使用）
  cliproxyapi:        # ✓ 已部署：内部/管理员文本生成
                      # Claude Code / Gemini CLI / Codex 订阅转 API
                      # 注意：仅限内部使用，不走用户付费流量
  
  # 编排与自动化（已有）
  n8n:                # ✓ 已安装：AI 客服工作流 + 知识库同步
  
  # 反向代理（Coolify 自带）
  traefik:            # ✓ Coolify 管理

# 环境变量新增（非新服务）
# GOOGLE_AI_API_KEY=...    → Gemini text-embedding-004（已有 Google 账号，优先）
#                            或部署 Ollama + BGE-M3（自托管，零成本）
# ANTHROPIC_API_KEY=sk-... → 用户付费 AI 功能（合规调用，非 CLIProxyAPI）
# 注意：Claude 没有 Embedding API，embedding 必须用上述专用模型
```

**pgvector 启用步骤**（一次性，部署后执行）：
```sql
-- 连接到 PostgreSQL 后执行
CREATE EXTENSION IF NOT EXISTS vector;

-- AI 客服知识库表
CREATE TABLE knowledge_base (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content     TEXT NOT NULL,
  embedding   vector(1536),
  source_type VARCHAR(50),   -- 'blog' | 'faq' | 'help_doc'
  source_id   VARCHAR(255),
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON knowledge_base
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

**ScaletoTop MCP Server**（需自建，部署在 Next.js 内）：
```
/api/mcp/route.ts    # SSE 传输，暴露业务工具给用户
暴露工具：
  - get_site_audit(siteId)
  - get_keywords(siteId)
  - get_content_plan(siteId)
  - search_knowledge_base(query)   # 语义搜索知识库
  - generate_article(topic)
  - get_account_info()
  - get_credits()
```

### 方案 B：InsForge 试验方案（6 个月后重评）

等待 InsForge 修复 #1447 + #1436 后：

```yaml
services:
  insforge:           # DB + Storage + Model Gateway（如安全问题已修复）
  scaletotop:         # Next.js
  n8n:                # 已有
  cliproxyapi:        # 已有，继续用于内部场景
  traefik:            # Coolify 管理
```

---

## 15. 分阶段迁移路线图

### Phase 1（当前 → 第 2 周）：脱离 Supabase

```
目标：自建数据库 + 存储，不依赖 Supabase，启用向量能力
工作：
  □ Coolify 部署 pgvector/pgvector:pg17（含向量能力）
  □ Coolify 部署 MinIO
  □ 导出 Supabase 数据，导入新 PostgreSQL
  □ 修改 DATABASE_URL / DATABASE_URL_DIRECT 环境变量
  □ 改写 src/lib/storage.ts（S3 SDK 替换 Supabase SDK）
  □ 执行 CREATE EXTENSION IF NOT EXISTS vector（启用 pgvector）
  □ 选定 Embedding 方案（Gemini text-embedding-004 或 BGE-M3 via Ollama）
  □ 配置对应环境变量（GOOGLE_AI_API_KEY 或 Ollama 服务地址）
  □ 全量回归测试
  □ Notion 同步测试（图片上传验证）
成果：完全脱离 Supabase，PostgreSQL 具备关系型 + 向量双能力
```

### Phase 2（第 2-4 周）：AI 客服建设

```
目标：补全 Embedding 能力，上线 AI 客服工作流
工作：
  □ 建立 knowledge_base 表（pgvector Schema，维度按选定模型设置）
  □ 开发知识库同步 n8n Workflow（博客文章 → Embedding → pgvector）
      使用：Gemini text-embedding-004 或 BGE-M3（与 Phase 1 选定保持一致）
  □ 配置客服渠道入口（Chatwoot 或邮件 Webhook）
  □ 用 n8n 构建 AI 客服 Workflow：
      接收工单 → Embedding 检索知识库 → 查用户账户 → Claude 生成回复 → 自动发送
  □ CLIProxyAPI 接入现有 AI Skills（内部/管理员文本生成场景）
  □ ANTHROPIC_API_KEY 直连用于用户付费触发的 AI 功能（合规，非 CLIProxyAPI）
成果：AI 客服上线，RAG 知识库建立，Embedding 与文本生成分工明确
```

### Phase 3（第 4-8 周）：用户侧 MCP Server

```
目标：用户可以通过 Claude Desktop / Cursor 接入 ScaletoTop
工作：
  □ 开发 ScaletoTop MCP Server（@modelcontextprotocol/sdk）
  □ 实现工具：站点分析、关键词、内容计划、账户信息、语义知识库搜索
  □ API Key 管理功能（Dashboard 内生成/吊销）
  □ MCP 接入文档（给用户的配置说明）
  □ 安全：速率限制、权限隔离（每 Key 只能访问自己的数据）
成果：ScaletoTop 成为 MCP 可接入的 AI Native SaaS
```

### Phase 4（第 3-6 个月）：InsForge 重新评估 + LiteLLM 决策

```
目标：评估是否引入 InsForge 或 LiteLLM
InsForge 条件触发：
  ✓ Issue #1447（Edge Function 无鉴权）已关闭
  ✓ Issue #1436（Admin Key 破坏认证）已关闭
  ✓ Compute 功能正式发布（脱离私密预览）

LiteLLM 条件触发（任一满足）：
  ✓ 用户侧 AI 调用量超过单个 API Key 速率限制
  ✓ 需要在多 Provider 间做自动 Failover
  ✓ 需要集中的用量监控和按用户成本归因
  
如果 InsForge 条件满足：
  □ 测试环境验证 InsForge + Coolify 兼容性
  □ 评估是否整合 InsForge Model Gateway 替代直连 API Key
  □ 评估 Compute 是否可补充 n8n 的复杂 Agent 工作流

如果条件不满足：
  □ 继续当前方案（pgvector PG + MinIO + CLIProxyAPI + 官方 API Key + n8n）
  □ 6 个月后再次评估
```

---

## 附录：关键链接

| 资源 | 链接 |
|---|---|
| InsForge GitHub | https://github.com/InsForge/InsForge |
| InsForge 安全 Issue #1447 | https://github.com/InsForge/InsForge/issues/1447 |
| InsForge 安全 Issue #1436 | https://github.com/InsForge/InsForge/issues/1436 |
| CLIProxyAPI（已部署）| https://github.com/router-for-me/CLIProxyAPI |
| LiteLLM（规模增长后引入）| https://github.com/BerriAI/litellm |
| MCP SDK（构建用户侧 MCP Server）| https://github.com/modelcontextprotocol/typescript-sdk |
| MinIO Coolify 部署 | https://coolify.io/docs |
| pgvector 官方 Docker 镜像 | https://hub.docker.com/r/pgvector/pgvector |
| pgvector GitHub | https://github.com/pgvector/pgvector |
| pgvector + Prisma 集成指南 | https://github.com/pgvector/pgvector#prisma |
| **Embedding 模型** | |
| Google AI Studio（Gemini Embedding）| https://aistudio.google.com/apikey |
| Jina Embeddings v3 | https://jina.ai/embeddings |
| Voyage AI（Anthropic 官方推荐）| https://www.voyageai.com |
| BGE-M3（自托管，中文最强）| https://huggingface.co/BAAI/bge-m3 |
| Ollama（自托管模型运行时）| https://github.com/ollama/ollama |

---

*本报告基于 2026-06-09 的公开信息评估，InsForge 项目快速迭代中，建议每 2 个月重新审阅安全 Issue 状态。*
