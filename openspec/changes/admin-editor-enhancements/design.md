# Admin 内容编辑器增强 — 设计决策

## 总原则：在 markdown 上分层，不重写为 WYSIWYG

现有编辑器是 markdown 三模式（分段 EditableSection / 结构 OutlineEditor / 源码 textarea）+ ReactMarkdown 预览。所有增强都**产出标准 markdown**，保持 `Content.contentMd` 为单一真相源。WYSIWYG 块编辑器是未来路线图，不在本期。

## 决策 1：富文本工具栏 = 选区包裹 markdown

- 工具栏挂在分段/源码 textarea 上方，按钮对 `selectionStart/selectionEnd` 包裹语法：
  - 加粗 `**…**`、斜体 `*…*`、行内代码 `` `…` ``、链接 `[…](url)`、H2 `## `、H3 `### `、有序/无序列表（逐行加 `- `/`1. `）、引用 `> `、代码块 ```` ```lang ```` ````
- 纯前端字符串操作 + 复用现有 `onSave`（写回 section.body / contentMd）
- 无新依赖；不引入富文本框架

## 决策 2：图片体验 —— 预览/alt/对齐 + 媒体库

- **上传即预览**：上传后插入 `![alt](url)`，ReactMarkdown 预览区已渲染 `<img>`；补充上传中 loading + 失败重试 + 成功后聚焦到插入处
- **alt / 对齐**：对齐用 markdown 无法表达 → 采用约定（如 HTML `<img align>` 或包裹 class 注释）。**决策：alt 走标准 `![alt](url)`；对齐用图片下方小工具条改写为 `<img src alt class="...">`（ReactMarkdown 开启 `rehype-raw` 渲染）**。保持发布页与预览一致
- **媒体库选择器**：弹层列出当前用户/全站已上传 `Media`（缩略图网格，分页/搜索文件名），点选插入 markdown。新增 `listMedia()` server action（ADMIN）
- ⚠️ MinIO 图片在本地经代理 fake-IP 无法显示属环境问题（生产正常），不在本 change 处理

## 决策 3：内链助手 —— 搜索已发布文章

- 链接按钮旁"内链"入口：输入框搜索 `Content`（status=PUBLISHED，title/slug 模糊，当前 locale 优先、可切全部）
- 选中插入 `[文章标题](/blog/slug)`（en）或 `(/zh/blog/slug)`（zh），路径按目标文章 locale
- 新增 `searchPublishedContent(q, locale?)` server action（轻量 select，take 10）

## 决策 4：自动保存 —— 防抖 + 状态指示

- formData/seoData 变化 → 防抖（~2s）调用 `updateContentMetadata`（**不改 status**，仅存内容），保持草稿态
- 顶部状态指示：未保存 / 保存中 / 已保存 {时间}
- 防抖期间手动"保存更新"立即触发；离开前 `beforeunload` 提示未保存
- 不引入版本历史（Non-Goal）；自动保存只覆盖当前草稿

## 决策 5：实时字数/阅读时长 + 全文预览

- 字数：CJK 按字符、英文按词；阅读时长复用 `calculateReadingTime`（CJK 300/min、EN 200/min）——纯前端实时算
- 全文预览：新增"预览"模式标签（分段/结构/源码 之外），整篇 contentMd 经 ReactMarkdown + 与前台一致的 prose 样式渲染

## 共享组件边界

`EditableSection` 被 geo-writer（客户侧）与 admin 复用。新增的工具栏/媒体库/内链通过 **props 注入**（如 `onOpenMediaLibrary?`、`onInsertInternalLink?`），admin 传入、客户侧不传则不显示——保持组件纯净，无 `if(isAdmin)` 分支。

## 验收基准
- 工具栏：选中文字点加粗/链接/列表等，正确包裹 markdown，预览即时反映
- 图片：上传→缩略图预览→可设 alt/对齐/删除；媒体库可选已传图片复用
- 内链：搜索已发布文章→插入正确 locale 的 `/blog` 链接
- 自动保存：编辑 2s 后自动存、状态指示更新、关页有未保存提示
- 字数/阅读时长实时更新；全文预览渲染与前台一致
- markdown 仍是唯一存储；geo-writer 客户侧无回归；`tsc`+`build`+`check:cjk` 通过
