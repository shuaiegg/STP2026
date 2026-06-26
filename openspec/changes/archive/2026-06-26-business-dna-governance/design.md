## Context

DNA 流向（本次 explore 追实）：

```
SiteOntology (DNA) ──┬─► getSemanticGap        (idealTopicMap − 覆盖 = SemanticDebt)
                     ├─► strategy/generate     (coreOfferings/targetAudience + debts → 计划)
                     ├─► StrategyComposer       (<business_dna> 进写作 prompt，已归档)
                     └─► content-asset-blueprint (P3a，待做)
```

现状缺口：
- `ontology` POST（[ontology/route.ts](src/app/api/dashboard/sites/[siteId]/ontology/route.ts)）只做 LLM 重抽，无编辑入口。
- `OverviewPanel` 只读展示。
- `define_ontology` 招式（[registry.ts](src/lib/coach/registry.ts)）`detect: !ctx.hasOntology`——一旦有 ontology 就消失，且没有"确认"语义，"去确认"无处可去。
- 版本基建已就位（`SiteOntology.version`）。

## Goals / Non-Goals

**Goals:**
- 用户能结构化编辑 DNA 关键字段并保存为新版本。
- "确认 DNA" 真正可完成，兑现 `define_ontology` 招式。
- 编辑 idealTopicMap 后，缺口分析自动重算（保持下游一致）。

**Non-Goals:**
- 业务类型字段（B2B/B2C/本地…）——单独轨，会回调 P2，本期不做。
- 内容资产蓝图呈现——P3a。
- logicChains 编辑——本期只读展示（编辑排 backlog）。
- 不改 LLM 提取逻辑本身。

## Decisions

### 决策 1：结构化 chip/列表编辑，不用纯文本/JSON
DNA 字段是短字符串数组 + 嵌套对象；下游 prompt 都吃数组。chip 列表对用户更易用（点 × 删、点 + 加），对系统更安全（不需解析、不会污染下游）。idealTopicMap 用"topic + subtopics"两层结构化编辑。

### 决策 2：编辑保存 = 新建 version，与"LLM 重抽"分离
新增一条 server action 接收用户编辑值 → 创建新 `SiteOntology` version（不调 LLM）。保留现有 POST 的 LLM 重抽能力（"让 AI 重新分析"按钮）。两条路径并存。

### 决策 3：`confirmedAt` 驱动确认闭环
`SiteOntology` 加 `confirmedAt DateTime?`。用户保存编辑或显式点"确认"时写入。`define_ontology` 招式 detect 改为：有 ontology 但 `confirmedAt` 为空 → 仍提示"确认你的业务基因"（兑现承诺）。

### 决策 4：编辑后强制刷新缺口
idealTopicMap 是 `getSemanticGap` 的输入，缓存的 `SemanticDebt` 绑定在 ontology 版本上。保存新版本后：触发 `getSemanticGap(siteId, forceRefresh=true)` + `revalidateTag(coachHomeTag)`，避免蓝图/策略读到旧缺口。

### 决策 5：编辑入口在 `#overview`
`define_ontology` 招式本就深链 `#overview`；编辑器放这里。GrowthHome（及 P3a 蓝图）只读展示 + "编辑基因"链接跳 `#overview`。

## Risks / Trade-offs

- **idealTopicMap 编辑 → 缺口重算成本**：每次保存触发一次 LLM 缺口分析。缓解：仅当 idealTopicMap 实际变化时才 forceRefresh；其余字段编辑不触发。
- **版本膨胀**：频繁编辑产生多版本。可接受（用于回溯），后续可加清理。
- **并发/陈旧**：基于"最新 version"编辑，保存时若已有更新版本需提示。低概率，单用户场景。
- **迁移**：`confirmedAt` 是可空列，安全；按 backlog 规范出迁移文件，避免加剧历史漂移。
