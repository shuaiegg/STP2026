## 1. 取数与类型

- [x] 1.1 实现"按 siteId 取精简业务基因"的辅助（最新 `SiteOntology`，version desc 第一条；提取 coreOfferings / targetAudience / 定位差异点），缺失返回 null
- [x] 1.2 定义注入用的精简 DNA 类型（仅写作所需字段）

## 2. 注入 prompt（核心）

- [x] 2.1 在 `StrategyComposer.compose` 的 `<personalization>` 内或新增 `<business_dna>` 段，注入 服务对象 / 核心提供 / 定位差异点；保留现有 brandName/tone/type
- [x] 2.2 DNA 段措辞约束：用于视角与主题相关性，**不得转为推销口吻**；保留既有 banned words / 客观性约束
- [x] 2.3 DNA 缺失时不输出该段，行为回退到当前通用 prompt

## 3. 透传 siteId/ontology 到 compose

- [x] 3.1 `StellarWriterSkill.executeInternal`：取 ontology → 经 options 传入 compose
- [x] 3.2 `generate-stream/route.ts`：同上路径接通
- [x] 3.3 确认所有写作入口都经过 `StrategyComposer.compose`（无绕开者）；若有，补齐

## 3b. 登录写作 UI 站点选择器（2026-06-25 审查新增 — P2 实际生效的前提）

> 审查发现：server 端已接通，但无调用方传 siteId → DNA 空接。需在登录写作 UI 显式提供 siteId。

- [x] 3b.1 geo-writer（登录态）：加站点选择器（取用户 sites 列表），选定后把 `siteId` 放入发往 `skills/execute` 的 `input`
- [x] 3b.2 library editor：同上接通 `siteId`（若文章已关联站点则默认选中）
- [x] 3b.3 匿名/无站点维持现状：不显示选择器、不传 siteId，走 DNA 降级
- [x] 3b.4 Design Compliance：站点选择器用 brand token、rounded-lg、文案入 i18n/COPY；对改动文件跑 `/web-design-guidelines`
- [x] 3b.5 端到端验证：登录 → geo-writer 选站点 → 生成 → 确认 prompt 含 `<business_dna>`（日志/调试）且产出体现该站点业务

## 4. locale 对齐

- [x] 4.1 DNA 段措辞语言与产出内容 locale 一致（zh/en），避免中英混杂

## 5. 验证（质量对比）

- [ ] 5.1 选 1–2 个真实站点 + 固定关键词，生成"改前 / 改后"各一篇
- [ ] 5.2 按 `rules/content-scorecard.md` 五维人工评估，确认改后在"业务贴合度 / 受众相关性"上提升、且未引入促销夸张或结构退化
- [x] 5.3 验证无 ontology 的站点生成不报错、产出与改前一致（降级正确）：脚本 `verify-business-dna.ts` 证 businessDna=null 时无 `<business_dna>` 且保留约束
- [x] 5.4 抽查 DNA 段未把 banned words / promo 语气带入正文：真机产出客观、引数据、无软广

## 6. 真机调优（2026-06-25 — 真机走查中发现）

- [x] 6.1 强化 `<business_dna>` 指令：原措辞过软（"参考背景"）导致模型基本忽略 DNA，产出仍通用。改为明确写作指令（以目标受众为读者、开篇击痛点、用核心服务领域深度举证），仍保留"不得推销/客观性"约束。脚本 `verify-business-dna.ts` 已加断言锁定
- [x] 6.2 站点选择器从第二步（内容步）移到第一步（关键词步）——"先定为谁写，再写什么"；并改用 brand token 样式（替换原 slate 硬编码）
- [x] 6.3 真机复测（2026-06-25）：业务具体关键词「内容营销 ROI」下，产出精准命中受众（营销负责人/CFO）、痛点（内容投入无回报）、资产定位（内容资产管理），且无软广。泛词「GEO 定义」下效果弱属预期（大词无抓手）
