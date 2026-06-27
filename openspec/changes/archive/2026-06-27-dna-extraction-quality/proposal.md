## Why

业务基因（`SiteOntology`）是整条内容引擎的脊柱（喂 缺口/蓝图/策略/写作）。但当前提取在真机上**产出错误的 DNA**——以 flagship 站 scaletotop.com 为例：英文 SEO/GEO SaaS，却被提取成**中文的"亚马逊出海电商"业务**。根因有三：

1. **提取上下文太薄且混语言**：两条提取路径（onboarding 的 `extractBusinessDna` 只喂 首页+about 的 title/desc；`#overview` 的 ontology 路由喂存档 `report.nodes` 元数据）都**只喂元数据、不喂正文**，且 ontology 路由把**中英文页面标题混在一起**喂给 LLM → 被中文"出海营销"博客标题带偏 → 误判成亚马逊。
2. **语言不一致**：DNA/缺口/idealTopicMap 跟 `User.locale`（后台语言）产出，与站点内容语言脱节；缺口（英文）与 idealTopicMap（中文）语言不一致 → 蓝图 join 失败。
3. **DNA schema 缺关键字段**：没有 positioning/差异点（让内容"像这家公司"的核心）、`brandTone` 抽了却无字段可存。

**核心理念（探索收敛）**：DNA 是**业务本质，语言无关**。多语种站点内容通常是平行翻译（同一业务），无需逐语言各提取一份（成本随语种数膨胀）。正解是 **从主导语言干净地提取一次「规范 DNA」，输出时按目标语言由 LLM 桥接**——提取 O(1)，对 3 种、5 种语言的客户成本相同。这对**中国出海客户**尤其契合：一次读懂业务，再用目标市场语言生产内容。

## What Changes

- **语言无关的主语言检测**：以首页 `<html lang>` 为主，缺失时用语言检测库（如 franc），再退化到 TLD/内容采样；**不用汉字比例**（主站常为英文，中文只是其中一种）。`extractPageData` 抓 `<html lang>` 并给每页打 locale。
- **单语言隔离 + 业务页识别提取**：只挑**主语言**的「描述业务」页面（首页/about/定价/产品，排除 blog/legal），**重抓正文摘要**喂 LLM（而非元数据）→ 干净、不混语言。
- **统一提取器**：onboarding 与 `#overview` 重分析共用一套逻辑，产出**全套** DNA（coreOfferings/targetAudience/painPointsSolved/idealTopicMap/logicChains + **新增 positioning + brandTone**）。
- **规范 DNA + 语言一致性**：`SiteOntology` 加 `sourceLocale`；缺口/idealTopicMap 用 **DNA 的 sourceLocale**（而非 User.locale）→ 二者同语言 → 蓝图 join 必成功。内容生成输出语言仍按上下文（localeDirective + LLM 桥接）。
- **展示规范语言 + 来源标注**：蓝图/编辑器显示规范语言 DNA，加"基于您的 <语言> 站点提取"标注。
- **编辑保护**：re-analyze 前警告"将替换当前 DNA（含您的修改）"，避免悄悄覆盖已确认/编辑的 DNA。
- **Glass-box**：展示"我们读取了哪些页面"，让 DNA 可信、让编辑显得自然。
- **薄站降级**：爬取内容不足时，引导用户用一句话描述业务作为提取种子。

## Capabilities

### New Capabilities

- `business-dna-extraction` — 语言无关、单语言隔离、业务页驱动的规范业务基因提取，含 positioning/brandTone、来源语言标注、编辑保护与 glass-box。

### Modified Capabilities

- 缺口分析语言来源：由 `User.locale` 改为 DNA 的 `sourceLocale`（修正 `business-dna-governance` 临时给 `getSemanticGap` 传 user.locale 的做法）。

## Impact

- **定位**：dashboard（仪表盘，非公开、中文 UI）+ 提取后端。无 i18n 路由影响；DnaEditor 新字段须双语（沿用已修的 `COPY[locale]`）。
- **Schema（BREAKING-ish）**：`SiteOntology` 新增 `positioning String[]`、`brandTone String?`、`sourceLocale String?`（+ 迁移，走 `migrate dev`，勿 db push）。
- **文件**（预估）：`crawler/parser.ts`（抓 lang）、`crawler.service.ts`（`extractBusinessDna` 重写为统一提取器 + 业务页识别 + 正文）、`ontology` 路由（改调统一提取器）、`semantic-gap-service.ts`（语言来源用 sourceLocale）、`DnaEditor.tsx`（positioning/brandTone/来源标注/glass-box/重分析警告）、`prisma/schema.prisma`。
- **blast radius 比 per-locale 方案小得多**：消费方仍用"该站点的（唯一）规范 DNA"，无需逐处穿 locale（输出语言由 prompt 处理）。
- **不含**（见 design 扩展点 / backlog）：SERP 接地 idealTopicMap、陈旧检测、竞品共用管线、活的 DNA（GSC 回流）、onboarding DNA 确认步骤、完整 per-locale 多份 DNA。
