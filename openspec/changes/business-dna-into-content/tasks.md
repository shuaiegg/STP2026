## 1. 取数与类型

- [ ] 1.1 实现"按 siteId 取精简业务基因"的辅助（最新 `SiteOntology`，version desc 第一条；提取 coreOfferings / targetAudience / 定位差异点），缺失返回 null
- [ ] 1.2 定义注入用的精简 DNA 类型（仅写作所需字段）

## 2. 注入 prompt（核心）

- [ ] 2.1 在 `StrategyComposer.compose` 的 `<personalization>` 内或新增 `<business_dna>` 段，注入 服务对象 / 核心提供 / 定位差异点；保留现有 brandName/tone/type
- [ ] 2.2 DNA 段措辞约束：用于视角与主题相关性，**不得转为推销口吻**；保留既有 banned words / 客观性约束
- [ ] 2.3 DNA 缺失时不输出该段，行为回退到当前通用 prompt

## 3. 透传 siteId/ontology 到 compose

- [ ] 3.1 `StellarWriterSkill.executeInternal`：取 ontology → 经 options 传入 compose
- [ ] 3.2 `generate-stream/route.ts`：同上路径接通
- [ ] 3.3 确认所有写作入口都经过 `StrategyComposer.compose`（无绕开者）；若有，补齐

## 4. locale 对齐

- [ ] 4.1 DNA 段措辞语言与产出内容 locale 一致（zh/en），避免中英混杂

## 5. 验证（质量对比）

- [ ] 5.1 选 1–2 个真实站点 + 固定关键词，生成"改前 / 改后"各一篇
- [ ] 5.2 按 `rules/content-scorecard.md` 五维人工评估，确认改后在"业务贴合度 / 受众相关性"上提升、且未引入促销夸张或结构退化
- [ ] 5.3 验证无 ontology 的站点生成不报错、产出与改前一致（降级正确）
- [ ] 5.4 抽查 DNA 段未把 banned words / promo 语气带入正文
