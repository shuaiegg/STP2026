## ADDED Requirements

### Requirement: 从闭环进入免重复研究

当用户携带站点上下文(siteId,+可选 pillar/plannedArticleId)进入 geo-writer 时,系统 SHALL 复用站点已算好的诊断智能(竞品/语义缺口/DNA/(可选)缓存 SERP)预置研究结果,跳过或折叠研究步,直达大纲/策略;MUST NOT 为已有数据重复调用 DataForSEO 重跑研究。无上下文的手动进入 SHALL 保留完整研究步。诊断智能缺失/失败时 SHALL 优雅降级回正常研究步。

#### Scenario: 蓝图进入直达大纲

- **WHEN** 用户从蓝图/策略板"开始写作"进入(带 siteId/pillar)
- **THEN** 复用站点诊断智能预填,跳过/折叠研究步,落在大纲/策略,不重复研究

#### Scenario: 手动进入保留完整流程

- **WHEN** 用户不带上下文手动打开 geo-writer
- **THEN** 保留完整 3 步研究流程

#### Scenario: 诊断缺失优雅降级

- **WHEN** 站点诊断智能缺失或拉取失败
- **THEN** 回退到正常研究步,不阻断

### Requirement: 集群感知写作

写作界面 SHALL 呈现文章的集群上下文:所属支柱、兄弟文章(真实内链)、集群缺口(去写建议),复用已建的双模内链与 fan-out/集群数据,MUST NOT 新建重复的数据管道。

#### Scenario: 显示集群上下文

- **WHEN** 从某支柱写作
- **THEN** 界面显示所属支柱、可插入的兄弟真实内链、以及集群缺口的"去写"建议

### Requirement: 向发布与衡量明确交接

保存成功后,系统 SHALL 明确提示下一步"发布并连接(回填 URL)",承接闭环流水线,而非仅提示保存完成。

#### Scenario: 保存后交接

- **WHEN** 用户保存生成的文章
- **THEN** 出现清晰的"发布并连接/回填 URL"下一步入口(链到内容库回填),而非停在 toast
