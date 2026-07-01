# plg-homepage-and-free-audit Specification

## Purpose
TBD - created by archiving change plg-homepage-and-free-audit. Update Purpose after archive.
## Requirements
### Requirement: 公共免费审计(无需登录)

系统 SHALL 提供无需登录的公共站点审计:输入域名 → 当场返回基于爬取+规则的诊断(SEO 技术/on-page + GEO 就绪信号),可选并入免费 Google PSI。该审计 MUST NOT 调用 LLM 或 DataForSEO(边际成本≈0),MUST NOT 要求 session 或写入数据库,并 SHALL 实施限流 + 按域名缓存 + 爬取深度上限以防滥用。

#### Scenario: 未登录获得诊断

- **WHEN** 访客在公共页输入域名并提交
- **THEN** 无需注册即可看到评分 + 具体问题清单(含"AI 引擎能否读到您"的 GEO 就绪信号)

#### Scenario: 零付费 API 成本

- **WHEN** 公共审计运行
- **THEN** 仅执行爬取+规则(+可选免费 PSI),不触发任何 LLM/DataForSEO 计费调用

#### Scenario: 防滥用

- **WHEN** 同一来源短时间内大量请求,或对同一域名重复请求
- **THEN** 触发限流/返回缓存结果,爬取页数受上限约束

### Requirement: 注册闸落在"行动"而非"诊断"

诊断结果 SHALL 对未登录访客完整可见;注册/登录 SHALL 仅在用户要采取行动(修复、生成内容、连接 GSC、保存)时才要求。系统 MUST NOT 在展示诊断前设置注册墙。

#### Scenario: 看诊断不需注册,行动才需

- **WHEN** 访客看完公共审计、点击"修复/生成内容/追踪"类行动
- **THEN** 此时才提示注册;在此之前的诊断浏览无需账号

### Requirement: 首页转化导向且诚实

首页 SHALL 以结果与 AI 搜索转变为核心(而非内部黑话/隐喻),包含:即时证明、痛点、SEO+GEO 品类教育、无"先注册"步骤的"怎么做"、异议处理(FAQ/对比)、单一主 CTA(免费审计)。所有措辞 MUST NOT 宣称"AI 引用追踪/实时 AI 监测";衡量表述为"搜索排名与可见度",GEO 表述为"为可被引用而构建/GEO 就绪"。首页 MUST NOT 含与订阅方向冲突的反订阅文案。

#### Scenario: 5 秒理解 + 单一动作

- **WHEN** 首次访客打开首页
- **THEN** 能在数秒内理解"让 Google 和 AI 都搜到/引用您",且最显眼的动作是免费审计

#### Scenario: 诚实措辞

- **WHEN** 首页/审计页描述衡量或 GEO 能力
- **THEN** 使用"搜索排名与可见度 / GEO 就绪"措辞,不出现"AI 引用追踪/实时 AI 监测"

#### Scenario: 双语

- **WHEN** 访客在 en 或 zh 浏览首页
- **THEN** 两种语言都提供转化导向文案;中文用「您」

