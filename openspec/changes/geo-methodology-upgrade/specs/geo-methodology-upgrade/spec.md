## ADDED Requirements

### Requirement: GEO 评分基于被引驱动因子

`calculateGEOScore` SHALL 基于研究背书的被引驱动因子评分:引用/来源密度、带来源的统计密度、专家引述存在、结构化答块(直接答段/表格/FAQ/定义块),并对关键词堆砌**扣分**。它 MUST NOT 以实体覆盖密度为主要评分依据。评分 SHALL 输出可解释的问题与建议。

#### Scenario: 引用与统计提分

- **WHEN** 文章包含带来源的统计与权威引用
- **THEN** GEO 分相应提高,拆解中体现这些因子

#### Scenario: 关键词堆砌扣分

- **WHEN** 文章关键词密度过高(堆砌)
- **THEN** GEO 分被扣减并给出改进建议

### Requirement: 写手强制真实统计/来源/引述(诚实)

写作生成 SHALL 系统性引导:关键论断挂真实来源、引用研究阶段获得的真实统计(数字+来源+日期)、在有据时加入专家引述,并避免关键词堆砌。系统 MUST NOT 编造统计或来源;无可靠数据时 SHALL 不硬塞(与 sanitizeProof 一致)。

#### Scenario: 用真实数据而非编造

- **WHEN** 研究阶段提供了真实统计/来源
- **THEN** 文章引用这些真实数据并注明出处

#### Scenario: 无数据不硬造

- **WHEN** 某论断没有可靠来源
- **THEN** 不编造数字/来源(宁可不加),避免被 sanitizeProof 清除后内容空洞

### Requirement: fan-out 覆盖与对比格式

写作 SHALL 覆盖话题的 fan-out 子问题集(复用 PAA + 补全,5-8 个),使单篇话题更完整可检索。当话题为对比意图(isComparison 或关键词含 vs/best/alternative/对比/替代)时,SHALL 采用对比文章结构(对比表 + 各维度直答,客观中立)。

#### Scenario: 覆盖 fan-out 子问题

- **WHEN** 为某话题写作
- **THEN** 大纲/文章覆盖该话题 fan-out 出的主要子问题(H2/H3 或 FAQ)

#### Scenario: 对比话题用对比结构

- **WHEN** 话题为对比意图
- **THEN** 文章采用对比表 + 逐维度直答的结构(被引率最高的内容类型)
