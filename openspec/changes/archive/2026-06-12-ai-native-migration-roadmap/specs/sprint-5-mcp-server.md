# Sprint 5 — 用户侧 MCP Server 规格

## 架构

```
用户的 Claude Desktop / Cursor
        │  MCP Protocol (SSE)
        │  Authorization: Bearer stt_xxx...
        ▼
GET /api/mcp  (SSE 连接建立)
POST /api/mcp (消息处理)
        │
        ├─ API Key 验证 → ApiKey 表查询 → 获取 userId
        ├─ 速率限制 (20 req/min per key)
        │
        ▼
src/lib/mcp/server.ts (MCP Server 实例)
        │
        ├─ get_site_audit      → 查 SiteAudit 表
        ├─ get_keywords        → 查 SiteKeyword 表
        ├─ get_content_plan    → 查 ContentPlan + PlannedArticle
        ├─ generate_article    → 调用 stellar-writer skill
        ├─ get_account_info    → 查 User + Site 列表
        └─ search_knowledge_base → pgvector 查询
```

## API Key 格式

```
前缀: stt_
随机: 32 位 hex
完整: stt_a1b2c3d4e5f6...（共 36 字符）

存储: SHA-256(key) → keyHash 字段
展示: 仅存储 "stt_a1b2..." (前 12 字符) 作为 keyPrefix
```

## 工具定义

```typescript
// 6 个工具，权限：只能访问自己的数据

get_site_audit(siteId: string)
  → 返回：score, techScore, contentScore, geoScore, issues[], recommendations[]

get_keywords(siteId: string, limit?: number)
  → 返回：keyword, position, clicks, impressions, ctr[]

get_content_plan(siteId: string)
  → 返回：planned_articles[{ title, targetKeyword, status, priority }]

generate_article(topic: string, keywords: string[])
  → 调用 stellar-writer skill，扣除 credits
  → 返回：article_id, title, content_md, credits_used

get_account_info()
  → 返回：name, credits, sites[{ id, domain }]

search_knowledge_base(query: string)
  → 返回：results[{ content, source_type, similarity }]
```

## Dashboard Settings UI

在 Settings 页面新增 "API & MCP 接入" 区块：

```
┌─────────────────────────────────────────────────────┐
│  API Keys                                  [生成新 Key]│
├─────────────────────────────────────────────────────┤
│  名称          前缀         创建时间    最后使用   操作  │
│  My Claude     stt_a1b2...  2026-06-10  1小时前   [吊销]│
└─────────────────────────────────────────────────────┘

接入 Claude Desktop：
  将以下配置添加到 ~/.claude/claude_desktop_config.json：
  {
    "mcpServers": {
      "scaletotop": {
        "url": "https://www.scaletotop.com/api/mcp",
        "headers": { "Authorization": "Bearer stt_your_key" }
      }
    }
  }
```

## 速率限制实现

用 `User.mcpCallCount` + `User.mcpCallResetAt` 字段实现简单速率限制（避免引入 Redis）：

```
每次 MCP 调用前：
  if now() > mcpCallResetAt → reset count=0, resetAt=now()+1min
  if count >= 20 → 返回 429
  count++
```

或直接用 Upstash Redis 的免费套餐（更健壮，避免竞态条件）。
