## Why

SEO/GEO 是慢反馈生意（真实排名 4–8 周）。最大的留存风险在"激活 → 见效"之间的**真空期**：新用户 onboarding 后，GSC 还没数据，主页 Pulse 接近 0，没有"今天能做、且看得到进展"的事 → 流失。

而产品其实**已经有一套以业务基因为核心的内容引擎**，只是埋着：

```
SiteOntology.idealTopicMap(DNA：该覆盖什么) − 你的实际覆盖 = SemanticDebt（缺口）
SemanticDebt 已带：coverageScore（覆盖度）、proofDensity（证据密度）、gscImpressions（需求）
```

问题：
1. 这套信号只通过**一条**教练招式（`write_gap_high_intent`）露头，完整内容计划还要手动点"生成"（Day1 是空板）。
2. `proofDensity`（证据密度）和 `logicChains`（Problem→Solution→Proof）**算出来/存下来了，却从未被消费**——两个闲置的高价值资产。
3. 旧的 "GEO 引用追踪" 名实不符（实为 Google 排名，见 backlog）；而 `proofDensity` 才是**真正的 GEO 信号**（内容够不够格被 AI 引用）。

本变更把这套引擎做成 GrowthHome 的**招牌主视图——"内容资产蓝图"**（资产负债表式，呼应 DNA 自身"可衡量内容资产"的定位），以**业务基因为核心、竞品/GSC 做衡量辅助**，填补真空期并为慢反馈产品提供**领先指标**式的即时反馈。

## What Changes

- **GrowthHome 新增"内容资产蓝图"面板**：列出 idealTopicMap 的支柱，每条显示 **覆盖度（coverageScore）× 证据密度（proofDensity）** 双轴 + **需求（gscImpressions）/ 难度（best-effort：关键词难度/竞品覆盖）** 衡量列。
- **加冕一个"最快的下一步"**：需求高 × 难度低 × 未覆盖 的支柱，单一醒目 CTA。
- **"为什么对你重要"**：每支柱用 `logicChains` / `relevance` 给出理由（glass-box 推荐，激活闲置的 logicChains）。
- **证据轴 + "补证据"动作**：激活 `proofDensity`，把 GEO 差异化做实（"这篇够不够被 AI 引用"）。
- **领先指标头部**：内容权益（已覆盖 N/总支柱）+ 本月增量 ▲——慢反馈下的即时进展感。
- **期望管理首屏**：一句"真实排名约需 4–8 周，在此之前看这些领先指标"。
- **"一键生成计划" CTA**：把蓝图缺口转成 `ContentPlan`，补上"空板"缺环、衔接策略板。
- **阶段感知放置**：stage 0/unmeasured 时蓝图是主页主角；有 GSC 数据后退为与表现图并列的常驻区。

## Capabilities

### New Capabilities

- `content-asset-blueprint` — GrowthHome 上以 DNA 为核心、覆盖×证据双轴的内容资产蓝图，竞品/GSC 为衡量辅助，并可一键转为内容计划。

### Modified Capabilities

- GrowthHome 渲染：在招式/Pulse 之外新增蓝图区，阶段感知。

## Impact

- **定位**：dashboard（非公开、中文 UI），无 i18n 路由影响。
- **数据**：消费已有 `SemanticDebt`（coverage/proof/gscImpressions/relevance）+ `SiteOntology`（idealTopicMap/logicChains）——**几乎零新建数据**。难度列为 best-effort（`SiteKeyword.difficulty` 或竞品覆盖；不可得则省略）。
- **文件**（预估）：`lib/coach/home.ts`（聚合蓝图数据）、`components/coach/GrowthHome.tsx` + 新蓝图组件、`strategy/generate`（"一键生成计划"复用现有路由）。
- **依赖**：`business-dna-governance`（P-DNA）——蓝图的价值依赖**可信的 DNA**；建议 P-DNA 先落地。
- **不含**：每周简报（P3b，依赖本变更 + 调度器）、业务类型（单独轨）、"修剪/翻新"类动作（backlog）。
