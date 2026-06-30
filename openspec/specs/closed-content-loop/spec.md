# closed-content-loop Specification

## Purpose
TBD - created by archiving change closed-content-loop. Update Purpose after archive.
## Requirements
### Requirement: 加冕与草稿用规范身份精确匹配

蓝图"开始写作/补证据"链接 SHALL 传递不可编辑的支柱规范身份(`pillar`),草稿保存时 `sourcePillar` SHALL 取该规范身份(独立于用户可编辑的关键词)。`home.ts` 支柱↔草稿匹配 SHALL 以规范身份精确相等为准;关键词/标题模糊匹配仅用于无 `sourcePillar` 的历史数据兜底,MUST NOT 用于新数据(避免短话题过配藏掉真缺口)。

#### Scenario: 关键词被编辑仍精确匹配

- **WHEN** 用户从支柱"开始写作",在 geo-writer 把关键词改成 "how to <topic>" 后保存
- **THEN** sourcePillar 仍为规范 `<topic>`,该支柱被精确识别为已起草,加冕推进到下一个

#### Scenario: 不过配相邻支柱

- **WHEN** 站点有多个含相同词根的支柱(如多个含 "SEO")
- **THEN** 一篇草稿只标记其规范身份对应的那一个支柱为已起草,不误标其它支柱

### Requirement: 衡量以 GSC 真实表现为主

已连接 URL 的文章/支柱 SHALL 主展示来自 GSC 的真实点击、展示、平均排名。二元 SERP 状态(未实际自动运行)SHALL 退为次要或移除,且其措辞 MUST NOT 暗示系统正在主动验证 SERP/引用。无 GSC 数据时 SHALL 提示"连接 GSC 后查看真实表现",而非展示二元伪状态。

#### Scenario: 已连接文章看真实表现

- **WHEN** 文章已有 URL 且其页面在 GSC 有数据
- **THEN** 展示真实 clicks/impressions/avg position,而非二元"已引用/未引用"

#### Scenario: 诚实措辞

- **WHEN** 文章有 URL 但暂无 GSC 数据
- **THEN** 显示中性"表现采集中 / 连接 GSC 看真实表现",不宣称"SERP 验证中/AI 引用"

### Requirement: 双模内链且正文不出死链

内链推荐 SHALL 区分两类:① 真实内链——来自用户真实已发布/已排名页面,可插入正文(anchor + 真实 URL);② 集群内链建议——支柱下未覆盖子话题,呈现为"去写并回链"的计划动作,MUST NOT 作为链接插入正文。系统 MUST NOT 向正文插入指向不存在内容的链接。

#### Scenario: 真实内链可插入

- **WHEN** 用户站点已有与当前主题相关的已发布文章
- **THEN** 内链面板列出这些真实文章,用户可一键把真实链接插入正文

#### Scenario: 集群缺口仅作建议

- **WHEN** 某相关子话题用户尚未写过
- **THEN** 它显示为"内容集群机会:去写 [X] 并回链",不在正文生成任何链接

#### Scenario: 新站无真实内链

- **WHEN** 站点没有任何已发布内容
- **THEN** 真实内链为空,仅展示集群建议;正文不含内链

### Requirement: 我们博客发布的内容自动连接 URL

经"博客草稿"在本平台博客发布的内容,发布成功时 SHALL 自动把其公开博客 URL 写入对应 `TrackedArticle.url`,无需用户手动回填,并失效相关缓存。映射不到对应 TrackedArticle 时 SHALL 跳过(不报错),用户仍可手动回填。

#### Scenario: 博客发布即连接

- **WHEN** 用户把 geo-writer 生成的博客草稿在本平台博客发布
- **THEN** 对应 TrackedArticle.url 自动设为该博客公开 URL,文章进入 GSC 归因衡量,无需手动回填

### Requirement: 下一步建议流水线感知

当站点存在"已起草未发布"的支柱时,系统 SHALL 优先建议"发布并连接已起草内容",而非催促撰写新缺口;加冕(撰写新 gap)SHALL 仅在无待发布草稿时作为最快下一步主推。无任何草稿时,加冕行为 SHALL 与现状一致(top 未覆盖 gap)。

#### Scenario: 有待发布草稿优先收口

- **WHEN** 站点有 N 篇已起草未发布的支柱内容
- **THEN** 首要下一步提示"先发布并连接已起草内容",避免持续催写新草稿

#### Scenario: 无草稿回归常态

- **WHEN** 站点没有待发布草稿
- **THEN** 加冕推荐 top 未覆盖 gap,行为与本 change 前一致

