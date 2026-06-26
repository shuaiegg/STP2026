## 1. Schema & 迁移

- [x] 1.1 `SiteOntology` 新增 `confirmedAt DateTime?`
- [x] 1.2 出迁移文件（`migrate dev`）—— 顺手把 backlog "迁移历史漂移" 一并基线化或至少本列规范入档；`prisma generate`

## 2. 服务端写入路径

- [x] 2.1 新增"保存用户编辑 DNA"server action / 路由：接收 coreOfferings / targetAudience / painPointsSolved / idealTopicMap → 创建新 `SiteOntology` version（不调 LLM），写 `confirmedAt`
- [x] 2.2 保存后：若 idealTopicMap 变化，触发 `getSemanticGap(siteId, forceRefresh=true)` + `revalidateTag(coachHomeTag(siteId), 'max')`
- [x] 2.3 保留现有 LLM 重抽 POST（"让 AI 重新分析"），与编辑路径并存

## 3. 编辑 UI（#overview）

- [x] 3.1 `OverviewPanel` 加 DNA 编辑器：coreOfferings / targetAudience / painPointsSolved 用 chip 列表（增/删/改）
- [x] 3.2 idealTopicMap 结构化编辑：topic + subtopics 两层增删改
- [x] 3.3 logicChains 只读展示（Problem→Solution→Proof）
- [x] 3.4 "确认业务基因" 主按钮（保存即写 confirmedAt）+ "让 AI 重新分析" 次按钮

## 4. 教练招式闭环

- [x] 4.1 `define_ontology` detect 改为：有 ontology 但 `confirmedAt == null` → 仍提示"确认业务基因"；确认后该招式消失

## 5. Design Compliance（UI 任务）

- [x] 5.1 颜色全用 brand token（无硬编码 hex / ad-hoc Tailwind 色）
- [x] 5.2 无已移除工具类（.border-brutalist / .bg-gradient-brand 等）
- [x] 5.3 交互元素 rounded-lg；用户可见文案入 const COPY / i18n
- [ ] 5.4 对修改文件跑 `/web-design-guidelines` 并修复

## 6. 验证

- [x] 6.1 编辑各字段 → 保存 → 确认新 version 落库、`confirmedAt` 写入（真机通过）
- [x] 6.2 编辑 idealTopicMap → SemanticDebt 重算、coach 缓存刷新、蓝图读到新缺口（真机通过，需先修兜底见 7.4）
- [x] 6.3 `define_ontology` 招式：未确认时出现、确认后消失（真机通过）
- [ ] 6.4 无 ontology 站点引导（未直接验证）

## 7. 真机验证修复（2026-06-26）

- [x] 7.1 DnaEditor i18n：`COPY` 改双语 `COPY[key][locale]` + `useLocale`，修内联中文 aria（EN 后台标签不再显示中文）
- [x] 7.2 OverviewPanel "业务基因" 标题 → `t('coreDna')`（i18n）
- [x] 7.3 `ontology.ts` 给 `getSemanticGap` 传 locale（否则缺口与 idealTopicMap 语言不一致 → 蓝图 join 失败）
- [x] 7.4 `getSemanticGap` 接 `resolveModelForContext('skill_default')` + 多 provider 兜底（抗 Gemini 429）
