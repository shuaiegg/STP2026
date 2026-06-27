## 1. Schema & 迁移

- [x] 1.1 `SiteOntology` 新增 `positioning String[]`、`brandTone String?`、`sourceLocale String?`（另加 `pagesRead String[]`）
- [x] 1.2 `migrate dev` 出迁移文件（勿 db push）；`prisma generate`

## 2. 语言检测（语言无关）

- [x] 2.1 `extractPageData` 抓 `<html lang>`，ScrapedPage 增 `lang` 字段
- [x] 2.2 主语言判定辅助：首页 `<html lang>` → 检测库（franc 等）→ TLD/采样兜底；返回 primaryLocale + 每页 locale
- [x] 2.3 不使用汉字比例等语言相关启发式

## 3. 业务页识别 + 单语言隔离提取

- [x] 3.1 业务页识别（2026-06-27 真机调优）：改"**一级页面(depth≤1) − 黑名单**"策略（不再强求业务关键词，读更多）；**pricing/price/plans/contact/cart/login/legal 进黑名单**（避免定价页 $ 金额污染 DNA）；业务关键词仅加分排序；上限 4→8；规范化尾斜杠去重；**扫全部 `<a>`(含 footer/CTA,不止 nav)** → 发现 nav 外的一级业务页(如 /consultation)。scaletotop 实测 3→4 页(home/about/tools/consultation)
- [x] 3.1b proof 反捏造（2026-06-27）：prompt 禁止编造统计 + `sanitizeProof` 确定性守卫（proof 里"带单位整 token"未在源正文逐字命中 → 清空该 proof）。注：scaletotop 的 10,000+/2.4M/98% 经查为 /about 真实内容,守卫正确保留
- [x] 3.2 只取**主语言**业务页，重抓**正文摘要**（截断）作为提取上下文
- [x] 3.3 薄站降级：业务页字数不足 → 引导用户填业务描述种子

## 4. 统一提取器

- [x] 4.1 重写 `extractBusinessDna` 为统一入口：产出全套（coreOfferings/targetAudience/painPointsSolved/idealTopicMap/logicChains/positioning/brandTone），单语言上下文
- [x] 4.2 `ontology` 路由改调统一提取器，删除路由内重复 prompt
- [x] 4.3 onboarding（save 路径）也走统一提取器；写入 `sourceLocale`
- [x] 4.4 提取结果记录"读取的页面清单"（供 glass-box 展示）

## 5. 语言一致性 + 下游

- [x] 5.1 `getSemanticGap` 输出语言改用 DNA `sourceLocale`（撤回临时的 user.locale）
- [x] 5.2 `getBusinessDNA`（P2）带出 positioning；`StrategyComposer` 的 `<business_dna>` 注入 positioning + brandTone
- [x] 5.3 确认蓝图归一化 join 在"DNA 与缺口同 sourceLocale"下命中（scaletotop v9 缺口已生成 8 条英文）
- [x] 5.4 （2026-06-27 真机修复）**re-extract（ontology 路由）漏接 gap 重算** → 加 `await getSemanticGap(siteId, true, sourceLocale)` + 刷缓存。否则新版本 0 debts → 蓝图无覆盖、strategy/generate 报 400「no semantic debts」
- [x] 5.5 （2026-06-27 用户需求）**ContentPlan 陈旧检测**：`ContentPlan` 加 `sourceOntologyId`（迁移 `20260627000001`）；strategy/generate 写入；strategy GET 返回 `stale`（活跃计划的 sourceOntologyId ≠ 最新 ontology）；StrategyBoard 显示「业务基因已更新,重新生成?」横幅(override 重生,不自动销毁进行中计划)
- [x] 5.6 （2026-06-27 真机修复）strategy/generate 自愈：缺口缺失时即时算一遍,不再死给 400；GET /strategy **过滤 ARCHIVED**（否则归档的旧计划仍渲染在看板 → "还显示亚马逊" + `status.ARCHIVED` 文案缺失报错）；补 `status.ARCHIVED` 文案(zh/en)

## 6. DnaEditor（UI）

- [x] 6.1 positioning 加 chip 编辑；brandTone 显示（只读或单行编辑）
- [x] 6.2 "基于您的 <sourceLocale> 站点提取" 来源标注
- [x] 6.3 Glass-box：展开"读取的页面"清单
- [x] 6.4 re-analyze 前警告：已 confirmedAt 时提示"将替换您的修改，是否继续"

## 7. Design Compliance（UI 任务）

- [x] 7.1 新增文案走双语 `COPY[locale]`（沿用 DnaEditor 现有模式）
- [x] 7.2 颜色 brand token / 交互 rounded-lg（DnaEditor 既有 slate 债随站点详情 normalize，不在此扩大）
- [ ] 7.3 对修改文件跑 `/web-design-guidelines`

## 8. 验证

- [x] 8.1 ✅ 脚本直跑 `extractBusinessDna('https://scaletotop.com')`：sourceLocale=en、读取 首页/pricing/about、coreOfferings/positioning/idealTopicMap 全为准确英文 SEO/GEO SaaS（亚马逊垃圾消失）
- [ ] 8.2 蓝图：idealTopicMap 与缺口同语言 → 支柱覆盖/证据正确（非全 0/7 或全已建立）
- [ ] 8.3 编辑保护：确认 DNA 后点 re-analyze → 弹警告
- [x] 8.4 ✅ glass-box：pagesRead 正确填充业务页（首页/pricing/about）
- [ ] 8.5 薄站：内容不足时引导填业务描述，不报错
- [ ] 8.6 多语言站：仅按主语言提取一份；输出中文文章时 LLM 正常桥接
