## Context

引擎已存在但埋着 + 两个闲置资产（本次 explore 追实）：

```
idealTopicMap (DNA) − 覆盖 = SemanticDebt {
    coverageScore  ✅ 用于 OverviewPanel/strategy
    proofDensity   ❌ 算了从不展示  ← 闲置（真·GEO 信号）
    gscImpressions ✅ 排序
    relevance      ✅
}
SiteOntology.logicChains (Problem→Solution→Proof)  ❌ 写了从不消费  ← 闲置
教练 write_gap_high_intent 招式：仅用 topGap 露一条头
ContentPlan：手动"生成战略计划"才有 → Day1 空板
```

蓝图呈现目标（资产负债表式，呼应"可衡量内容资产"定位）：

```
你的内容资产蓝图                       内容权益 3/8 支柱 · 本月 +2 ▲
🎯 最快下一步:「内容营销 ROI 怎么衡量」 需求高·难度低·未覆盖 [一键生成计划→]
支柱(idealTopicMap)        覆盖   证据   需求   难度   动作   为什么重要(logicChains)
● 内容资产管理框架         ██░░  ░░░░  高     中    [写作]  → 问题:99%内容无ROI…
● GEO 优化方法论           ████  ██░░  中     高    [补证据]
● 出海 SEO 本地化          ░░░░  ░░░░  高     低    [写作]🔥
○ 语义治理与去重           █████ ████  —      —     ✓已建立
```

## Goals / Non-Goals

**Goals:**
- 真空期（GSC 前）主页有"基于你业务的、可执行的内容路线图"。
- 以 DNA 为核心，竞品/GSC 为衡量；激活 proofDensity（证据/GEO）与 logicChains（为什么）。
- 领先指标即时反馈：用户一写/一发布，内容权益就涨。
- 一键把缺口转成内容计划，衔接策略板（补空板）。

**Non-Goals:**
- 每周简报召回（P3b）。
- 业务类型（单独轨）。
- "修剪/翻新/去重"类动作（backlog；接已有 refresh_decay / internal_link 招式）。
- 不新建数据管线——只消费已算好的 SemanticDebt / ontology。

## Decisions

### 决策 1：双轴 = 覆盖度 × 证据密度（都来自 SemanticDebt，DNA 派生）
覆盖度=写没写；证据密度=有没有数据/案例（proofDensity）。证据轴是真·GEO 信号（AI 优先引用有证据的内容），把 GEO 差异化做实，且**零新建数据**。

### 决策 2：竞品/GSC 退为"衡量列"
需求列 = `gscImpressions`（无 GSC 时退化为搜索量/留空）。兑现"竞品做辅助、非来源"。

**MVP 范围修正（2026-06-25）**：MVP 仅做 覆盖 × 证据 × **需求** 三信号。**难度列砍出 MVP**——无可靠现成数据源（`SiteKeyword.difficulty` 常空、竞品逐话题覆盖需新管线），best-effort 反而拖累首版。难度列进 backlog（"内容引擎其他增强"）。

### 决策 3：加冕单一"最快下一步"
按 需求高 × 覆盖低 × 难度低 选一个，醒目置顶 + 单 CTA。避免 8 支柱×子话题的信息过载（其余渐进展开）。

### 决策 4：glass-box —— 每支柱给"为什么重要"（2026-06-25 修正）
**主用 `SemanticDebt.relevance`**——它本就是每个支柱一条的"为什么关键"，可靠、零成本。
**不**按支柱匹配 `logicChains`：logicChains 是站点级 `[{problem,solution,proof}]`，与 idealTopicMap 的 topic **无 key 关联**，逐支柱匹配需再调 LLM（成本高、易错）。logicChains 仅作**站点级补充叙事**（可选展示），不做 per-pillar 映射。把"logicChains 进写作骨架/per-pillar 映射"留 backlog。

### 决策 5：领先指标 + 期望合约
头部显示"内容权益 N/总支柱 + 本月增量"。首屏一句期望管理（排名要 4–8 周）。这是慢反馈产品的留存核心：让用户在输出（流量）滞后时，看到输入（资产）在涨。

### 决策 6：阶段感知放置
stage 0/unmeasured → 蓝图是主角（填空窗）；有 GSC 数据 → 退为与 GscPerformanceSummary 并列的常驻区。蓝图不消失（它是长期"该建什么"的路线图）。

### 决策 7：一键生成计划复用 `strategy/generate`
CTA 调用现有 `strategy/generate`（debts → ContentPlan），不新建生成逻辑；把"空板"缺环接上。

## Risks / Trade-offs

- **依赖 DNA 质量**：idealTopicMap 弱 → 蓝图单薄。缓解：P-DNA 先行（可编辑/可信 DNA）。
- **难度数据不可靠**：竞品覆盖/难度无现成可信源。缓解：best-effort，不可得就省列，绝不为它新建重管线。
- **信息过载**：支柱+子话题多。缓解：加冕单一下一步 + 渐进展开 + 折叠子话题。
- **空状态**：全空（冷启动极早期）。缓解：空态引导"先确认业务基因 / 跑审计"，与 P-DNA 衔接。
- **proofDensity 可信度**：它是 LLM 估的（getSemanticGap）。作为相对信号/方向用，不宣称绝对精确。
