## Why

geo-writer 是我们核心卖点(GEO),但对照刚安装的 `ai-seo` 技能(Princeton KDD 2024 GEO 研究)+ 现有实现,差距明显:

- **GEO 评分测错东西**:`calculateGEOScore` 现在测**实体覆盖/密度**——而研究表明真正驱动 AI 引用的是**引用来源(+40%)、统计数据(+37%)、专家引述(+30%)、结构化答块**,以及**关键词堆砌(−10%,有害)**。我们的分数不反映被引概率。
- **写手没系统强制最高杠杆因子**:prompt 有直答/表格/FAQ(好),但**没系统要求"论断挂真实来源 + 带来源的统计 + 专家引述"**(Princeton 前 3 名)。
- **单篇、非 fan-out**:AI 会 fan-out 到 5-10 个相关子问题;我们只有 PAA→FAQ,没系统覆盖 fan-out 全集 → 单篇话题不够完整、可检索性低。
- **缺对比格式**:对比文章占 AI 引用 **~33%(最高)**,我们不专门支持"X vs Y"结构。

好消息:我们已经有直答(50 词)、表格、FAQ schema、E-E-A-T 实体、研究阶段的真实 SERP/竞品数据——**升级是把方法论系统化,不是从零造**。且**诚实天然咬合**:"加统计"对我们 = 把研究阶段抓到的**真实统计带来源写进正文**(sanitizeProof 禁编造),而非造数字。

## What Changes

1. **写手 prompt 强制 Princeton 前 3 因子(诚实)**(`StrategyComposer`/`ExecutionAgent`):
   - 关键论断**挂真实来源**;用**研究阶段抓到的真实统计 + 来源 + 日期**(不编造,sanitizeProof 守门);**专家引述**(名+头衔,若研究里有);反关键词堆砌。
2. **GEO 评分重做**(`calculateGEOScore` → Princeton 因子):测**引用/来源密度、统计密度、专家引述、结构化答块(直答/表格/FAQ/定义块)**,并对**关键词堆砌扣分**。替换纯实体密度打分。
3. **fan-out 覆盖(②A)**:写作前生成 **fan-out 子问题集**(复用 IntelligenceEngine 已抓的 PAA + 补全)→ 大纲/文章确保覆盖 → 单篇话题完整、更可检索。
4. **对比文章格式**:话题为对比意图时(来自 `topic-source-grounding` 的 `isComparison`,或关键词含 vs/best/alternative)→ 启用 **X vs Y 结构模板**(对比表 + 各维度直答)。
5. **集群连接(②B)**:复用**已建的双模内链**(真实内链 + 集群建议)——本期仅确保写手感知"所属支柱/兄弟/缺口",增量小。

## Capabilities

### New Capabilities
- `geo-methodology-upgrade`: 把研究背书的 GEO 方法论(Princeton 因子 + fan-out 覆盖 + 对比格式 + 被引导向评分)系统化进写手与评分,诚实实现。

### Modified Capabilities
<!-- GEO 评分口径变化(entities → Princeton 因子);写作 prompt 增强 -->

## Impact

- **修改**:
  - `StrategyComposer.ts` / `ExecutionAgent.ts`:prompt 强制真实统计/引用/专家引述 + 反堆砌 + fan-out 覆盖 + 对比模板。
  - `lib/utils/seo-scoring.ts`:`calculateGEOScore` 重做为 Princeton 因子;`StellarEnricher` 消费新分数。
  - IntelligenceEngine / 生成流程:生成 fan-out 子问题集(复用 PAA)。
  - 结果 UI:GEO 分拆解展示改为新因子(轻量)。
  - `content-scorecard.md`:GEO 维度对齐 Princeton(评测口径)。
- **复用**:研究阶段的真实 SERP/竞品/PAA 数据(作统计/引用来源)、已建双模内链、sanitizeProof(诚实守门)。
- **不影响**:模型路由、积分、DNA 提取、公共审计。
- **风险**:中。改 prompt + 评分口径(GEO 分数会变,需重设阈值/回归);诚实约束下"真实统计"依赖研究数据质量(无数据时不硬塞)。
- **依赖/协同**:`topic-source-grounding`(提供 isComparison + fan-out 种子);可独立做但协同更强。
- **关联**:兑现核心 GEO 卖点;延续 citation-honesty/sanitizeProof;用 `content-scorecard` 验质量。
- **Deferred(backlog)**:真 AI-引用缺口检测(查 AI 答案/工具)、站点级 GEO 生成(llms.txt/schema,Phase 2)、跨集群双向互链自动补链、freshness 刷新回路。
