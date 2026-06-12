# 内容飞轮断点修复 + geo-writer 质量循环 — 提案

## Why

产品已经拥有一条完整内容飞轮的全部零件，但三个关节是断的，导致它只是一组孤立工具而非闭环系统：

```
 ① 诊断          ② 策略           ③ 生产          ④ 发布
 Site            Strategy         geo-writer      Content
 Intelligence ──▶ Board ─── ✂ ───▶ (写作) ───────▶ 博客
                                                    │
       ▲          ⑥ 度量           ⑤ 验证           │
       └── ✂ ──── GSC/GA4 ◀── ✂ ── TrackedArticle ◀─┘
```

- **②→③ 断**：`PlannedArticle`（已有 `keyword`/`language`/`articleId` 字段）无法一键进入 geo-writer，选题到写作要手动复制粘贴
- **④→⑤ 断**：博客发布后不会自动注册 `TrackedArticle`，发了文章却不知道有没有被 AI 引用，GEO 闭环断裂
- **⑥→① 断**：生产环境 Coolify 缺 `GOOGLE_CLIENT_ID/SECRET`，GSC 数据回不来（纯配置）

同时 **geo-writer 的实际输出质量未知**——而它即将成为 scaletotop.com 自己（中文获客 + 英文 dogfooding）的主内容生产线。需要一个可度量的质量协议：每篇生成内容先过评分卡，不及格归因到 Stellar pipeline 的具体环节并修复，让"写文章"和"打磨产品"成为同一个动作。

修通飞轮是教练层（Next Best Action）的前置——你自己手动跑飞轮的经验就是未来教练层 playbook 的素材。

## What Changes

1. **看板→写作直通**：`PlannedArticle` 卡片增加「开始写作」动作，携带 keyword/title/language 预填进入 geo-writer；保存草稿后回写 `articleId` 并推进看板状态
2. **发布→追踪自动化**：博客 Content 状态切换为 `PUBLISHED` 时，自动创建/更新对应 `TrackedArticle`（url=正式博客 URL，keywords 取自 SeoMeta），进入引用检测队列
3. **GSC 生产配置**（运维任务）：Coolify 补 `GOOGLE_CLIENT_ID/SECRET`，验证 scaletotop.com 的 GSC 数据回流
4. **质量评分卡协议**：`rules/content-scorecard.md` 评分准则 + 归因方法（不及格 → Stellar pipeline 哪一环），并跑首批 3-5 篇英文文章建立质量基线

## Capabilities

### 新增

- `board-to-writer`: 策略看板卡片 → geo-writer 预填直通，写作完成回链 `articleId` 与状态推进
- `publish-to-tracking`: 博客发布钩子自动注册 `TrackedArticle`
- `content-scorecard`: 内容质量评分卡协议文档 + Stellar pipeline 归因表 + 首批英文文章质量基线

### 修改

- `StrategyBoard.tsx` / 看板卡片组件：增加「开始写作」入口
- geo-writer（`/tools/geo-writer`）：支持 URL 参数预填（keyword/title/language/plannedArticleId）
- `src/app/actions/blog-draft.ts`：保存草稿时回写 `PlannedArticle.articleId` + 状态 `IN_PROGRESS`
- 博客发布动作（admin 内容管理状态切换处）：挂 `TrackedArticle` upsert 钩子
- `src/app/actions/tracked-articles.ts`：`saveTrackedArticle` 支持由发布钩子调用（含 url/来源标记）

### 不变

- Stellar pipeline 本身（`IntelligenceEngine`/`StrategyComposer`/`ExecutionAgent`/`RefiningStudio` 等）不重构——评分卡发现问题后按归因逐点修，不在本 change 范围内预设改动
- 引用检测 cron 机制不变（只是多了自动入队的来源）
- credit 计费逻辑不变

## Non-Goals

- 教练层 / Next Best Action（刻意排在手动跑通飞轮之后）
- 中文 AI 引擎（豆包/Kimi 等）引用检测
- 评分卡的自动化打分系统（先人工评分建立基线，自动化等协议稳定后再说）
- 英文文章的正式发布依赖 `site-i18n-bilingual` Sprint 2 的 `Content.locale`——在那之前英文文章停留在草稿/评分阶段
