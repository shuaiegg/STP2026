## Context

闭环现状(已查证):
- 加冕支柱 = `home.ts` 蓝图里 top 未覆盖 SemanticDebt(覆盖×需求)。覆盖度来自 `getSemanticGap` 的 `ourTopics`(seedKeywords + GSC SiteKeyword + 审计实体)——**不含用户产出**。
- `saveTrackedArticle`(`actions/tracked-articles.ts`)创建 `TrackedArticle`(userId,**无 siteId**,status=PENDING,url 空),可选关联 `PlannedArticle`(articleId + status IN_PROGRESS)。
- `TrackedArticle` 模型已含 `url? / status / citationSource / keywords[] / lastCheckedAt / checkCount`。
- cron `/api/cron/verify` 已实现:取 `url != null && status∈{PENDING,CHECKING}` → DataForSEO 查 Google SERP → 命中前 100 即更新 status/citationSource。**URL 一旦回填,验证自动跑。**
- 展示面:`TrackedArticle` 出现在 library(ArticleList / LibraryEditor)与 dashboard。
- `strategy/generate` 已取 `latestOntology.sourceLocale`(用于 gap),但语言指令用的是 `session.user.locale`。

## Goals / Non-Goals

**Goals:**
- 写完草稿 → 加冕推进到下一 gap(用户立刻看到闭环前进)。
- 草稿 → 提示回填发布 URL → 接通既有 SERP 验证,诚实标注用途。
- 支柱三态(未覆盖 / 已起草待发布 / 已发布已验证)清晰可见。
- 计划语言跟站点 DNA 语言。

**Non-Goals:**
- 不改 cron 验证算法(SERP 收录/排名,已就绪)。
- 不宣称"AI 引用"(延续诚实化)。
- 不做 GSC 关键词→页面自动匹配(降摩擦,记 backlog 远期)。
- 不做直连 CMS 发布(远期)。
- 不引入真·大模型 GEO 引用(远期 epic)。

## Decisions

1. **支柱↔草稿↔站点 关联**:
   - `TrackedArticle += siteId String?`(index)+ `sourcePillar String?`(来源支柱话题,生成时带入)。
   - geo-writer 从蓝图"开始写作"进入时已带 `?keyword=<pillar topic>`;再透传 siteId(从蓝图 link)→ 保存时写入 `TrackedArticle.siteId + sourcePillar`。
   - 匹配:某支柱"已起草" ⇔ 存在该 site 的 TrackedArticle,其 `sourcePillar==topic` 或 `keywords`/`title` 归一化包含 topic(优先精确 sourcePillar,回退模糊)。

2. **A · 草稿感知加冕**(`home.ts` + 蓝图):
   - 支柱状态机:
     ```
     未覆盖(coverageScore < 阈值, 无草稿)         → 可加冕(crown 候选)
     已起草(有 TrackedArticle, url 空)            → "进行中·去发布并回填URL", 排除加冕
     已发布待验证(url 有, status PENDING/CHECKING) → "验证中"
     已验证/已覆盖(status CITED 或 GSC 覆盖达标)   → "已建立"
     ```
   - `crownedTopic` = 最高 优先级的 **未覆盖且无草稿** 支柱 → 写了就换下一个。
   - 安全失败延续:无 debt 匹配仍按"未覆盖"(不藏 gap);新增的"已起草"只在确有 TrackedArticle 时生效。

3. **C · URL 回填**:
   - 新 action `backfillArticleUrl(articleId, url)`:校验归属 + URL 合法 → 写 `TrackedArticle.url`,status 保持 PENDING(cron 下次跑)。
   - 入口:① 草稿生成成功页;② library 文章行;③ 蓝图"已起草"支柱的 CTA。
   - 文案诚实:"发布后把 URL 贴这里,我们会验证它在 Google 搜索的收录与排名"。**不**出现"AI 引用/实时 AI 监测"。

4. **#2 计划语言**:
   - `localeDirective(latestOntology.sourceLocale ?? session.user.locale)`;
   - 文章 `language: art.language || latestOntology.sourceLocale || session.user.locale || 'en'`(去掉"默认 zh"偏置)。

5. **诚实度分层(关键)**:加冕前进只表示"已起草",**不**等于"已生效"。UI 必须区分"已起草·待发布"与"已验证收录排名"——避免给用户"写了就赢了"的错觉。真覆盖仍以 URL 回填 + SERP 验证为准。

## Risks / Trade-offs

- **Schema 迁移(生产库)**:`TrackedArticle += siteId/sourcePillar`,需 `migrate dev`/`deploy`,**执行前必须向用户确认环境**(生产库纪律)。nullable + 仅新增列,存量行不受影响。
- **加冕回归**:改加冕逻辑须保证"无任何草稿时"行为与现状一致(top 未覆盖 gap)。加测试/冒烟。
- **匹配模糊性**:sourcePillar 精确最佳;keyword/title 模糊匹配可能误判"已起草"。优先精确字段,模糊仅兜底。
- **回填摩擦**:用户需手动贴 URL。可接受(MVP);降摩擦(GSC 自动匹配)记 backlog。
- **诚实陷阱**:务必区分"已起草 vs 已验证",否则加冕前进会变成虚假进度。

## Implementation Notes (for Gemini / Antigravity)

**已知遗留冲突:**
- `TrackedArticle` 无 siteId 是历史设计;新增 nullable `siteId`/`sourcePillar` 不破坏 `saveTrackedArticle` 现有调用(旧调用 siteId=null,退化为仅 userId 行为)。
- cron `/api/cron/verify` 已是"SERP 收录/排名"验证(非 AI 引用)——**不要**改其语义,只接通 url 来源 + 对齐诚实措辞。
- 加冕/覆盖的"安全失败"原则(无匹配=未覆盖)必须保留;"已起草"是叠加态,只在确有 TrackedArticle 时降级出加冕池。

**禁止触碰范围:**
- 不改 cron 验证算法、DataForSEO 调用。
- 不改模型路由/兜底、DNA 提取、积分。
- 不宣称 AI 引用/实时 AI 监测(沿用 citation-tracking-honesty 措辞)。

**本 change 边界(只允许改动):**
- `prisma/schema.prisma`(TrackedArticle += siteId/sourcePillar)+ 迁移。
- `src/app/actions/tracked-articles.ts`(saveTrackedArticle 透传 + 新 backfillArticleUrl)。
- `src/lib/coach/home.ts` + `src/components/coach/ContentAssetBlueprint.tsx`(三态 + 加冕 + 回填 CTA)。
- `src/app/[locale]/(public)/tools/geo-writer/page.tsx`(透传 siteId/pillar)。
- `src/app/(protected)/dashboard/library/*`(草稿展示 + 回填入口 + 验证状态)。
- `src/app/api/dashboard/sites/[siteId]/strategy/generate/route.ts`(#2 语言)。
- 文案进 messages(en/zh,用「您」,诚实措辞)。

**其他注意事项:**
- 迁移前停下来确认环境(生产 154.12.243.94)。
- 区分"已起草"与"已验证"是头号 UX 正确性要求。
- 改完跑 i18n-auditor(公开/blueprint 文案)+ design-checker;`tsc` 保持仅 1 预存 auth.ts 错误。
- 冒烟:加冕支柱→写草稿→加冕前进到下一个;草稿→回填 URL→library 显示验证中;切站点语言/英文站计划出英文。
