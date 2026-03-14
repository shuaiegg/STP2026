# semantic-debt-scoring Specification

## Purpose
Quantify content gaps with coverage and proof density metrics, and extract structured logic chains from site content.

## Requirements
### Requirement: 每条语义债包含 Coverage Score 量化评分
系统 SHALL 为每条语义债计算 `coverageScore`（0-100），表示该话题在现有内容中的覆盖程度，0 = 完全没有相关内容，100 = 非常充分的深度内容。

#### Scenario: 语义债分析返回评分
- **WHEN** 前端请求语义债分析（`/api/.../semantic-gap`）
- **THEN** 每条语义债对象包含 `coverageScore: number`（0-100 整数）

#### Scenario: Coverage Score 在 OverviewPanel 中展示
- **WHEN** OverviewPanel 渲染语义债列表
- **THEN** 每条债务显示 coverageScore 数值，低于 30 时标红

### Requirement: 每条语义债包含 Proof Density 量化评分
系统 SHALL 为每条语义债计算 `proofDensity`（0-100），表示该话题现有内容的佐证密度（案例、数据、客户证言等），0 = 纯观点无佐证，100 = 大量具体佐证。

#### Scenario: 语义债分析返回 Proof Density
- **WHEN** 前端请求语义债分析
- **THEN** 每条语义债对象包含 `proofDensity: number`（0-100 整数）

### Requirement: 本体提取识别 Problem → Solution → Proof 逻辑链
系统 SHALL 在提取业务 DNA 时识别业务的核心逻辑链结构（问题-解决方案-证明），并存入 `SiteOntology.logicChains`。

#### Scenario: 本体提取返回逻辑链
- **WHEN** 触发业务 DNA 提取（`POST /api/.../ontology`）
- **THEN** 返回结果包含 `logicChains: { problem, solution, proof }[]`，至少识别 1 条逻辑链

#### Scenario: 无法识别时返回空数组
- **WHEN** 站点内容不足以推断逻辑链
- **THEN** `logicChains` 返回空数组，不影响其他本体字段
