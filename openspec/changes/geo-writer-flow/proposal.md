## Why

geo-writer 的 3 步向导(研究→策略→生成)本身能跑,但它是个**孤立的单篇写作器**,和"诊断智能 / 集群模型 / 衡量闭环"三头都没接上(explore R2 确认):

- **断层① 冗余研究**:从蓝图/策略板带 `siteId/pillar/plannedArticleId` 进来时,诊断阶段**已经调研过**(竞品、语义缺口、DNA、SERP)。但写手只**预填**关键词、**仍停在 step1 让用户重跑研究** → 冗余、慢、体验割裂。
- **断层② 单篇孤立**:写手不知道自己在写哪个**集群**、fan-out 缺什么、兄弟文章是谁 → 写成孤立单篇(而 AI 更青睐话题集群)。集群数据(蓝图 idealTopicMap / 双模内链 / topic-source-grounding 的 fan-out)已存在,但没接进写作流。
- **断层③ 闭环交接弱**:写完止于"保存到内容库";到"发布→回填 URL→衡量"的下一步(closed-content-loop 已建的流水线)交接不明确。

核心不是向导坏,而是它**没利用我们已经算好的上游智能、也没交接给下游闭环**。

## What Changes

1. **断层① loop 快捷道**:从蓝图/策略板(有 siteId/pillar/plannedArticleId)进入时,**复用站点诊断智能**(已算的竞品/语义缺口/DNA/(可选)缓存 SERP)预填研究结果 → **跳过或折叠 step1**,直达大纲/策略。直接手动进入(无上下文)时保留完整 3 步。
2. **断层② 集群感知**:写作界面呈现"所属支柱 + 兄弟文章(真实内链)+ 集群缺口(去写)"——复用已建的**双模内链** + `topic-source-grounding` 的 fan-out/集群数据;写手 prompt 感知集群(与 `geo-methodology-upgrade` 的 fan-out 覆盖协同)。
3. **断层③ 闭环交接**:保存成功后明确下一步 **"发布并连接(回填 URL)"**(承接 closed-content-loop 的流水线感知),而非停在 toast。

## Capabilities

### New Capabilities
- `geo-writer-flow`: 把写作向导接进闭环——从诊断智能进入(免重复研究)、集群感知写作、向发布+衡量明确交接。

### Modified Capabilities
<!-- 改的是"流程/入口/上下文接线",不改单步的生成/评分逻辑 -->

## Impact

- **修改**:`geo-writer/page.tsx`(入口分支:有上下文→复用诊断智能、跳/折叠 step1;集群侧栏;保存后交接)、可能新增/复用"取站点诊断智能"的数据入口(竞品/gap/DNA 已有 API)、`messages`(en/zh)。
- **复用**:站点诊断数据(competitors/semanticDebt/DNA 已存)、双模内链(closed-content-loop)、fan-out/集群(topic-source-grounding)、发布+回填(closed-content-loop)。
- **不影响**:单步的生成/流式/GEO 评分逻辑(那是 methodology)、视觉/i18n(那是 polish)、模型路由、积分。
- **风险**:**高**(3 件里最高)。改的是核心生产界面的**流程与状态机**(跳步、上下文注入),易碰坏向导的复杂 state;需大量回归(从蓝图/策略板/手动 三种入口)。
- **依赖/排序**:
  - 与 `geo-writer-polish`、`geo-methodology-upgrade` **改同一文件,不可并行**;建议**最后做**(polish 清债 → methodology 提质 → flow 改流程,层层稳固)。
  - 协同:`topic-source-grounding`(集群/fan-out 数据)、`closed-content-loop`(发布交接,已建)。
- **关联**:兑现"写手是闭环一环"而非孤立工具;呼应 CLAUDE.md 的 Diagnose→Produce→Measure 定位。
- **Deferred(backlog)**:结果区 5 tab 精简(power-user 项后置)、组件拆分(属 polish 的 deferred)、真正的"集群批量生产"(一次规划整簇)。
