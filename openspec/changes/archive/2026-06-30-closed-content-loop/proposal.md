## Why

geo-writer 是"诊断→生产→衡量"闭环的引擎,但写作流程在**两端都断**,导致用户做了事却看不到真实推进(详见 explore)。`#1 DNA 注入`已单独修复(从蓝图写作现在真正基于业务 DNA),本 change 继续接上其余断裂处:

- **加冕↔草稿匹配脆弱**:`sourcePillar` 存的是"可编辑关键词"而非支柱规范身份 → 只能靠模糊子串往回猜。精确相等会漏配("how to <topic>"),双向子串又会过配(短话题 ⊂ 长话题,如多个含 "SEO" 的支柱)→ 可能藏掉真缺口(违反"安全失败"原则)。
- **衡量刻度错 + 名实不符**:回填 URL 后,UI 主推的是二元"SERP 验证"徽章(`/api/cron/verify` 查主词在不在前 100)——它**没有调度器、实际不会自动跑**,且信号弱。而真正有用的 **GSC 逐 URL 真实表现(点击/展示/排名)** 链路已存在(生产已有 page 维度快照)却被埋没。承诺了没兑现的能力(延续 `citation-tracking-honesty` 原则)。
- **内链是假的**:`generateLinkRecommendations` 产出虚构标题模板,不指向真实内容,对成熟站浪费;若把不存在的链接插进正文还会造成死链。
- **发布→URL 摩擦高**:用户必须离开平台发布、再回来手动回填 URL → 大量流失,衡量端缺血。但发到**我们自己博客**的内容,URL 平台天然知道,可零摩擦自动连接。

## What Changes

1. **加冕身份精确化**:蓝图"开始写作"额外传**不可编辑的 `pillar=<规范话题>`**;保存时 `sourcePillar = pillar 参数`(独立于可编辑 keyword);`home.ts` 匹配改回**精确相等**(规范身份),消除漏配/过配。
2. **衡量重定高度**:已发布/已连接文章主展示 **GSC 真实点击/展示/平均排名**(复用 library 现有 page-attribution);二元"SERP 验证"徽章退为次要或移除,措辞诚实(不宣称"验证/引用"它实际没在做)。
3. **双模内链**:① 真实内链——匹配用户真实已发布/已排名页面(GSC pages / 有 URL 的 TrackedArticle),可一键插入正文;② 集群内链建议——该支柱未覆盖子话题/缺口,呈现为"去写并回链"的计划动作(**不插正文**);③ 硬约束:正文只插真实链接,杜绝死链。
4. **我们博客发布免回填**:经"保存为博客草稿"→ 在我们博客发布的内容,发布时自动把 blog URL 写入对应 `TrackedArticle.url` → 无需手动回填,直接进入 GSC 归因衡量。
5. **加冕语义流水线感知**:有"已起草未发布"支柱时,该支柱的下一步=**发布并连接**(而非催写新的);加冕(写新 gap)只在无待发布草稿时主推 —— 避免"草稿跑步机"。

## Capabilities

### New Capabilities
- `closed-content-loop`: 把 geo-writer 写作流程稳固接进诊断↔衡量闭环——规范身份匹配、真实表现衡量、双模内链、博客发布免回填、流水线感知的下一步。

### Modified Capabilities
<!-- 衡量措辞延续 citation-tracking-honesty 原则;不改其 spec 行为 -->

## Impact

- **修改**:
  - `components/coach/ContentAssetBlueprint.tsx`(传 `pillar` 规范身份 + 流水线感知 CTA)
  - `app/[locale]/(public)/tools/geo-writer/page.tsx`(读 `pillar` → sourcePillar;真实内链插入 UI)
  - `app/actions/tracked-articles.ts`(sourcePillar 取规范身份)
  - `lib/coach/home.ts`(matchesPillar 改精确相等;加冕语义)
  - `lib/skills/skills/stellar/StellarEnricher.ts` + `image-finder`/link 相关(双模内链:真实来源 + 集群建议分离)
  - library / blueprint 衡量展示(GSC 真实表现为主)
  - 博客发布流程(`actions/content.ts` 或 blog-draft 发布):发布时回写 `TrackedArticle.url`
- **数据**:无 schema 变更(复用 TrackedArticle.url/siteId/sourcePillar + SiteKeywordSnapshot page 维度)
- **不影响**:模型路由、DNA 提取、积分、cron 算法本身
- **风险**:中。多处写作流程接线 + 加冕语义调整,需回归"无草稿时加冕正确""正文不出现死链"
- **关联**:承接已修的 `#1 DNA 注入`;延续 `citation-tracking-honesty`;落地 backlog「文章→URL 原语」「ourStrengths/内链」部分
- **明确 Deferred(backlog,不在本 change)**:调度器(GSC 持续同步/周报/cron 自动跑)、proofDensity 回流证据轴、分发片段闭环、GSC 自动匹配 URL、直连 CMS 发布、成熟站全量内容盘点入覆盖(#4)、首页"内容流水线看板"完整形态
