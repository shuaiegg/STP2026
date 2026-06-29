# activation-loop-closure Specification

## Purpose
TBD - created by archiving change activation-loop-closure. Update Purpose after archive.
## Requirements
### Requirement: 草稿感知的加冕推进

系统 SHALL 在选择加冕支柱(Fastest Next Step)时排除已有对应草稿(`TrackedArticle`)的支柱,使用户为某支柱生成草稿后,加冕推进到下一个真实未覆盖的 gap。已起草但未发布的支柱 SHALL 标为"进行中/已起草"状态而非加冕候选。"无任何草稿"时的加冕行为 SHALL 与现状一致(top 未覆盖 gap)。

#### Scenario: 写草稿后加冕前进

- **WHEN** 用户从加冕支柱"开始写作"并保存草稿(生成对应 TrackedArticle)
- **THEN** 该支柱不再被加冕,标为"已起草·待发布",加冕推进到下一个未覆盖支柱

#### Scenario: 无草稿时加冕不变

- **WHEN** 站点没有任何已起草支柱
- **THEN** 加冕仍为优先级最高的未覆盖 gap(行为与本 change 前一致)

### Requirement: 支柱与草稿/站点关联

`TrackedArticle` SHALL 携带 `siteId` 与来源支柱信息(`sourcePillar`),使产出能映射回具体站点的支柱。geo-writer 从加冕支柱进入时 SHALL 透传 siteId 与支柱话题,并在保存草稿时写入。新增字段为可空,旧有调用 SHALL 不受影响。

#### Scenario: 从蓝图生成的草稿带站点与支柱

- **WHEN** 用户从蓝图加冕支柱进入 geo-writer 并保存
- **THEN** 生成的 TrackedArticle 记录 siteId 与 sourcePillar,可被蓝图匹配为该支柱"已起草"

#### Scenario: 旧调用兼容

- **WHEN** 非蓝图来源(无 siteId)保存草稿
- **THEN** TrackedArticle 以 siteId 为空创建,行为退化为现有逻辑,不报错

### Requirement: 发布 URL 回填与验证

系统 SHALL 在草稿生成后提示用户回填发布 URL,并提供 `backfillArticleUrl` 写入 `TrackedArticle.url`,接通既有 cron 进行 Google 搜索收录/排名验证。提示文案 SHALL 明确 URL 用于"验证搜索收录与排名",MUST NOT 宣称"AI 引用"或"实时 AI 监测"。

#### Scenario: 回填 URL 触发验证

- **WHEN** 用户把已发布文章的 URL 回填到对应草稿
- **THEN** TrackedArticle.url 被写入,既有 cron 后续据此查询 SERP 并更新收录/排名状态

#### Scenario: 诚实措辞

- **WHEN** 任意位置展示 URL 回填提示或验证状态
- **THEN** 措辞为"搜索收录/排名验证(Google)",不出现"AI 引用追踪/实时 AI 监测"

### Requirement: 支柱三态可见且区分已起草与已验证

蓝图 SHALL 用清晰的三态展示支柱:`未覆盖(可加冕)`、`已起草·待发布/回填URL`、`已发布·已验证`。系统 MUST NOT 把"已起草"呈现为"已生效/已覆盖",避免虚假进度。

#### Scenario: 已起草不等于已覆盖

- **WHEN** 某支柱有草稿但 URL 未回填或未通过 SERP 验证
- **THEN** 显示为"已起草·待发布"(进行中),而非"已建立/已覆盖"

### Requirement: 内容计划语言跟随站点 DNA 语言

`strategy/generate` 生成的内容计划(标题/描述/主题及文章 language)SHALL 使用站点业务基因的 `sourceLocale`,而非操作者 UI 语言;UI 语言仅作兜底。系统 MUST NOT 默认偏向中文。

#### Scenario: 英文站生成英文计划

- **WHEN** 站点 DNA sourceLocale 为 en(如 scaletotop),由中文 UI 用户触发一键生成计划
- **THEN** 生成的计划与文章语言为英文(跟随站点内容语言),而非中文

