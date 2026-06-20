# 退役 Notion + 内容管理清理 — 任务清单

> 前置：本 change 是 `content-flywheel` 的前置。
> ⚠️ 生产库 = 开发库。任何 schema/数据迁移前**先手动 pg_dump 备份**。

---

## Sprint 0 — 运维前置（上线前，非代码）

- [ ] 0.1 配置 VPS Postgres 自动备份（pg_dump cron + 异地存储 / Coolify 备份）
- [ ] 0.2 执行一次手动全量备份，确认可恢复（退役 Notion 后 DB 是内容唯一副本）

---

## Sprint 1 — 退役 Notion + 数据模型（~2-3 天）

### 1.1 Schema 变更（先备份）

- [x] 1.1.1 `Category` 加 `locale String @default("zh")`；slug 改 ASCII 约定（保留 @unique）
- [x] 1.1.2 新增 `Author` 模型（name/bio/avatarId/url）+ `Content.authorId String?`
- [x] 1.1.3 新增 `Redirect` 模型（fromPath @unique / toPath / statusCode / createdAt）
- [x] 1.1.4 `ContentSource` 默认值改 `MANUAL`（保留 NOTION 枚举值给历史）
- [x] 1.1.5 删除 `SyncLog` 模型
- [x] 1.1.6 `npx prisma db push`（生产库，**已备份**）+ `npx prisma generate`

### 1.2 退役 Notion 代码

- [x] 1.2.1 删除 `src/lib/notion/`（client.ts + sync.ts）、`src/app/actions/sync.ts`、`src/app/(protected)/dashboard/admin/sync/`
- [x] 1.2.2 清理 6 处引用：TopNav、admin 首页、内容列表、集成页中指向 `/admin/sync` 的入口/卡片
- [x] 1.2.3 移除 `NOTION_API_KEY`/`NOTION_DATABASE_ID` 的代码读取；env 文档标注废弃
- [x] 1.2.4 确认 `uploadImageFromUrl`/`storage.ts` 保留且无 Notion 依赖
- [x] 1.2.5 `grep -ri notion src/` 复查无功能性残留（历史死列除外）；`npm run build` 通过

### 1.3 生产数据迁移

- [x] 1.3.1 迁移脚本：现有 2 类别加 `locale='zh'`，slug 改 ASCII（`营销广告`→`marketing-ads`、`出海`→`going-global`），记录 old→new 映射
- [x] 1.3.2 旧分类 URL 写入 `Redirect` 表（`/zh/blog/category/营销广告` → 新 ASCII）
- [x] 1.3.3 4 篇历史 zh 文章：确认 locale=zh、分类关联正常、source 保留
- [x] 1.3.4 验证迁移可逆（保留映射，必要时回滚）

---

## Sprint 2 — 内容管道修复（~2-3 天）

### 2.1 slug 重定向机制

- [x] 2.1.1 `src/middleware.ts`：locale 解析前查 `Redirect` 表，命中则按 statusCode 重定向（轻量缓存，仅非 api/_next/静态路径）
- [x] 2.1.2 admin 改已发布文章 slug → 自动写 `Redirect(旧→新)`；未发布文章改 slug 不建

### 2.2 发布 revalidate locale 感知（修 bug）

- [x] 2.2.1 实现 `revalidateContentPaths(content)`：刷新 `/blog`+`/zh/blog`、详情（按 locale）、`/`+`/zh`、`/sitemap.xml`、所属分类页
- [x] 2.2.2 `content.ts` 发布/更新/删除动作改用该函数；移除旧的仅 `/blog` 刷新
- [x] 2.2.3 验证：发布 zh 文章后 `/zh/blog` 立即可见

### 2.3 SeoMeta 携带 + 阅读时长

- [x] 2.3.1 `saveToBlogDraft` 接收并写入 SeoMeta（metaTitle/description/keywords/geoScore 等来自 geo-writer 结果）
- [x] 2.3.2 保存时计算 `readingTime`（CJK 300 字/分、英文 200 词/分，复用现有算法）
- [x] 2.3.3 geo-writer「另存为博客草稿」传递 SeoMeta + authorId（默认作者）

### 2.4 公共博客按 locale 过滤类别

- [x] 2.4.1 博客列表/分类页的类别 tab/查询按当前 locale 过滤
- [x] 2.4.2 en `/blog` 只显示 en 类别，zh `/zh/blog` 只显示 zh 类别

---

## Sprint 3 — 编辑器升级 + 作者 + 验收（~3 天）

### 3.1 编辑器组件共享

- [x] 3.1.1 admin EditForm 的正文 textarea 替换为 `EditableSection`/`OutlineEditor`，contentMd ↔ 分段经 `parseMarkdownToSections`/`joinSectionsToMarkdown`
- [x] 3.1.2 编辑组件保持纯净（markdown in/out + 图片回调），无 `if(isAdmin)` 分支
- [x] 3.1.3 admin 新建空白文章入口（创建 DRAFT → 进编辑器）

### 3.2 图片上传与封面

- [x] 3.2.1 编辑器内拖拽/粘贴/选文件 → `uploadImageFile`（新增，复用 storage.ts）→ MinIO → 插入 markdown + 写 Media
- [x] 3.2.2 封面图设置（coverImageId）；OG 图缺省回退 `/api/og?locale=`

### 3.3 作者与细节打磨

- [x] 3.3.1 admin 编辑器支持编辑 slug（ASCII 校验；改名触发 2.1.2 重定向）
- [x] 3.3.2 作者选择器（选/建 Author）；blog 详情 BlogPosting `author` 用真实 Person（name + url sameAs），缺省回退 "ScaletoTop Team"

### 3.4 验收与交付

- [x] 3.4.1 `/admin/sync` 路由与引用完全消失
- [x] 3.4.2 旧类别 URL 301
- [x] 3.4.3 admin 新建/编辑/发布全流程；分段编辑 + 图片上传可用
- [x] 3.4.4 geo-writer→草稿带 SeoMeta + 阅读时长 + 作者
- [x] 3.4.5 改 slug → 旧 URL 301；发布 zh → `/zh/blog` 即时刷新
- [x] 3.4.6 4 篇历史文章迁移后无回归
- [x] 3.4.7 输出给 `content-flywheel`：管道已纯化（单一内容源 = DB），可开工

