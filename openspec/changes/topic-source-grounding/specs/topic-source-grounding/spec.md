## ADDED Requirements

### Requirement: idealTopicMap 接真实需求与 fan-out 数据

系统 SHALL 在 DNA 提取之后、以独立步骤用真实数据接地 `idealTopicMap`:通过 `getRelatedTopics`(相关词 + 搜索量 + PAA)与竞品 SERP 排名话题,为每个支柱附加真实搜索量、fan-out 问题(PAA)、竞品覆盖标记与对比机会标记,并补入真实数据中存在、LLM 骨架遗漏的高需求话题。该步骤 MUST NOT 修改 DNA 提取的 prompt 或其它字段。全部数据来自真实来源,MUST NOT 编造。

#### Scenario: 支柱带真实需求信号

- **WHEN** 站点完成 DNA 提取并接地
- **THEN** idealTopicMap 的支柱附带真实搜索量、PAA fan-out 问题;高需求但 LLM 遗漏的话题被补入

#### Scenario: 对比机会被标记

- **WHEN** 相关词/话题包含对比意图（vs / best / alternatives / 对比 / 替代）
- **THEN** 对应支柱标记为对比机会（被引率最高的内容类型）

#### Scenario: 不改动 DNA 提取

- **WHEN** 接地运行
- **THEN** DNA 的 coreOfferings/logicChains 等字段与其提取 prompt 不受影响（隔离，零回归）

### Requirement: 接地失败优雅降级

当 DataForSEO 不可用（无 key / 失败 / mock）时,接地 SHALL 跳过并保留纯 LLM 生成的 idealTopicMap,MUST NOT 阻断 onboarding 或报错中断。下游对未接地（缺字段）的旧数据 SHALL 优雅降级显示。

#### Scenario: 无 DataForSEO 仍可用

- **WHEN** DataForSEO 无凭据或调用失败
- **THEN** 保留纯 LLM idealTopicMap,onboarding 正常完成,仅记警告

### Requirement: 蓝图与审计呈现真实需求

蓝图与审计缺口列表 SHALL 在有接地数据时呈现支柱的真实搜索量与对比机会标记,使表述从"AI 认为您该覆盖"升级为"有真实搜索量、竞品在排的话题您未覆盖"。措辞 SHALL 诚实,不夸大。

#### Scenario: 审计可信度提升

- **WHEN** 已接地站点查看蓝图/审计
- **THEN** 缺口话题旁显示真实搜索量 / 对比机会,增强可信度；无接地数据时优雅降级不显示伪信号
