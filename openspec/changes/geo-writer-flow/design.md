## Context

- 入口 useEffect 只**预填** keyword/pillar/siteId/plannedArticleId 到 form,**仍停 step1**(研究)。`cachedIntelligence` 只在用户跑完 step1 研究后才有。
- 站点诊断智能**已存在**:竞品(`Competitor`)、语义缺口(`SemanticDebt`)、DNA(`SiteOntology`),有对应 API(`api/dashboard/sites/[siteId]/*`)。写手没复用它们。
- 集群骨架**已建**:蓝图 idealTopicMap/双模内链(closed-content-loop)、topic-source-grounding 的 fan-out/isComparison。
- 发布交接**已建**:closed-content-loop 的"发布并连接/回填 URL"+ 流水线感知加冕。
- 3 步向导 state 复杂(step/viewMode/form/streaming/editing/version)。

## Goals / Non-Goals

**Goals:**
- 从 loop 进入免重复研究(复用诊断智能)。
- 写作时集群感知(所属支柱/兄弟/缺口)。
- 保存后向发布+衡量明确交接。

**Non-Goals:**
- 不改单步生成/流式/GEO 评分(methodology)。
- 不改视觉/i18n(polish)。
- 不做结果 5 tab 精简、组件拆分(deferred)。
- 不做"整簇批量生产"(未来)。

## Decisions

1. **入口分支(有上下文 vs 手动)**:
   - 有 `siteId`(+可选 pillar/plannedArticleId)→ **loop 模式**:拉站点诊断智能(竞品/gap/DNA/(可选)缓存 SERP)组装成 research 结果,预置 `cachedIntelligence` + 生成初始大纲 → **跳过或折叠 step1**,落在 step2(策略/大纲)。
   - 无上下文(手动打开)→ 保留完整 step1 研究。
   - 降级:诊断智能缺失/拉取失败 → 回退正常 step1(不阻断)。
2. **复用而非重算**:loop 模式优先用**已存**的 Competitor/SemanticDebt/DNA,避免重复调 DataForSEO(省钱省时);仅在明显缺失时按需补研究。
3. **集群侧栏**:写作界面显示"所属支柱 + 兄弟真实内链 + 集群缺口(去写)"——复用 `ContentAssetBlueprint` 已有的数据与双模内链组件形态,不新建数据管道。
4. **闭环交接**:保存成功 → 明确 CTA "发布并连接(回填 URL)"(链到 closed-content-loop 的回填入口/内容库),替代仅 toast。
5. **排序(硬约束)**:与 polish/methodology 同文件 → **最后做、串行**。先 polish(展示稳)→ methodology(生成稳)→ flow(改流程),避免在动荡的文件上改状态机。

## Risks / Trade-offs

- **状态机风险(最高)**:跳步/注入上下文易碰坏向导复杂 state(streaming/editing/version 的前置假设)。策略:loop 模式作**新分支**,尽量不改手动模式路径;充分回归三入口。
- **诊断智能新鲜度**:复用已存竞品/gap 可能过时 → 提供"重新研究"逃生口(用户可强制跑 step1)。
- **折叠 vs 跳过 step1**:折叠(可展开看/改研究)比硬跳更安全,建议折叠 + 允许展开。
- **文件重叠**:与 polish/methodology 串行,否则合并地狱。
- **范围蔓延**:flow 容易滑向"重写整个向导"——严格限定在"入口复用 + 集群侧栏 + 交接"三点,不碰单步逻辑。

## Implementation Notes (for Gemini / Antigravity)

**已知遗留冲突:**
- 本 change 与 `geo-writer-polish`、`geo-methodology-upgrade` 改**同一文件**,**必须串行**(建议 flow 最后)。
- loop 模式复用**已存**的 Competitor/SemanticDebt/DNA(有 API),**不要**重复调 DataForSEO 重跑研究。
- siteId 来自上下文(dashboard,已在 tools-placement 修);pillar 是规范身份(closed-content-loop);发布交接用 closed-content-loop 已建入口。

**禁止触碰范围:**
- 不改单步生成/流式/编辑/GEO 评分(methodology)、视觉/i18n(polish)、模型路由、积分。
- 不重写向导为全新形态;只加"loop 入口分支 + 集群侧栏 + 交接",尽量不动手动模式路径。

**本 change 边界(只允许改动):**
- `src/app/[locale]/(public)/tools/geo-writer/page.tsx`(入口分支/集群侧栏/交接)。
- 复用/轻量新增"取站点诊断智能"的读取(竞品/gap/DNA 已有 API)。
- `messages/{en,zh}.json`(相关文案,用「您」)。

**其他注意事项:**
- loop 模式作独立分支,手动模式保持不变;提供"重新研究"逃生口。
- 三入口回归:蓝图"开始写作"、策略板 plannedArticle、手动打开。
- `tsc` 保持仅 1 预存 auth.ts 错误;i18n-auditor + design-checker。
- 验证:从蓝图进入免重复研究、集群侧栏显示兄弟/缺口、保存后有"发布并连接"交接;手动入口完整流程不回归。
