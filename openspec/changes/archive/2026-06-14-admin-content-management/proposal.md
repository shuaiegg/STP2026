# Admin 内容管理增强 — 提案

## Why

退役 Notion 后，`Content` 表（DB）成为内容唯一真相源，admin 内容列表是日常运营的主入口。但现状是：列表页是个**漂亮的只读表格 + 一堆没接线的装饰控件**。验证时发现：

- **删除文章功能完全不存在**（列表、编辑器都没有）——最基础的管理能力缺失
- 行尾「⋯」菜单是空壳（无 onClick），本该放快捷操作
- 搜索框纯装饰（无 handler，打字无反应）
- 「筛选」按钮纯装饰
- 分页是假的（"第 1 页"、上/下页禁用，且一次性 `findMany` 加载全部）

能用的只有：列表展示、语种 tab 筛选、编辑/查看链接、翻译配对展示。要"更换某篇文章的分类"只能逐篇进编辑器改——没有列表层的快捷管理。

对一个要长期运营内容的平台，缺删除、缺快捷状态切换、缺搜索是硬伤。本 change 让内容列表**真正可管理**。

## What Changes

**🔴 核心（让列表"能管"）**

1. **删除文章**：`deleteContent(id)` server action + 品牌确认弹窗（复用 AlertDialog，非原生 confirm）。删除时清理关联：SeoMeta/PreviewToken（schema cascade 自动）、按 url 匹配的 Redirect 与 TrackedArticle（显式清理）、PlannedArticle.articleId 置空并回退状态、发布态文章删除后 revalidate 相关路径
2. **行尾「⋯」菜单接线**：下拉菜单含 编辑 / 前台查看 / 快捷改状态（草稿↔发布↔归档）/ 改分类 / 删除
3. **快捷改状态**：列表直接 发布/下架/归档，复用 `updateContentMetadata` 的状态流转（含发布时 TrackedArticle 注册、revalidate）
4. **搜索接线**：按标题/slug 客户端实时过滤（数据已全量加载）

**🟡 次要（同批顺带）**

5. **改分类快捷入口**：⋯ 菜单内快速切换分类（按文章 locale 过滤可选分类）

## Capabilities

### 新增
- `content-delete`: `deleteContent(id)` server action + 关联清理 + 品牌确认弹窗
- `content-row-actions`: 列表行 ⋯ 下拉菜单（编辑/查看/改状态/改分类/删除）
- `content-quick-status`: 列表层发布/下架/归档
- `content-search`: 标题/slug 客户端实时搜索

### 修改
- `src/app/(protected)/dashboard/admin/content/page.tsx`: 列表抽出可交互的 client 表格组件（现为纯 Server Component）
- `src/app/actions/content.ts`: 新增 `deleteContent`；状态切换复用 `updateContentMetadata`
- 列表行操作区：⋯ 占位按钮替换为真实下拉菜单

### 不变
- 单篇编辑器（已在 admin-editor 修复批次完成）
- 语种 tab 筛选（已可用）
- `updateContentMetadata` 的发布→TrackedArticle→revalidate 链路

## Non-Goals（明确推迟）
- **真分页**：当前文章量小，一次性加载可接受；量大后单独做（含服务端分页 + 搜索下推到 DB）
- **批量操作**（多选 → 批量改分类/状态/删除）：先做单篇行操作，批量后续
- 高级筛选（按状态/分类/日期）：先做语种 tab + 搜索，够用
- 删除文章后建 410 Gone / 重定向：删除即 404 可接受（非软删除）
