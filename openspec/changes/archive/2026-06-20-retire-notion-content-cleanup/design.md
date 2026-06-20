# 退役 Notion + 内容管理清理 — 设计决策

## 决策 1：markdown 是生成与存储之间的唯一契约

```
geo-writer 生成（大纲/分段/SEO评分/Stellar分析）
        │  保存时拍平为 markdown（joinSectionsToMarkdown）
        ▼
Content.contentMd  ← 唯一真相源
        │  打开时从 markdown 反解为分段（parseMarkdownToSections）
        ▼
admin 编辑器（EditableSection/OutlineEditor）
```

- `contentMd` 是唯一持久化的内容表示；结构（分段/大纲）**运行时从 markdown 反解**，不存第二份
- SEO 评分、Stellar 分析、human-score 等是**可再生的分析产物**——需要时重算，不持久化（避免两份表示同步问题）
- 已有工具 `src/lib/utils/markdown-sections.ts`（`parseMarkdownToSections`/`joinSectionsToMarkdown`）直接复用
- **为什么不结构化持久化**：markdown 本就是最终发布物；单一真相源最简单；分析数据不是内容，不该当源存

## 决策 2：编辑界面"共享"而非"交接"

geo-writer 的 `EditableSection`（251 行）/`OutlineEditor`（232 行）已是独立组件。做法：

- 抽取为可在 admin 复用的编辑组件，admin 编辑器（现 1032 行 EditForm 的 textarea）替换为该组件
- **不引入 `if(isAdmin)` 分支腐化**：编辑组件保持纯净（输入 markdown、输出 markdown + 图片上传回调），客户/admin 上下文差异（保存目标、blog 元数据）在外层挂载点处理
- geo-writer 客户侧不变（仍存到用户库）；admin 侧存到 Content（带 category/locale/author/发布）
- 结果：geo-writer 生成的草稿在 admin 里依然分段可编辑，"交接降级"问题消失

## 决策 3：图片上传（替代 Notion 图片管道）

- 编辑器内拖拽/粘贴/选择文件 → 调用 `uploadImageFromUrl`（或新增 `uploadImageFile`）→ MinIO → 返回公共 URL → 插入 markdown `![alt](url)` 并写 `Media` 记录
- 复用 `src/lib/storage.ts`（已有），无需 Notion 的下载-改写逻辑
- 封面图/OG 图：编辑器支持设置 `coverImageId`；SeoMeta.ogImageId 可指定，缺省回退 `/api/og?locale=`

## 决策 4：Category 按语种分 + ASCII slug + 生产迁移

```prisma
model Category {
  // ...现有字段
  locale String @default("zh")  // en/zh 各自类别集
  // slug 改为 ASCII（应用层 slugify 保证；保留 @unique）
}
```

- en/zh 各有独立类别集（内容已按 locale 隔离，类别也应如此）
- 公共博客查询按 `locale` 过滤类别 tab/列表
- **生产迁移（在生产库执行，无 staging，需纪律）**：
  1. **先备份**（pg_dump，见运维前置）
  2. 现有 2 类别（`营销广告`/`出海`，中文 slug）：保留 row，加 `locale='zh'`，slug 改 ASCII（`marketing-ads`/`going-global`），name 不变
  3. 旧分类 URL `/blog/category/营销广告`（若被收录）→ 经决策 5 的 Redirect 表 301 到新 ASCII slug
  4. 迁移脚本可逆（记录 old→new slug 映射）
- **空态**：en 类别集初始为空——admin 新建 en 文章时若无可选类别，允许"无类别"或现场建类别

## 决策 5：slug 改名重定向 — 运行时 Redirect 表

`next.config redirects` 是构建期静态的，无法处理**运行时** admin 改 slug 产生的重定向。新增轻量表 + middleware 查询：

```prisma
model Redirect {
  id        String   @id @default(uuid())
  fromPath  String   @unique  // e.g. /zh/blog/old-slug
  toPath    String            // e.g. /zh/blog/new-slug
  statusCode Int     @default(301)
  createdAt DateTime @default(now())
}
```

