# 技术 Backlog

> 归档时间：2026-06-12  
> 说明：业务基础已就绪，转向内容与营销阶段。以下技术任务按触发条件分类，有空或有需求时再启动。

---

## 🔧 随时可做（< 1 天，无前置条件）

| 任务 | 来源 | 说明 | 状态 |
|---|---|---|---|
| Geo-writer 加公开导航入口 + 首页工具区块 | Sprint 4.1 | 30 分钟，提升工具曝光 | ✅ 导航已加/首页推迟到 `homepage-plg-repositioning` |
| PostHog：工具页访问追踪 | Sprint 1.2.4 | `geo-writer` 页面加 `posthog.capture` | ✅ 已完成 |
| PostHog：`content_plan_created` 事件 | Sprint 1.4.4 | Strategy Board 里补一行 | ✅ 已完成 |
| PostHog：`article_saved_to_library` 事件 | Sprint 1.6.2 | Library 保存时补追踪 | ✅ 已完成 |
| 验证密码重置邮件流程 | Sprint 2.2.2 | 手动测试，无需写代码 | ✅ 已完成 |
| `npm run build` 全量验证 | AI 模型管理 1.6.5 | 确认生产构建无报错 | ✅ 已完成 |

---

## ⚡ 有触发条件时启动

### 当 Coolify 有运维时间时
- **MinIO 反代修复（Sprint 0.1.5）**  
  修复 `media.scaletotop.com` → MinIO S3 端口 9000 的 Coolify 反向代理配置。  
  修好后解锁：0.5.2（Notion 图片同步验证）+ 0.5.3（博客封面图）

- **VPS Postgres 自动备份**（retire-notion-content-cleanup 0.1）  
  配置 pg_dump cron + 异地存储 / Coolify 备份。Notion 退役后 DB 是内容唯一副本，需在有运维窗口时完成。  
  完成后执行一次手动全量备份并确认可恢复（retire-notion 0.2）。

### 当 systeme.io 自动化规则需要配置时
- **Sprint 2.4.4**：在 systeme.io 平台配置 `registered` 标签 → 7 天引导序列（纯平台操作，无需写代码）

### 当有 n8n 实例可用时
- **Sprint 2.5.1**：每日 cron → 注册 7 天且 siteCount=0 → 打 `inactive_7d` 标签  
- **Sprint 2.5.2**：每日 cron → 注册 14 天无 credits 消耗 → 打 `inactive_14d` 标签

### 当有发布文章 + 真实用户时
- **Sprint 3：RAG 知识库 + AI 客服**（~4 天）  
  pgvector 知识库 + n8n embedding 同步 + AI 问答工作流  
  依赖：已有文章内容 + `GeminiEmbeddingProvider`（已实现）

### 当用户量增长需要产品黏性时
- **Sprint 5：MCP Server**（~8 天）  
  让用户通过 Claude Desktop / Cursor 接入 ScaletoTop  
  关键工具：`get_site_audit`, `get_keywords`, `generate_article`

---

## 📅 中长期（需专项规划）

| Sprint | 内容 | 依赖 |
|---|---|---|
| Sprint 6 | Google Ads 数据分析（OAuth + 看板） | Google Ads 客户有需求时 |
| Sprint 7 | Meta Ads 数据分析（Marketing API） | Meta App Review 通过后（需提前申请） |

> **注意**：Meta App Review 审核约 2 周，若计划做 Sprint 7，需提前提交申请。

---

## 📝 等待内容素材

- **Sprint 4.2：Case Studies 页面**  
  需要 3 个真实匿名案例（行业 / 挑战 / 方案 / 结果数据）  
  代码结构已就绪，素材一到位即可上线
