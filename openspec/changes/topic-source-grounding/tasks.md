## 1. 接地函数

- [ ] 1.1 新增 `groundIdealTopicMap(ontology, seedKeywords, competitors, locale)`（`crawler.service.ts` 或新 `topic-grounding.ts`），**不改 extractBusinessDna prompt**
- [ ] 1.2 对骨架支柱 + 种子词调 `getRelatedTopics`（上限 ~8、缓存、按 sourceLocale 取语言）→ 收集相关词 + 搜索量 + PAA
- [ ] 1.3 复用 `inferCompetitors` 已抓的竞品 SERP → 竞品排名话题（不重复调）

## 2. 合成 idealTopicMap

- [ ] 2.1 每支柱附：`searchVolume` / `subtopics`(并入 PAA+高量相关词去重) / `fanoutQuestions`(PAA) / `isComparison`(vs/best/alternative/对比/替代) / `competitorCovered`
- [ ] 2.2 补缺：真实高量、骨架遗漏的相关词簇 → 新支柱
- [ ] 2.3 零信号支柱降权（安全失败：不静默删）
- [ ] 2.4 (可选，默认关)一次轻量 LLM 重排/命名归一
- [ ] 2.5 写回 `ontology.idealTopicMap`（Json 扩展形态，无迁移）

## 3. 接入流程 + 降级

- [ ] 3.1 onboarding / 重析入口在 DNA 保存后调用接地
- [ ] 3.2 DataForSEO 无 key/失败/mock → 跳过接地、保留纯 LLM 图谱、不阻断、记 warn
- [ ] 3.3 (可选)接地异步化/后台，降低 onboarding 感知延迟

## 4. 下游呈现

- [ ] 4.1 idealTopicMap 项类型扩展；下游对缺字段(旧数据)优雅降级
- [ ] 4.2 蓝图 `ContentAssetBlueprint` 支柱旁显示搜索量 + 对比机会徽章
- [ ] 4.3 审计缺口列表同理；文案诚实(en/zh，用「您」)

## 5. 验证

- [ ] 5.1 `npx tsc --noEmit` 仅剩 1 预存 auth.ts 错误，零新增
- [ ] 5.2 接地后：支柱带真实搜索量/PAA/对比标记；高量遗漏话题被补入
- [ ] 5.3 无 DataForSEO key：优雅降级为纯 LLM 图谱，onboarding 正常
- [ ] 5.4 语言一致（相关词/PAA 与 idealTopicMap 同 sourceLocale，蓝图 join 不失配）
- [ ] 5.5 成本：接地调用有上限 + 缓存；竞品 SERP 复用不重复
- [ ] 5.6 蓝图/审计显示搜索量/对比徽章；旧数据优雅降级
- [ ] 5.7 i18n-auditor + design-checker（新徽章）
- [ ] 5.8 更新 backlog：勾「飞跃1」；保留 deferred（LLM 重合成/公共审计展示量/AI 引用缺口/活的 DNA）
