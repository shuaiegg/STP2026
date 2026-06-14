# Admin 内容编辑器增强 — 提案

## Why

退役 Notion 后，admin 内容编辑器（`EditForm` + `EditableSection`，markdown 三模式：分段/结构/源码）成为内容生产的唯一界面。验证中暴露它只是"能编辑"，缺少长期运营内容所需的常见编辑能力：

- 正文图片上传后无即时预览/无 alt/无对齐/无删除；无法复用已上传图片（每次重传）
- 加粗/链接/标题/列表等要手敲 markdown 语法，效率低、易错
- 插入内部链接要手动拼 `/blog/slug`，不知道有哪些文章可链（内链是 SEO 主题权威的关键）
- 写长文中途关页会丢稿（无自动保存）；无实时字数/阅读时长；无全文预览

这些是内容平台编辑器的基线能力。本 change 在**现有 markdown 编辑器之上分层增强**（不重写为 WYSIWYG——markdown 当前够用，块编辑器留作未来路线图）。

## What Changes

**① 图片体验升级**
- 正文拖拽/粘贴/选文件上传后**即时缩略图预览** + 设置 alt + 左/中/右对齐 + 删除
- **媒体库选择器**：从已上传的 `Media` 复用图片，避免重传
- 修正插入语法，预览与发布一致

**② 富文本工具栏**
- 选中文字一键加粗/斜体/链接/H2-H3/有序无序列表/引用/代码块/代码行
- 工具栏作用于源码/分段 textarea，插入标准 markdown（保持 markdown 为单一真相源）

**③ 内链助手**
- 插入链接时可**搜索已发布文章**（按标题/slug，当前 locale 优先）→ 一键插入 `[标题](/blog/slug)` 或 `/zh/blog/slug`

**④ 编辑体验基础**
- **草稿自动保存**（防抖，关页不丢稿）+ 保存状态指示
- 实时**字数 / 阅读时长**
- **全文 markdown 预览**（所见模式，渲染与前台一致）

## Capabilities

### 新增
- `editor-image-ux`: 正文图片即时预览 + alt/对齐/删除 + 媒体库选择器（复用 Media 表）
- `editor-toolbar`: markdown 富文本工具栏（选区插入语法）
- `editor-internal-links`: 内链搜索插入（已发布文章按 locale）
- `editor-autosave`: 防抖自动保存 + 状态指示
- `editor-live-stats`: 实时字数/阅读时长 + 全文预览

### 修改
- `src/components/editor/EditableSection.tsx`: 工具栏 + 图片预览/alt/对齐
- `src/app/(protected)/dashboard/admin/content/[id]/EditForm.tsx`: 自动保存、字数/时长、全文预览、内链/媒体库入口
- `src/app/actions/media.ts`: 新增"列出我的媒体"动作（媒体库选择器）
- 新增 server action：搜索已发布文章（内链助手）

### 不变
- markdown 为内容唯一真相源（工具栏/图片只产出 markdown）
- 三模式编辑（分段/结构/源码）框架
- 发布流程、saveToBlogDraft 契约
- geo-writer 客户侧（共享 EditableSection 时仅按 props 区分，不渗透 admin 概念）

## Non-Goals（推迟）
- 完整 WYSIWYG 块编辑器（TipTap/Lexical）——markdown + 工具栏当前够用
- 文章版本历史 / 多人协同
- 图片裁剪/编辑器内修图
- 媒体库的批量管理/孤儿图片 GC（独立运维项）
