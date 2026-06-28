## Why

激活闭环(产出→衡量→学习)在两处断裂,导致用户"做了事却看不到推进":

1. **加冕支柱永远不变**:总览的"Fastest Next Step"= top SemanticDebt(覆盖低×需求高)。但覆盖度只认 `seedKeywords + GSC 关键词 + 审计实体`,**完全不认用户生产的草稿/文章**。写完一篇草稿后,覆盖度零变化 → 同一 gap 仍最高 → 加冕永远停在同一个(如 "GEO")。三态闭环里平台只认最后一态:
   ```
   ① 写了草稿(平台知道) → ② 发布到自有站(平台失明) → ③ GSC 测到排名(数周后才更新覆盖)
   ```
   ①→③ 之间完全失明(backlog「文章→URL 映射」原语缺失)。

2. **内容计划语言错**:`strategy/generate` 用 `localeDirective(session.user.locale)`,且 else 分支默认中文。中文用户运营**英文站**(scaletotop,DNA `sourceLocale=en`)时,一键生成的计划仍是中文。计划语言应跟**站点内容语言**(DNA sourceLocale),不是操作者 UI 语言。

## What Changes

**A · 草稿感知的加冕(闭环前进一步)**
- 把"已产出"接入覆盖判定:某支柱已有对应 `TrackedArticle`(草稿)→ 标记为"进行中/已起草"状态,**从加冕候选中排除** → 加冕推进到下一个真实 gap。
- `TrackedArticle` 增加 `siteId` 关联;geo-writer 从加冕支柱生成时记录 siteId + 支柱话题,用于支柱↔草稿匹配。

**C · 发布 URL 回填 + 验证(诚实闭合)**
- 草稿生成后展示草稿,并提示用户:**"发布到您的站点后,把文章 URL 回填——用于验证其搜索收录与排名"**(明确是验证用途)。
- 回填写入 `TrackedArticle.url` → 复用现有 cron `/api/cron/verify`(DataForSEO 查 Google SERP 收录/排名)→ 更新 `status`/`citationSource`。
- **诚实措辞**:统一为"收录/排名验证(Google 搜索)",不宣称"AI 引用"(延续 `citation-tracking-honesty` 原则)。
- 支柱三态:`未覆盖(可加冕)` → `已起草·待发布/回填URL` → `已发布·已验证收录排名`。

**#2 · 计划语言按站点内容语言**
- `strategy/generate` 改用 `latestOntology.sourceLocale`(此处已取到)驱动 `localeDirective` 与文章默认 language,UI locale 仅作兜底。

## Capabilities

### New Capabilities
- `activation-loop-closure`: 草稿感知加冕 + 发布 URL 回填验证原语 + 内容计划语言按站点 DNA 语言。

### Modified Capabilities
<!-- 不改 citation 验证后端行为(cron 既有),仅接通 URL 回填与诚实措辞 -->

## Impact

- **Schema(需迁移,确认环境)**:`TrackedArticle += siteId String?`(+ 索引);可选 `sourcePillar String?` 记录来源支柱话题。
- **新增/修改**:
  - `actions/tracked-articles.ts`:`saveTrackedArticle` 接受/写入 siteId + sourcePillar;新增 `backfillArticleUrl(articleId, url)` action。
  - `lib/coach/home.ts` + `components/coach/ContentAssetBlueprint.tsx`:加冕排除已起草支柱、支柱三态展示 + 回填 CTA。
  - `tools/geo-writer`:从蓝图带 siteId/pillar 进入并在保存时透传。
  - `library`(ArticleList/LibraryEditor):草稿展示 + URL 回填入口 + 验证状态。
  - `strategy/generate/route.ts`:语言改用 sourceLocale(#2)。
- **复用(不改)**:cron `/api/cron/verify`(url→SERP 验证后端已就绪)。
- **不影响**:模型路由/兜底、DNA 提取、积分。
- **风险**:中。涉及 schema 迁移(生产库需确认)+ 加冕逻辑变更(需回归"无草稿时仍正确加冕")。
- **关联**:落地 backlog「文章→URL 映射原语」;延续 citation 诚实化;#2 延续"单一规范 DNA + 输出桥接"。
- **远期(记 backlog,不在本 change)**:GSC 关键词→页面自动匹配降低回填摩擦;直连 CMS 发布彻底闭环;真做大模型 GEO 引用。
