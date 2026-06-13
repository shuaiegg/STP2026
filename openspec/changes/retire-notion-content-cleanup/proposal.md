# 退役 Notion + 内容管理清理 — 提案

## Why

ScaletoTop 当前有**两个内容来源**：Notion 同步（`src/lib/notion/`）和应用内创建（geo-writer → blog-draft）。双源是一系列乱象的根：英文博客显示中文类别、locale 漂移、两套编辑器能力不一。

退役 Notion 的时机现在最好（生产库仅 4 篇 zh 文章、零流量；越往后经 Notion 管道沉淀越多，迁移越难），且与既定方向一致：

1. **geo-writer 为主的 dogfooding**（已定策略）——Notion 是并行的竞争管道
2. **AI Native 未来用 MCP/API 管文章**——内容应诞生在自己系统里（DB 为源），Notion 是纯多余的一跳
3. **英文博客显示中文类别**——Category 无 locale 字段、slug 是中文，是 Notion 起源数据模型的历史包袱

核心原则：**Content 表（DB）= 内容唯一真相源**，经应用内编辑器 + 未来 API/MCP 编辑。**markdown 是生成与存储之间的唯一契约**——SEO 评分/Stellar 分析视为可再生的分析产物，不持久化。

退役 Notion 会移除它**静默承担的 4 个职责**，每个都必须显式替代或接受：① 图片管道（下载→MinIO→改 URL）② 写作 UX ③ 版本历史 ④ 异地内容备份。本 change 处理 ①（编辑器图片上传），接受 ②③ 的现状（markdown 分段编辑当前够用，版本历史推迟），并把 ④ 升级为运维前置（DB 自动备份）。

这是 `content-flywheel` 的前置清理——做完管道更纯粹（飞轮的 看板→writer→发布→追踪 不再与 Notion 同步竞争）。

## What Changes

**🔴 退役创造的硬缺口（必须做）**

1. **退役 Notion**：删 `src/lib/notion/`、`/admin/sync` 页 + `src/app/actions/sync.ts`、`NOTION_API_KEY`/`NOTION_DATABASE_ID` env、`SyncLog` 表；清理 TopNav / admin 首页 / 内容列表 / 集成页的 6 处引用。保留 `uploadImageFromUrl`/`storage.ts`（图片上传复用）。4 篇 zh 文章原地保留，`ContentSource` 默认改 `MANUAL`
2. **Category 按语种分**：加 `locale` 字段 + ASCII slug；en/zh 各自类别集。生产库迁移现有 2 个中文 slug 类别（备份→可逆→旧 URL 301）
3. **admin 新建文章入口**：空白草稿创建（补上唯一缺失的创建路径）
4. **admin 编辑器升级**：用 geo-writer 的 `EditableSection`/`OutlineEditor` 替换 textarea（markdown 契约，复用 `parseMarkdownToSections`/`joinSectionsToMarkdown` 反解/合成）+ **编辑器图片上传 UI**（拖拽/粘贴 → `uploadImageFromUrl` → 插入 markdown）
5. **`saveToBlogDraft` 带上 SeoMeta** + 保存时**计算 readingTime**
6. **slug 可编辑** + 改名时建 301 重定向（运行时 `Redirect` 表 + middleware 查表）
7. **发布动作 revalidate 改 locale 感知**（修现有 bug：现只刷 `/blog`、`/blog/{slug}`，漏 `/zh/blog`、`/zh/blog/{slug}`、`/` 与 `/zh` 首页精选、`/sitemap.xml`、分类页）
8. **轻量作者模型**：现 BlogPosting `author` 是硬编码 "ScaletoTop Team"（无实体）。加 `Author` 模型（name/bio/avatar/url）+ `Content.authorId`，BlogPosting `author` 用真实 Person 实体（E-E-A-T 信号）

**🟠 运维前置（非代码，上线前）**：VPS Postgres 自动备份（退役后 DB 成内容唯一副本，紧迫性升高）

## Capabilities

### 新增
- `notion-retirement`: 移除 Notion 同步全部代码/配置/引用，`ContentSource` 默认 MANUAL
- `category-locale`: Category 加 locale + ASCII slug，按语种分集 + 生产数据迁移
- `content-create-entry`: admin 空白文章创建入口
- `editor-upgrade`: admin 编辑器用 EditableSection/OutlineEditor + 图片上传 UI
- `seo-meta-carryover`: geo-writer→blog-draft 携带 SeoMeta + readingTime 计算
- `slug-redirect`: 运行时 `Redirect` 表 + middleware，slug 改名保权重
- `locale-aware-revalidation`: 发布动作刷新全部相关 locale 路径（修 bug）
- `author-model`: 轻量 Author 实体 + Content.authorId + Person schema

### 修改
- `prisma/schema.prisma`: Category(+locale,+slug 规则)、Content(+authorId)、新增 Author/Redirect、删 SyncLog、ContentSource 默认值
- `src/app/actions/blog-draft.ts`: 携带 SeoMeta、authorId、readingTime
- `src/app/actions/content.ts`: 发布 revalidate locale 感知
- `src/middleware.ts`: Redirect 表查询（slug 改名重定向）
- `src/components/editor/*`: 编辑器组件接入 admin + 图片上传
- 公共博客查询：Category 按 locale 过滤

### 不变
- geo-writer 客户侧流程（仅共享编辑器组件，存储目标不同）
- Stellar AI pipeline
- MinIO/storage.ts 图片存储机制（仅不再从 Notion 拉，改为编辑器上传）

## Non-Goals（明确推迟）
- admin 编辑器内**重新调用 AI 生成/增强**（Stellar 请进 admin）→ 留待 content-flywheel 或独立 change
- 草稿自动保存 / 文章版本历史
- WYSIWYG 块编辑器（TipTap/Lexical）——markdown 分段编辑当前够用，留作路线图
- 孤儿图片 GC（MinIO 长期膨胀清理）
- RSS / 站内搜索 / 内链助手 / 定时发布
