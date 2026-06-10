# Sprint 3 — AI 客服基础规格

## 目标

用 pgvector 建立知识库，用 n8n 构建 RAG 客服工作流，减少人工回复量。不引入外部客服平台，只做核心 RAG 管道。

## 架构

```
用户提问（邮件 / Webhook）
        ↓
   n8n Workflow
        ↓
   生成 Embedding（Gemini text-embedding-004）
        ↓
   pgvector 检索 Top-5 相关文档
        ↓
   获取用户上下文（credits、plan、last activity）
        ↓
   构建 RAG Prompt → Claude via CLIProxyAPI
        ↓
   置信度判断：高 → 自动回复 / 低 → 转人工
```

## 知识库数据库表

用原始 SQL 建表（Prisma 不支持 `vector` 类型原生）：

```sql
CREATE TABLE knowledge_base (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content     TEXT NOT NULL,
  embedding   vector(768),
  source_type VARCHAR(50),    -- 'content_article' | 'faq' | 'pricing'
  source_id   VARCHAR(255),
  metadata    JSONB,
  model_name  VARCHAR(100),   -- 记录 embedding 模型，切换时重建
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON knowledge_base
  USING hnsw (embedding vector_cosine_ops)
  WITH (m=16, ef_construction=64);
```

## Embedding 方案

- 模型：Gemini `text-embedding-004`（768 维）
- API Key：`GOOGLE_AI_API_KEY`（AI Studio，与 OAuth 的 `GOOGLE_CLIENT_ID` 不同）
- 免费额度：1500 req/min，覆盖当前规模

## n8n Workflows（2 个）

### Workflow A：知识库同步（手动 + 每日 cron）

1. 查询 `Content`（`status=PUBLISHED`）
2. 每篇文章取 `title + summary + contentMd`，按 512 token 分块
3. HTTP Request → Gemini Embedding API
4. UPSERT `knowledge_base`（按 `source_id` 去重）

### Workflow B：AI 客服响应

1. 触发：Webhook（接收用户问题 + email）
2. 生成问题 Embedding（Gemini）
3. pgvector 检索 Top-5 文档（cosine distance）
4. HTTP Request → Next.js API 获取用户账户上下文
5. 构建 Prompt：系统角色 + 知识片段 + 用户信息 + 问题
6. AI Agent 节点 → Claude via CLIProxyAPI
7. 关键词检测："我不确定" / "无法确认" → 转人工队列；否则自动发送回复

## 新增环境变量

```bash
GOOGLE_AI_API_KEY=   # Google AI Studio，用于 Gemini Embedding
```

## 验收标准

- `knowledge_base` 表中有所有已发布文章的向量数据
- 5 个标准客服问题（积分用法、GSC 连接、价格、密码重置、数据导出）均能得到相关回复
- 无关问题（如"明天天气"）被标记为低置信度，不自动回复
