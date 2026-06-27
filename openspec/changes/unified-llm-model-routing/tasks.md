## 1. 共享 helper

- [x] 1.1 在 `model-resolver.ts` 加 `generateWithFallback(prompt, { context, ...opts })`:resolve 首选 → 固定候选链 `[首选, vps, deepseek, claude]` 去重 → try/catch 顺序尝试 → 每次降级 `console.warn` 记录 → 全败抛最后错误
- [x] 1.2 从 `src/lib/skills/index.ts` 导出 `generateWithFallback`
- [ ] 1.3 单元/手动验证:模拟首选抛错 → 命中下一候选;全抛 → 抛最后错误

## 2. 去重现有兜底(行为等价)

- [x] 2.1 `strategy/generate/route.ts`:候选循环 → 改调 `generateWithFallback(prompt, { context: 'content_strategy', temperature: 0.3 })`,确认候选顺序/温度等价
- [x] 2.2 `semantic-gap-service.ts`:候选循环 → 改调 helper(`skill_default`, temperature: 0.1)

## 3. 迁移无兜底用点

- [x] 3.1 `crawler.service.ts`(DNA 提取 + 业务页选择 3-4 处):`getDefaultProvider()` → `generateWithFallback(..., { context: 'dna_extraction' })`;**不动** sanitizeProof / 语言隔离 / 业务页选择逻辑
- [x] 3.2 `competitors/[competitorId]/scan/route.ts`:→ `competitor_analysis`
- [x] 3.3 `competitors/suggest/route.ts`:→ `competitor_analysis`
- [x] 3.4 `generate-stream/route.ts`:`content_generation`,用 helper 统一(删重复静态分支,保留 DB 不可用仍可跑语义)
- [x] 3.5 `stellar-writer.ts`:初稿段 → `content_generation`;审校/重写段(Auditor/Editor/Refining)→ `content_refinement`;移除 `preferredProvider` 硬编码;确认未配时默认仍命中 deepseek

## 4. Admin 模型管理

- [x] 4.1 `ContextModelAssignment.tsx` 的 `CONTEXTS` 加 `dna_extraction` / `competitor_analysis` / `content_refinement`(key/label/description,中文,用「您」)
- [x] 4.2 移除空挂的 `consultation`(或核实后接真实调用点);`models/actions.ts` 如有 context 白名单同步
- [x] 4.3 admin 页文案标注每个 context 对应的功能 + "失败自动兜底"提示

## 5. 验证

- [x] 5.1 `npx tsc --noEmit` 仅剩 1 个预存 auth.ts 错误,零新增
- [ ] 5.2 **默认等价性**:清空相关 ModelConfig,确认 StellarWriter/DNA 实际命中模型与改动前一致(deepseek 系)
- [ ] 5.3 冒烟:onboarding(DNA)、geo-writer 全流程(初稿+审校)、竞品 suggest/scan、一键生成计划——各跑一次不回归
- [ ] 5.4 模拟首选 429(临时改 ModelConfig 指向坏模型)→ 确认自动兜底成功
- [ ] 5.5 admin 模型管理页:新 context 可见、可配、保存生效
- [x] 5.6 更新 backlog:勾掉「Gemini 429 兜底」与「candidate-fallback 抽共享 helper」;更新 MVP checklist「LLM 失败有兜底」

## 6. 已知 deferred(审计 2026-06-27 发现,单独跟进)

- [ ] 6.1 **PHASE 4 full-production 子 agent 无兜底**:`stellar-writer.ts` 的 full-production 把 `getProvider(content_generation)` 的 **provider 实例**传给 `ExecutionAgent.generate` / `RefiningStudio.refine`(签名 `provider: any`),绕过 helper → 无 429 兜底;且 RefiningStudio 实际用 content_generation 而非 content_refinement。修向:把这两个 sub-agent 改为接收 `context: string` 并内部走 `generateWithFallback`(ExecutionAgent→content_generation、RefiningStudio→content_refinement)。属次要 skills/execute 路径(主力 geo-writer UI 走 generate-stream),DNA 429 头号目标已达成,故 deferred 不阻塞本 change 归档。
