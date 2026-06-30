## Context

geo-writer 现状(explore 查证):
- 进入路径有两条:蓝图"开始写作"(`?keyword=<topic>&siteId=<uuid>`)与策略板(`?plannedArticleId=`)。
- `sourcePillar` 当前 = `selectedKeyword || form.keywords`(**用户可编辑**)→ 漂移(实测出现 "how to <topic>")。
- `home.ts.matchesPillar` 当前为双向子串(本轮临时修)→ 短话题过配风险(8 个 ideal 话题里 3 个含 "SEO"、2 个含 "AI")。
- 衡量:① `/api/cron/verify` 二元 SERP(无调度,实际不跑)② library `page.tsx` 用 URL pathname 匹配 `SiteKeywordSnapshot(dimensionType='page')` 得真实 clicks/impressions/position(生产已有数据)。
- 内链:`StellarEnricher.generateLinkRecommendations` 输出模板虚构标题(无真实 URL)。
- 博客草稿:`saveToBlogDraft` → Content(我们博客),发布走 `actions/content.ts` 的发布转换(set PUBLIC + publishedAt)。
- `#1 DNA 注入`已修(生成请求传真实 site UUID)。

## Goals / Non-Goals

**Goals:**
- 加冕↔草稿用**规范身份**精确链接,杜绝漏配/过配。
- 衡量以**用户真正在意的真实表现**(GSC 点击/展示/排名)为主,诚实。
- 内链兼顾**真实可插**与**集群建议**,正文绝不出死链。
- 我们博客发布的内容**零摩擦**进入衡量(自动 URL)。
- 下一步建议**流水线感知**,不奖励空转草稿。

