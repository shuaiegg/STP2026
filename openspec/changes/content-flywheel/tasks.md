# 内容飞轮断点修复 — 任务清单

---

## Sprint 1 — 三个断点修复（~3 天）

> 目标：从看板卡片到引用检测队列全程零复制粘贴

### 1.1 GSC 生产配置（立即，运维）

- [ ] 1.1.1 Coolify 添加 `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`，核对 `GOOGLE_REDIRECT_URI` 为生产域名
- [ ] 1.1.2 Google Cloud Console 核对 OAuth redirect URI 白名单含生产回调地址
- [ ] 1.1.3 验收：scaletotop.com 在 site-intelligence 完成 GSC 连接，关键词数据出现

### 1.2 看板 → geo-writer 直通

- [ ] 1.2.1 geo-writer 支持 URL 参数：`keyword` / `title` / `language` / `plannedArticleId`（读取后预填，Step 1 可跳过或确认）
- [ ] 1.2.2 `StrategyBoard.tsx` 卡片增加「开始写作」动作 → 拼参跳转 geo-writer
- [ ] 1.2.3 `blog-draft.ts` + `saveTrackedArticle`（保存到内容库路径）：携带 `plannedArticleId` 时回写 `PlannedArticle.articleId` + 状态 → `IN_PROGRESS`
- [ ] 1.2.4 看板卡片 `articleId` 有值时展示「查看文章」链接
- [ ] 1.2.5 PostHog：`board_start_writing` 事件（keyword/language）

### 1.3 发布 → TrackedArticle 自动注册

- [ ] 1.3.1 实现 `upsertTrackedArticleFromContent(content)`：url 自然键查重、keywords 取 SeoMeta（兜底标题）、幂等
- [ ] 1.3.2 在博客发布动作（Content.status → PUBLISHED 且 type=BLOG）挂钩调用
- [ ] 1.3.3 关联 `PlannedArticle`（经 articleId 反查）状态 → `COMPLETED`
- [ ] 1.3.4 验收：admin 发布一篇文章 → TrackedArticle 列表出现该 url 且状态 PENDING 待检测；重复发布不产生重复记录

---

## Sprint 2 — 质量评分卡协议 + 首批基线（~2 天 + 持续运行）

> 目标：geo-writer 质量从"未知"变成"有基线、有归因、有修复路径"

### 2.1 协议文档

- [ ] 2.1.1 撰写 `rules/content-scorecard.md`：5 维度评分细则（各维度检查点 + 分值）、70 分及格线、Stellar pipeline 归因表（见 design 决策 4）
- [ ] 2.1.2 文档内建立运行记录表（日期/标题/语言/5 维分/总分/归因/处置）
- [ ] 2.1.3 在 CLAUDE.md「Design & Copy Rules」处登记该文件

### 2.2 首批英文文章基线

- [ ] 2.2.1 从策略看板（或手动）选 3-5 个英文选题（贴近客户画像的 SEO/GEO 垂直话题）
- [ ] 2.2.2 geo-writer 逐篇生成（language=en），每篇人工评分并记录
- [ ] 2.2.3 汇总归因：哪个 pipeline 环节是最大失分源 → 输出结论："直接量产" 或 "先修 X 环节"（若需修，另起后续 change，不在本期擅自改 pipeline）
- [ ] 2.2.4 ≥70 分文章存为博客草稿，待 `site-i18n-bilingual` S2 的 `Content.locale` 就位后发布

### 2.3 总验收

- [ ] 2.3.1 design.md「验收基准」全项通过（看板→检测队列零复制粘贴全流程演练）
- [ ] 2.3.2 中文侧立即可用：用飞轮为 scaletotop 发一篇中文文章走完全程
