# Admin 内容管理增强 — 设计决策

## 决策 1：列表抽成可交互的 Client 组件

现 `content/page.tsx` 是纯 Server Component（数据 `findMany` + 静态表格）。搜索/⋯菜单/确认弹窗都需要交互。做法：

- `page.tsx`（Server）：保留数据获取（含 category）+ locale tab + 传给客户端表格
- 新增 `ContentTable.tsx`（Client）：接收文章列表 + 可选分类列表，负责搜索过滤、⋯ 菜单、删除确认、快捷操作的乐观更新
- Server Action 调用后用 `router.refresh()` 刷新列表（或乐观更新 + 后台 action）

## 决策 2：删除的关联清理（关键）

`deleteContent(id)` 需处理 Content 的所有关联，避免脏数据：

| 关联 | 处理 |
|------|------|
| `SeoMeta` | schema `onDelete: Cascade` → 自动删 ✓ |
| `PreviewToken` | schema `onDelete: Cascade` → 自动删 ✓ |
| `Redirect` | **非外键**（按路径字符串）。删除发布文章时，清理 fromPath/toPath 命中该文章 blog URL 的重定向（`/blog/{slug}` 与 `/zh/blog/{slug}`） |
| `TrackedArticle` | **非外键**（按 url）。文章已删则 URL 404，追踪无意义 → 按 url 删除对应记录 |
| `PlannedArticle.articleId` | 指向被删 Content → 置 `articleId: null` + 状态回退 `PLANNED`（该选题可重新写） |
| `translationGroupId` | 若曾配对，删除后另一篇成"组内仅 1 篇"→ 无害（hreflang 仅在 ≥2 成员时输出），不主动清理 |

删除流程（事务）：
```
1. 读取 content（拿 slug/locale/status/translationGroupId）
2. $transaction：
   - PlannedArticle.updateMany({ articleId: id } → { articleId: null, status: 'PLANNED' })
   - Redirect.deleteMany（fromPath/toPath ∈ 该文章两个 locale 的 blog 路径）
   - TrackedArticle.deleteMany（url ∈ 该文章两个 locale 的 blog URL）
   - Content.delete（级联 SeoMeta/PreviewToken）
3. 若原 status=PUBLISHED：revalidateContentPaths（复用 content.ts 既有函数）
```

## 决策 3：确认弹窗用品牌 AlertDialog（非原生 confirm）

复用 `src/components/ui/AlertDialog.tsx`。删除是不可逆操作，弹窗须：标题点明"删除文章「{title}」"、说明"此操作不可撤销，关联的 SEO/重定向/引用追踪记录将一并清理"、危险色确认按钮。与 admin-editor 批次"去原生弹框"方向一致。

## 决策 4：快捷改状态复用 updateContentMetadata

列表层"发布/下架/归档"不另写逻辑，调用现有 `updateContentMetadata(id, { status })`：
- 已含发布时 TrackedArticle 自动注册（DRAFT→PUBLISHED）
- 已含 `revalidateContentPaths`（locale 感知）
- 状态值：`DRAFT` / `PUBLISHED` / `ARCHIVED`（SYNCED 为 Notion 遗留，不在快捷选项暴露）

## 决策 5：搜索为客户端过滤（暂不下推 DB）

数据已 `findMany` 全量加载。`ContentTable` 内按标题/slug 做 `includes` 过滤（大小写不敏感）。文章量大后再连同分页一起下推到 DB（Non-Goal，本期不做）。

## 改分类快捷入口

⋯ 菜单内"改分类"子项：弹出按文章 locale 过滤的分类快选（复用 `updateContentMetadata(id, { categoryId })`）。不做内联下拉以保持行紧凑。

## 验收基准
- 列表 ⋯ 菜单可：编辑 / 前台查看 / 改状态（发布/下架/归档）/ 改分类 / 删除
- 删除发布态文章 → 确认弹窗 → 删除后：列表移除、前台 404、TrackedArticle/Redirect 清理、关联 PlannedArticle 回到 PLANNED、blog 列表已 revalidate
- 搜索框输入标题/slug 片段 → 列表实时过滤
- 快捷发布一篇草稿 → 状态变 PUBLISHED + TrackedArticle 进队列（PENDING）
- 所有反馈用品牌 toast/AlertDialog，无原生 alert/confirm
- `npm run build` + `tsc` 通过