- admin 改已发布文章的 slug → 自动写入 `Redirect(fromPath=旧, toPath=新)`
- `src/middleware.ts` 在 locale 解析前查表命中则 301（查询需轻量：仅对非 `_next`/api 路径，可加内存缓存/`unstable_cache`）
- Category 迁移的旧→新 slug 也写入此表（统一机制）
- **未发布文章改 slug 不建重定向**（从未被收录）

## 决策 6：轻量作者模型（E-E-A-T）

现状：BlogPosting JSON-LD 的 `author` 硬编码 `"ScaletoTop Team"`，无实体、无个体权威性。

```prisma
model Author {
  id        String    @id @default(uuid())
  name      String
  bio       String?
  avatarId  String?   // → Media
  url       String?   // 个人主页/LinkedIn（sameAs）
  contents  Content[]
}
// Content + authorId String?
```

- 轻量独立 Author 表（不复用 User——User 可能无公开 bio，且作者≠登录账号）
- BlogPosting `author` 用真实 Person（name + url 作 sameAs），缺省回退现有 "ScaletoTop Team"
- admin 编辑器选择作者；可建多作者
- **为什么重要**：产品论点是"被 AI 引用 + 权威性排名"，作者/实体是 Google 与生成式引擎的核心 E-E-A-T 信号；dogfooding 目标（scaletotop 被 Perplexity 引用）依赖它

## 决策 7：发布 revalidate locale 感知（修 bug）

现 `content.ts` 只 `revalidatePath('/blog')` + `/blog/{slug}`——i18n 后 en 恰好命中（en 在根），但 **zh 完全没刷**，且漏首页精选/sitemap/分类页。

新增 `revalidateContentPaths(content)` 统一刷新：
```
/blog, /zh/blog                       （列表，两 locale）
/blog/{slug} 或 /zh/blog/{slug}        （详情，按 content.locale）
/, /zh                                 （首页精选位）
/sitemap.xml
/blog/category/{cat} 或 /zh/...        （该文章所属分类页，按 locale）
```

## 退役清理清单（决策 8：删除范围）

```
删除：src/lib/notion/（client.ts + sync.ts）
     src/app/actions/sync.ts
     src/app/(protected)/dashboard/admin/sync/（页面）
     prisma: SyncLog 模型
     env: NOTION_API_KEY, NOTION_DATABASE_ID
引用清理（6 处，改为移除入口/卡片）：
     TopNav、admin 首页、内容列表、集成页、admin/sync 自身、sync.ts
保留：src/lib/storage.ts、uploadImageFromUrl（编辑器上传复用）
     Content.notionPageId/notionLastEditedAt（暂留死列，后续清；不阻塞）
     Media.notionBlockId（去重键，nullable 无害）
     ContentSource enum（保留 NOTION 值给那 4 篇历史；新内容默认 MANUAL）
```

## 运维前置（非代码，上线前必须）

- VPS Postgres 自动备份（pg_dump cron + 异地存储）。退役 Notion 后内容只剩 DB 一份，备份从"应该有"变"必须有"。**任何生产 schema/数据迁移前先手动备份一次。**

## 验收基准

- `/admin/sync` 及全部引用消失；`grep -ri notion src/`（排除注释/历史字段）无功能性残留；`npm run build` 通过
- en `/blog` 只显示 en 类别，zh `/zh/blog` 只显示 zh 类别；类别 URL 为 ASCII
- 旧中文类别 URL 301 到新 ASCII slug
- admin 可新建空白文章并发布；编辑器分段可编辑 + 可上传图片插入正文
- geo-writer「另存为博客草稿」后，admin 编辑页带有 SEO meta + 阅读时长 + 可选作者
- 改已发布文章 slug → 旧 URL 301 到新 URL
- 发布 zh 文章后 `/zh/blog` 立即可见（revalidate 生效）
- 文章页 BlogPosting `author` 为真实 Person 实体
- 4 篇历史 zh 文章迁移后无回归（分类/URL 正常）
