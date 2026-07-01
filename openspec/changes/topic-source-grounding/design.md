## Context

- `idealTopicMap` 在 `crawler.service.ts` 的 `extractBusinessDna` 里、与 DNA 同一次 LLM 调用生成,prompt = "5-10 semantic pillars a leader in this niche MUST cover"(纯想象,需求盲)。存于 `SiteOntology.idealTopicMap`(`Json`,形态 `{topic, subtopics}[]`)。
- 已有数据管道(全部现成):
  - `DataForSEOClient.getRelatedTopics(kw)` → 相关词 + `search_volume` + PAA(Labs API,失败回退 keyword_ideas)。
  - `DataForSEOClient.searchGoogleSERP(kw)` → organic + PAA。
  - `CrawlerService.inferCompetitors(dna, domain)` → 竞品域名(已在跑 SERP,可取其排名话题)。
  - `serp-analyzer` 已抽 PAA / featured snippet。
- `getSemanticGap` 用 `gscImpressions` 作需求(仅在 GSC 连接时);话题本身来自想象的 idealTopicMap。
- backlog:"统一提取器已留【外部话题信号】入参"—— 架构已预留此扩展点。

## Goals / Non-Goals

**Goals:**
- `idealTopicMap` 接真实需求(搜索量)+ fan-out(PAA)+ 竞品排名 + 对比机会 → 你专属、可信。
- **不改动已稳定的 DNA 提取 prompt/其它字段**(隔离风险)。
- 复用现有 DataForSEO 管道,成本有界、一次性。
- 强化蓝图/审计可信度(获客钩子)。
- 诚实:全用真实数据,不编造。

**Non-Goals:**
- 不做真 AI-引用缺口检测(需查 AI 答案,飞跃2/工具,deferred)。
- 不做 GSC 回流的"活的 DNA"(飞跃2,deferred)。
- 不做重量级 LLM 重合成(本期确定性接地 + 可选轻量重排)。
- 不改积分/模型路由;不引入 schema 迁移(idealTopicMap 是 Json)。

## Decisions

1. **接地在 DNA 之后的独立 pass(隔离)**:新 `groundIdealTopicMap(ontology, seedKeywords, competitors, locale)`,在 onboarding/重析流程里 DNA 保存后调用,读→接地→写回 `ontology.idealTopicMap`。**不碰 extractBusinessDna 的 prompt**(DNA 刚稳,零回归风险)。
2. **接地算法(确定性为主)**:
   - 对每个骨架支柱(+ 种子词)调 `getRelatedTopics`(上限 ~8 次,缓存)→ 收集 `{相关词, 搜索量, PAA}`。
   - 每支柱附:`searchVolume`(匹配相关词的量,取代表值)、`subtopics`(并入 PAA + 高量相关词,去重)、`fanoutQuestions`(PAA)、`isComparison`(相关词/话题含 vs/best/alternative/compare/对比/替代)。
   - 竞品排名话题(来自 `inferCompetitors` 的 SERP)→ 标 `competitorCovered`。
   - **补缺**:真实数据里高量、但不在骨架的相关词簇 → 作为新支柱加入(LLM 漏掉的 fan-out 缺口)。
   - **剔除/降权**:零真实信号(无量、无 PAA、无竞品)的支柱 → 移到末尾或标记(安全失败:不静默删,降权即可)。
   - (可选)一次轻量 LLM 重排/命名归一,默认关闭,成本敏感时不启用。
3. **JSON 形态扩展(无迁移)**:`idealTopicMap` 项 = `{ topic, subtopics, searchVolume?, isComparison?, competitorCovered?, fanoutQuestions? }`。旧数据缺字段 → 视为未接地,UI 优雅降级。
4. **降级**:DataForSEO 失败/无 key/mock → 接地跳过,保留纯 LLM 图谱(不阻断 onboarding);记 warn。
5. **UI 轻量呈现**:蓝图支柱旁显示搜索量(有则)+ 对比机会徽章;审计缺口列表同理 → "有真实搜索量的话题你没覆盖" 的可信表述。
6. **成本控制**:接地调用上限 + 按 (siteId, 语言) 缓存;竞品 SERP 复用 inferCompetitors 结果不重复调。

## Risks / Trade-offs

- **onboarding 延迟**:多 ~8 次 DataForSEO 调用 → 首跑变慢。缓解:并发 + 可后台化(DNA 先返回、接地异步补;或接受一次性慢)。
- **DataForSEO 成本/配额**:有界(一次性/站),但要防重复(缓存 + 上限)。
- **接地质量**:确定性合并可能不如 LLM 智能;可接受(数据真实 > 想象),LLM 重排作可选。
- **语言一致性**:相关词/PAA 要用 DNA 的 sourceLocale 取(与 idealTopicMap 同语言,避免蓝图 join 失配 —— 复用已修的 locale 传递)。
- **隔离**:接地独立于 DNA 提取 → DNA 零回归;接地失败不影响 DNA。

## Implementation Notes (for Gemini / Antigravity)

**已知遗留冲突:**
- **不要**改 `extractBusinessDna` 的 prompt 或其它 DNA 字段(coreOfferings/logicChains 等);接地是**其后的独立步骤**。
- `getRelatedTopics` 有 mock 回退(无 key 时)——接地要能识别 mock/失败并优雅降级为纯 LLM 图谱。
- 语言:取相关词/PAA 用 `ontology.sourceLocale`,保持与 idealTopicMap 同语言(否则蓝图 join 失配,见已修 locale 传递)。
- `idealTopicMap` 是 `Json`,扩展字段**无需迁移**;下游读取要对缺字段(旧数据)优雅降级。

**禁止触碰范围:**
- 不改 DNA 提取 prompt/字段、模型路由、积分、schema 迁移。
- 不做 AI-引用缺口检测 / GSC 回流(deferred)。

**本 change 边界(只允许改动):**
- 新增 `groundIdealTopicMap`(`crawler.service.ts` 或新 `topic-grounding.ts`),复用 `DataForSEOClient.getRelatedTopics` / `inferCompetitors`。
- onboarding / 重析入口(`api/dashboard/sites/[siteId]/ontology` 等)在 DNA 后调用接地。
- `idealTopicMap` 消费处(蓝图 `ContentAssetBlueprint`、审计缺口)轻量显示搜索量/对比徽章;`messages`(en/zh,用「您」)。
- 类型:idealTopicMap 项类型扩展。

**其他注意事项:**
- 接地调用上限 + 缓存;竞品 SERP 复用不重复调。
- 失败降级、不阻断 onboarding。
- 改完 `npx tsc --noEmit` 保持仅 1 预存 auth.ts 错误;i18n-auditor + design-checker(蓝图/审计新徽章)。
- 验证:接地后 idealTopicMap 支柱带真实搜索量/PAA/对比标记;无 key 时优雅降级为纯 LLM;蓝图/审计显示搜索量;语言一致。
