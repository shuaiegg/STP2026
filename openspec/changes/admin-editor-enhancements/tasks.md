# Admin 内容编辑器增强 — 任务清单

> 在现有 markdown 编辑器上分层，保持 markdown 为单一真相源。admin UI 保持中文。

## Sprint 1 — 工具栏 + 图片体验（~2-3 天）

### 1.1 富文本工具栏
- [ ] 1.1.1 `EditorToolbar` 组件：加粗/斜体/行内代码/链接/H2/H3/有序列表/无序列表/引用/代码块，对 textarea 选区包裹 markdown
- [ ] 1.1.2 接入 `EditableSection`（分段）与源码模式 textarea
- [ ] 1.1.3 无选区时插入占位 + 光标定位；多行列表逐行处理

### 1.2 图片体验
- [ ] 1.2.1 上传中 loading + 失败重试 + 成功插入后聚焦；插入 `![alt](url)`
- [ ] 1.2.2 图片小工具条：设 alt、左/中/右对齐（`rehype-raw` 渲染 `<img class>`）、删除
- [ ] 1.2.3 ReactMarkdown 开启 `rehype-raw`，预览与前台 prose 一致
- [ ] 1.2.4 媒体库选择器：`listMedia()` server action（ADMIN，分页/按文件名搜索）+ 缩略图网格弹层，点选插入

## Sprint 2 — 内链 + 自动保存 + 实时统计（~2 天）

### 2.1 内链助手
- [ ] 2.1.1 `searchPublishedContent(q, locale?)` server action（PUBLISHED，title/slug 模糊，take 10）
- [ ] 2.1.2 链接按钮旁"内链"入口：搜索→插入 `[标题](/blog/slug)`（按目标 locale 前缀）

### 2.2 自动保存
- [ ] 2.2.1 formData/seoData 变更防抖（~2s）调 `updateContentMetadata`（不改 status）
- [ ] 2.2.2 顶部状态指示：未保存/保存中/已保存 {时间}；手动保存立即触发
- [ ] 2.2.3 `beforeunload` 未保存提示

### 2.3 实时统计 + 全文预览
- [ ] 2.3.1 实时字数（CJK 字符 / EN 词）+ 阅读时长（复用 calculateReadingTime）
- [ ] 2.3.2 新增"预览"模式标签：整篇 contentMd 经 ReactMarkdown 渲染，prose 样式与前台一致

### 2.4 验收
- [ ] 2.4.1 工具栏选区包裹正确、预览即时
- [ ] 2.4.2 图片上传→预览→alt/对齐/删除；媒体库复用已传图
- [ ] 2.4.3 内链搜索→插入正确 locale 链接
- [ ] 2.4.4 自动保存 + 状态指示 + 关页提示
- [ ] 2.4.5 字数/时长实时；全文预览一致
- [ ] 2.4.6 共享组件经 props 注入、客户侧无回归；`tsc`+`build`+`check:cjk` 通过
