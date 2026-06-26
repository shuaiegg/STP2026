## Why

业务基因（`SiteOntology`：coreOfferings / targetAudience / painPointsSolved / idealTopicMap / logicChains）是整个内容引擎的**脊柱**——它喂给缺口分析（`getSemanticGap`）、内容策略（`strategy/generate`）、写作 prompt（`StrategyComposer` 的 `<business_dna>`，已归档 `business-dna-into-content`），以及即将做的内容资产蓝图（`content-asset-blueprint`）。

但脊柱现在**自动生成、却不可信也不可改**：
- `ontology` POST 路由只会**重新 LLM 提取**（无用户输入入口，每次新建 version）。
- `OverviewPanel` 只**展示** `coreOfferings.slice(0,3)`，没有编辑表单。
- 教练招式 `define_ontology` 写着"**去确认** DNA"，但**根本没有确认/编辑的地方**——这个承诺是空的。

后果：若 AI 提取的基因不符合用户实际业务，用户**无法纠正**，而错误的基因会让下游全部偏（缺口错、策略错、写作错、蓝图不可信）。在 DNA 之上做"内容资产蓝图"前，必须先让脊柱**可编辑、可确认、可信**。

## What Changes

- **`#overview` 新增结构化 DNA 编辑器**：coreOfferings / targetAudience / painPointsSolved 用 chip/列表（增/删/改单条）；idealTopicMap（topic + subtopics）结构化编辑。logicChains 本期**只读展示**。
- **保存编辑 = 新建 `SiteOntology` version**（版本基建已存在），保留历史、可回溯。
- **"确认 DNA" 闭环**：新增 `confirmedAt`，让 `define_ontology` 招式真正可完成；确认/编辑后**自动刷新语义缺口**（idealTopicMap 变了，缓存的 SemanticDebt 失效需重算）。
- **拆分 ontology 写入路径**：现有 POST 只 LLM 重抽；新增一条"保存用户编辑值"的服务端动作（不调用 LLM）。

## Capabilities

### New Capabilities

- `business-dna-editing` — 用户可结构化编辑并确认站点业务基因，存为新版本。

### Modified Capabilities

- 业务本体持久化：从"仅 LLM 重抽"扩展为"LLM 重抽 + 用户编辑保存"两条写入路径。

## Impact

- **定位**：dashboard（仪表盘，非公开、中文 UI），无双语/i18n 路由影响。
- **Schema**：`SiteOntology` 新增 `confirmedAt DateTime?`（+ 迁移）。注意 backlog 已记"迁移历史漂移"，本次按规范出迁移文件。
- **文件**（预估）：`SiteOntology` schema、`ontology` 路由 / 新 server action、`OverviewPanel`（编辑 UI）、`lib/coach/registry.ts`（`define_ontology` detect 改用 `confirmedAt`）。
- **下游联动**：编辑 idealTopicMap → 必须 `getSemanticGap(forceRefresh)` 重算缺口 + 刷新 coach 缓存。
- **依赖**：无前置；是 `content-asset-blueprint`（P3a）的前置。**不含**业务类型（单独轨）、不含蓝图呈现（P3a）、不含 logicChains 编辑（本期只读）。