**Non-Goals:**
- 不引入调度器(自动周期同步/通知)——deferred(backlog),本期用现有按需同步。
- 不强化二元 cron(存位次/多词)——若保留该弱链路再说。
- 不做 GSC 自动匹配 URL、直连 CMS、成熟站全量内容盘点(#4)——deferred。
- 不做完整"内容流水线看板"UI——本期取"加冕 + 待发布连接提醒"的保守形态(决策 A)。
- 无 schema 变更。

## Decisions

1. **规范身份传参(决策核心)**:
   - 蓝图所有"开始写作/补证据"链接除 `keyword=<topic>` 外,**新增 `pillar=<topic>`**(同值但语义=不可编辑身份)。
   - geo-writer 读 `pillar` 存入独立 state `sourcePillarId`;保存(library / blog-draft 双路径)时 `sourcePillar = sourcePillarId`(**不**用可编辑的 selectedKeyword)。
   - `home.ts.matchesPillar`:**精确相等优先**(`norm(sourcePillar) === norm(topic)`);keywords/title 仅作**无 sourcePillar 的旧数据**兜底(legacy),不参与新数据匹配 → 消除过配。

2. **衡量重定高度(决策 A:保守形态)**:
   - library 文章行 + 蓝图支柱:已连接 URL 的文章**主展示 GSC 真实 clicks/impressions/position**(复用 page-attribution);
   - 二元状态徽章:`CITED/CHECKING/NOT_CITED` 退为次要小标或移除;`PENDING(有URL)` 文案从"等待 SERP 验证"改为中性"表现采集中"(不承诺它在主动验证);
   - 无 GSC 数据时:显示"连接 GSC 后可见真实表现",不展示二元伪状态。

3. **双模内链**:
   - **真实内链来源**:用户该站的 `TrackedArticle(url 非空)` + GSC `SiteKeywordSnapshot(page)` 的真实页面;按与当前 keyword/entities 的话题相关度挑 3-5 条 → 提供"插入正文"(anchor + 真实 URL)。
   - **集群建议来源**:该支柱 idealTopicMap 子话题 / 关联 SemanticDebt 中**未覆盖**项 → 呈现"内容集群机会:去写 [X] 并回链",动作=进入生产(可选写入 PlannedArticle),**不生成正文链接**。
   - 替换 `generateLinkRecommendations` 的模板产出;`autoVisuals` 仍隐藏。

4. **博客发布免回填**:
   - blog-draft → Content 发布转换时(`actions/content.ts` publish 路径):若该 Content 由 geo-writer 博客草稿生成且存在对应 TrackedArticle(经 plannedArticleId 或新关联),发布成功后**自动 set `TrackedArticle.url = <blog 公开 URL>`**(`/blog/[slug]` 或 `/zh/blog/[slug]`),并 revalidate library + coach-home。
   - 关联方式:blog-draft 保存时已可带 siteId/sourcePillar(复用 activation-loop 的登记);发布时按内容映射回写 URL。

5. **加冕语义流水线感知**:
   - 蓝图:`drafted` 支柱主 CTA = "发布并连接"(已有回填入口强化);
   - `crownedTopic`(写新 gap)只在该站**无 drafted 待发布支柱**时高亮为"最快下一步";否则首要提示"先把已起草的 N 篇发出去并连接"。
   - 保持"无任何草稿 → 加冕=top uncovered gap"与现状一致(回归)。

## Risks / Trade-offs

- **规范身份依赖话题字符串稳定**:DNA 重新提取后话题串可能变 → 旧 sourcePillar 失配。可接受(重提取本就重置蓝图);legacy 兜底缓冲。
- **真实内链相关度**:靠话题/关键词相似挑选,可能不够准 → 给用户选择权(建议而非强插),且只插用户确认的。
- **博客发布回写 URL 的映射**:需可靠地把"发布的 Content"对回"TrackedArticle"。优先经 plannedArticleId/显式关联;映射不到则跳过(不报错,用户仍可手动回填)。
- **衡量措辞**:务必不暗示"我们在主动验证 SERP"(那条没跑)。中性"表现采集中 / 连 GSC 看真实表现"。
- **加冕语义改动**:回归"无草稿"路径;避免"待发布提醒"喧宾夺主。

## Implementation Notes (for Gemini / Antigravity)

**已知遗留冲突:**
- `form.siteId` 是"目标网站域名"文本框(域名),**勿**与站点 UUID 混用;UUID 走 `fromBlueprintSiteId`(已修 #1)。新增的 `pillar` 身份同理独立于可编辑 keyword。
- `matchesPillar` 本轮临时改成的双向子串需**收回为精确相等(+legacy 兜底)**——双向子串是过渡,过配有害。
- 二元 cron `/api/cron/verify` 无调度、实际不跑:衡量 UI **不要**再以它为主;不删该路由(留待 deferred 的调度器),只在 UI 退场其措辞。
- 正文**绝不**插入不存在的链接(死链)——与 autoVisuals 占位图同类禁忌。

**禁止触碰范围:**
- 不改模型路由/兜底、DNA 提取、积分、cron 算法。
- 不引入 schema 变更、不引入调度器。
- 不动 citation-tracking-honesty 已定的诚实措辞方向(延续即可)。

**本 change 边界(只允许改动):**
- `components/coach/ContentAssetBlueprint.tsx`、`lib/coach/home.ts`
- `app/[locale]/(public)/tools/geo-writer/page.tsx`
- `app/actions/tracked-articles.ts`、`app/actions/content.ts`(发布回写 URL)、blog-draft 发布相关
- `lib/skills/skills/stellar/StellarEnricher.ts` + 内链来源相关(`lib/external/image-finder.ts` 同目录的 link 逻辑)
- library 展示(`ArticleList.tsx` / `library/page.tsx`)、messages(en/zh,用「您」,诚实措辞)

**其他注意事项:**
- 改完 `npx tsc --noEmit` 保持仅 1 预存 auth.ts 错误。
- 跑 i18n-auditor(蓝图/library/公开文案)+ design-checker(内链 UI/衡量展示/加冕)。
- 冒烟:蓝图开始写作(带 pillar)→保存→加冕精确推进;博客发布→URL 自动连;已连接文章显示 GSC 真实表现;内链面板真实可插 + 集群只建议不插死链;无草稿站点加冕回归正常。
- 更新 backlog:勾掉本期落地项;deferred 项保留。
