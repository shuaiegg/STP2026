# unified-llm-model-routing Specification

## Purpose
TBD - created by archiving change unified-llm-model-routing. Update Purpose after archive.
## Requirements
### Requirement: 统一 LLM 兜底 Helper

系统 SHALL 提供单一共享函数 `generateWithFallback(prompt, { context, ... })`,在 `resolveModelForContext(context)` 解析首选模型后,按固定候选链 `[首选, vps, deepseek, claude]`(去重)依次尝试,首个成功即返回,全部失败则抛出最后的错误。所有 LLM 生成用点 SHALL 通过该 helper(embedding 除外)。

#### Scenario: 首选模型失败自动降级

- **WHEN** 某 context 的首选模型调用因 429/配额/网络失败
- **THEN** helper 自动尝试候选链中的下一个 provider,直至成功或链穷尽;成功路径对调用方透明

#### Scenario: 候选链穷尽

- **WHEN** 候选链所有 provider 均失败
- **THEN** helper 抛出最后一个错误,调用方按既有错误处理返回用户可读提示

#### Scenario: 首选去重

- **WHEN** 解析出的首选 provider 已在固定兜底链中(如首选即 deepseek)
- **THEN** 候选链不重复该 provider,避免对同一失败 provider 连试两次

### Requirement: 全 LLM 用点命名 Context 化

系统的每个 LLM 生成用点 SHALL 绑定一个命名 context:`dna_extraction`(业务基因提取)、`competitor_analysis`(竞品 scan/suggest)、`content_generation`(初稿生成)、`content_refinement`(审校/重写)、`content_strategy`(策略计划)、`skill_default`(通用兜底)。DNA 提取、竞品分析、StellarWriter 生成与审校 SHALL 不再使用 `getDefaultProvider()` 或硬编码 provider。

#### Scenario: DNA 提取获得兜底

- **WHEN** onboarding 触发 DNA 业务基因提取且首选模型 429
- **THEN** 经 `dna_extraction` context + helper 自动兜底到下一模型,提取不因单点 429 失败

#### Scenario: StellarWriter 初稿与审校分离配置

- **WHEN** 管理员为 `content_generation` 与 `content_refinement` 配置不同模型
- **THEN** StellarWriter 初稿段使用 `content_generation` 模型、审校重写段使用 `content_refinement` 模型

#### Scenario: 未配置时默认行为等价

- **WHEN** `ModelConfig` 中未为某 context 配置首选模型
- **THEN** 经优先级链 + 固定兜底链解析出的实际模型与本 change 前的硬编码默认等价(StellarWriter 仍命中 deepseek 系),不产生行为回归

### Requirement: Admin 模型管理覆盖全部 Context

管理员模型管理界面(`ContextModelAssignment`)SHALL 列出所有生效的命名 context(含新增 `dna_extraction` / `competitor_analysis` / `content_refinement`),每个 context 可独立配置首选 provider + modelId。无真实调用点的 context(如 `consultation`)SHALL 被移除或明确标注为未接入。

#### Scenario: 管理员配置新 context

- **WHEN** 管理员在模型管理页为 `dna_extraction` 选择一个 provider + model 并保存
- **THEN** 该配置写入 `ModelConfig`,后续 DNA 提取的首选即为该模型

#### Scenario: 空挂 context 清理

- **WHEN** 模型管理页渲染 context 列表
- **THEN** 不展示无对应 LLM 调用点的 `consultation`(除非已接入真实调用)

