# Admin 内容管理增强 — 任务清单

> 单 Sprint（~半天）。让内容列表从"只读表格"变成"真正可管理"。

## 1. 删除文章（server action + 清理）

- [x] 1.1 `deleteContent(id)` in `content.ts`：事务清理 PlannedArticle.articleId(→null,status→PLANNED)、Redirect(按两 locale blog 路径)、TrackedArticle(按两 locale blog URL)、Content.delete(级联 SeoMeta/PreviewToken)
- [x] 1.2 原 status=PUBLISHED 时调用 `revalidateContentPaths`
- [x] 1.3 返回 `{ success, error? }`，ADMIN 鉴权

## 2. 列表交互化

- [x] 2.1 抽出 `ContentTable.tsx`（Client）：接收 contents + categories，`page.tsx` 保留数据获取/locale tab，传入组件
- [x] 2.2 搜索框接线：按 title/slug 客户端实时过滤（大小写不敏感）；"当前共 N 篇"随过滤更新
- [x] 2.3 移除假分页页脚或标注（本期不做真分页）

## 3. 行尾 ⋯ 菜单

- [x] 3.1 ⋯ 按钮替换为下拉菜单：编辑 / 前台查看 / 改状态 / 改分类 / 删除
- [x] 3.2 改状态子项：发布(→PUBLISHED) / 下架(→DRAFT) / 归档(→ARCHIVED)，调用 `updateContentMetadata(id,{status})`
- [x] 3.3 改分类子项：按文章 locale 过滤的分类快选 → `updateContentMetadata(id,{categoryId})`
- [x] 3.4 删除子项：弹 `AlertDialog` 确认（标题含文章名 + 不可逆 + 关联清理说明）→ `deleteContent`
- [x] 3.5 操作后 `router.refresh()` + 品牌 toast 反馈（成功/失败）

## 4. 验收

- [x] 4.1 删除发布态文章：确认弹窗 → 列表移除、前台 404、TrackedArticle/Redirect 清理、关联 PlannedArticle 回 PLANNED、blog 列表 revalidate
- [x] 4.2 草稿快捷发布 → PUBLISHED + TrackedArticle 进队列(PENDING)
- [x] 4.3 列表改分类 → 前台分类页正确反映
- [x] 4.4 搜索实时过滤 title/slug
- [x] 4.5 全程品牌 toast/AlertDialog，无原生 alert/confirm；`tsc` + `npm run build` 通过
