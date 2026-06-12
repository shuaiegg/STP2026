# 内容飞轮断点修复 — 设计决策

## 决策 1：看板→写作用 URL 参数直通，不做深度嵌入

geo-writer 是 880+ 行的复杂 client 页面，把它嵌入 site-intelligence 详情页风险高收益低。选最薄的打通方式：

```
StrategyBoard 卡片「开始写作」
  → /tools/geo-writer?keyword=...&title=...&language=en&plannedArticleId=...
  → geo-writer 读参数跳过 Step1 关键词调研（或预填后由用户确认）
  → 「另存为博客草稿」/「保存到内容库」时，若有 plannedArticleId:
      - PlannedArticle.articleId = 新记录 id
      - PlannedArticle.status: IDEATION/PLANNED → IN_PROGRESS
```

- 状态推进映射（用现有 `StrategyStatus` enum，不加值）：进入写作 = `IN_PROGRESS`，关联内容发布后 = `COMPLETED`
- 看板卡片已有 `articleId` 字段——有值时展示"查看文章"链接，闭环可见

## 决策 2：发布→追踪在状态切换处挂钩，幂等 upsert

```typescript
// 博客发布动作内（Content.status → PUBLISHED 且 type=BLOG）
await upsertTrackedArticleFromContent(content)
// url = `${NEXT_PUBLIC_APP_URL}/{locale前缀}/blog/${slug}`
// keywords = SeoMeta.keywords（空则取标题分词兜底）
// 已存在同 url 的 TrackedArticle → 更新而非重复创建
```

- **幂等性**：以 url 为自然键查重（`TrackedArticle` 无 contentId 外键，本期不加字段，用 url 匹配；如发现不可靠再考虑加 `contentId` 列）
- 取消发布（PUBLISHED → 其他状态）不删除 TrackedArticle（历史检测数据有价值），仅停止后续主动检测可后续优化
- `TrackedArticle.userId` 取执行发布动作的 admin 用户

## 决策 3：GSC 配置是任务不是代码

Coolify 环境变量补 `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` + 核对 `GOOGLE_REDIRECT_URI` 指向生产域名；Google Cloud Console 的 OAuth 同意屏与 redirect URI 白名单同步检查。验收 = scaletotop.com 在 site-intelligence 完成 GSC 连接并出现关键词数据。

## 决策 4：评分卡 — 先人工协议，不先写代码

`rules/content-scorecard.md`，5 维度 × 20 分制（及格线 70）：

| 维度 | 检查点（摘要） | 不及格时归因到 |
|------|--------------|---------------|
| 语言质量 | 母语流畅度、无机翻腔/AI腔（英文对照 voice-en 禁词表） | RefiningStudio / ExecutionAgent |
| 事实与证据 | 数据有出处、无幻觉、引用可验证 | StellarEnricher / IntelligenceEngine |
| E-E-A-T 信号 | 作者/组织实体、第一手经验表达、外部引用 | StrategyComposer（大纲层缺位） |
| GEO 结构 | 可引用段落（自包含问答块）、FAQ、Schema 合法 | StellarAuditor / ExecutionAgent |
| 意图匹配 | 与目标关键词 SERP 意图一致、覆盖核心子话题 | IntelligenceEngine / StrategyComposer |

**运行协议**：每篇生成后先打分（人工，~10 分钟/篇）→ 记录到评分日志（`rules/content-scorecard.md` 附属的运行记录，或简单表格）→ <70 分不发布，按归因列修对应 pipeline 环节 → 重新生成验证。首批 3-5 篇英文文章建立基线，基线数据决定后续是"量产模式"还是"先修 pipeline"。

**为什么不先做自动评分**：评分标准本身需要几轮人工校准；过早自动化会把未校准的标准固化成代码。现有 `SEOScorePanel`/`StellarAuditor` 的机器分继续作为辅助参考。

## 执行顺序与依赖

```
3.x GSC 配置 ──────────────── 立即可做（5 分钟运维）
1.x 看板→写作 ─┬─ 不依赖 i18n，随时可做
2.x 发布→追踪 ─┘  （发布英文文章需 site-i18n-bilingual S2 的 Content.locale，
                   但中文文章立即受益；评分卡对草稿即可运行）
4.x 评分卡协议 ── 文档先行，首批文章评分与 1.x/2.x 并行
```

## 验收基准

- 从策略看板一张卡片出发，不离开产品完成：写作 → 草稿 → 发布 → 在 TrackedArticle 列表看到该文章进入检测队列，全程零复制粘贴
- 看板卡片状态自动走完 `PLANNED → IN_PROGRESS → COMPLETED`
- scaletotop.com 的 GSC 关键词数据出现在 site-intelligence
- `rules/content-scorecard.md` 存在且首批 ≥3 篇英文文章有评分记录与归因结论
