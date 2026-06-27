## Context

两条提取路径 + 真机暴露的问题（本轮 explore 追实）：

```
① onboarding extractBusinessDna(crawler.service)：首页+about 的 title/desc/h1/h2（薄、2 页、无正文）
   → 只产 coreOfferings/targetAudience/painPoints/brandTone，无 idealTopicMap
② #overview ontology 路由：存档 report.nodes 元数据（最多 50 页，混中英、无正文）
   → 产全套含 idealTopicMap；被中文"出海营销"标题带偏 → 亚马逊幻觉
```

`extractPageData` 计算 wordCount 后**丢弃正文**，且不抓 `<html lang>`。`SiteOntology` 无 positioning / brandTone / sourceLocale 字段。

收敛理念：**DNA = 语言无关的业务本质 → 主语言提取一次（规范 DNA）→ 输出按目标语言 LLM 桥接**（详见 proposal）。

## Goals / Non-Goals

**Goals:**
- 提取出**正确**的 DNA：单语言隔离、喂业务页正文、不被其他语言/博客标题干扰。
- 语言一致：DNA + idealTopicMap + 缺口同为规范语言 → 蓝图 join 必成功。
- schema 补全 positioning + brandTone（让 P2 写作吃到差异点/语气）。
- 提取 O(1) 不随语种数膨胀；信任(glass-box) + 编辑保护。

**Non-Goals（留扩展点 / backlog）:**
- SERP 接地 idealTopicMap、陈旧检测、竞品共用管线 —— design 留接口，分阶段。
- 活的 DNA（GSC 真实表现回流修正 idealTopicMap）—— 未来 epic，接 backlog A 衡量环。
- 完整 per-locale 多份 DNA（已被"单一规范 + 桥接"取代）。
- onboarding 把 DNA 确认做成一等步骤 —— 另起高优先 change。

## Decisions

### 决策 1：单一规范 DNA + 输出桥接（取代 per-locale 多份）
业务本质语言无关。只从主语言提取一份，标 `sourceLocale`。生成内容时 prompt 指定目标语言，LLM 从规范 DNA 桥接。提取成本 O(1)。

### 决策 2：主语言检测——语言无关、以首页为准
信号优先级：首页 `<html lang>` → 语言检测库（franc 等）→ 域名 TLD / 内容采样。**不用汉字比例**。以**首页**而非页数判定（避免博客量大把语言带偏：scaletotop 博客中文多但主站英文）。`extractPageData` 抓 `<html lang>`，每页打 locale 仅用于"提取时只挑主语言页"。

### 决策 3：业务页识别启发式
挑「描述业务」的页面：首页 + 首页导航里指向 about/pricing/product/services 的链接（URL 关键词 + 链接文案匹配，跨语言关键词表），**排除 blog/news/legal/privacy/terms**。重抓这些页的**正文摘要**（截断）喂 LLM。无 about/pricing 时退化到首页 + 词数最高的非博客页。

### 决策 4：统一提取器
`extractBusinessDna` 重写为统一入口，产出全套字段（含 idealTopicMap/logicChains/positioning/brandTone）。onboarding 与 ontology 路由都调它，删除路由内重复的提取 prompt。

### 决策 5：schema 补全
`SiteOntology` 加 `positioning String[]`、`brandTone String?`、`sourceLocale String?`。DnaEditor 增 positioning 编辑 + brandTone 显示；P2 `getBusinessDNA` 带出 positioning（写作 prompt 用）。

### 决策 6：语言一致性修正
`getSemanticGap` 的输出语言改用 **DNA.sourceLocale**（撤回 `business-dna-governance` 临时传的 user.locale）。idealTopicMap 与缺口 topic 同语言 → 蓝图归一化 join 必成功。

### 决策 7：编辑保护 + glass-box（信任）
re-analyze 触发前，若 ontology 已 `confirmedAt`（用户确认/编辑过）→ 警告"将替换您的修改"。提取结果展示"读取的页面清单" + "AI 初步判断，可修改"。

### 决策 8：薄站降级
爬取业务页内容不足（字数阈值）→ 不硬塞 LLM，改引导用户填一句业务描述作为提取种子。

## 扩展点（本期留接口，后续实现）

- **SERP 接地 idealTopicMap**：提取 idealTopicMap 时并入竞品/SERP 真实排名话题（DataForSEO）→ 市场接地而非 LLM 凭空。统一提取器预留"外部话题信号"入参。
- **陈旧检测**：提取时记录站点签名（关键页 hash/页数）；后续爬取显著变化 → 提示刷新 DNA。
- **竞品共用管线**：`inferCompetitors` 复用同一干净提取上下文，并用 DNA 反向校验竞品。

## Risks / Trade-offs

- **业务页识别不准**：跨站/跨语言 URL 模式各异，可能挑错页。缓解：多信号（导航链接文案 + URL 关键词 + 排除清单）+ 退化策略；glass-box 让用户看到读了哪些页、可纠正。
- **重抓正文成本**：提取时多抓 3–5 页。可接受（用户已确认），且远小于存全站正文。
- **主语言判定错**（lang 写死/SPA/geo 跳转）：多信号兜底；判错时用户可在 DnaEditor 触发"按 X 语言重新提取"（来源标注让错误可见）。
- **schema 迁移**：三个可空列，安全；按规范走 `migrate dev`（勿 db push，见 backlog 迁移纪律）。
- **规范语言 ≠ 后台语言的展示落差**：本期接受（决策 M：显示规范语言 + 来源标注）；翻译展示留 backlog。
