# GEO 就绪度审计维度 — 提案

## Why

产品对外宣称 **"14 维度 SEO + GEO 即时网站审计"**,GEO/AI 引用是核心差异化武器。但实测发现:

- `audit-analyzer.ts` **只计算 `seoScore`**;`SiteAudit.geoScore` 字段存在却**无人计算**(空着)。
- 首屏审计揭示屏全是 SEO 体检(健康分/页数/问题),**一条 GEO 都没有**。
- 即"SEO+GEO"目前只兑现了 SEO 一半,差异化卖点在产品里不可见。

本 change 给审计补上**真正的 GEO 维度**,把空着的 `geoScore` 填上,让"我们懂 AI 引用"在第一眼就成立。

**一条必须划清的铁律:**

```
GEO-READINESS（本期做，确定性可查）        GEO-PERFORMANCE（推迟，独立 change）
────────────────────────────────         ──────────────────────────────────
内容"结构上能否被 AI 引用"                  你"实际有没有"被 ChatGPT/Perplexity 引用
schema / AI爬虫准入 / 答案结构 / FAQ        当前实现是 SERP 冒充（citationSource='Google SERP'）
✅ 本 change 只做这个                       ❌ 绝不在本期假装
```

只查"就绪度",不碰"表现"——避免重蹈 SERP 冒充 GEO 的覆辙。

## What Changes

新增 GEO 就绪度检查(Tier 1 + Tier 2),聚合为 `geoScore`,不达标项作为 GEO issue 进 `issueReport`。

**Tier 1 — 高信号、差异化**
- **AI 爬虫准入**:新增抓 `/robots.txt`,解析 GPTBot / Google-Extended / ClaudeBot / PerplexityBot / CCBot 是否被 `Disallow`。被 block = 根本无法被该引擎引用(二元、存亡级)→ **首屏头条 GEO 发现**。
- **结构化数据覆盖率 + 类型**:现 parser 只有 `hasStructuredData` 布尔;扩展解析 JSON-LD 拿类型(Article / FAQPage / HowTo / Organization),算覆盖率 %。
- **答案可提取结构**:标题层级(H1 唯一 / H2-H3,现有)+ 新增 列表/表格计数、问句式标题(What/How/Why/`?`)检测。

**Tier 2 — good**
- **FAQ**:FAQPage schema 或 Q&A 块。
- **时效**:`datePublished` / `dateModified`(schema/meta)。
- **作者 / E-E-A-T**:author schema 或 byline。
- **llms.txt**:`/llms.txt` 是否存在(新兴标准)。

**产出**
- `AuditAnalyzer` 新增 GEO 维度,聚合上述 → `geoReadiness` 子分,填充 `SiteAudit.geoScore`。
- 每条不达标 = 一条 GEO `IssueItem`(code / severity / title / explanation / howToFix,双语),进入既有 `issueReport`。
- 站点级检查(robots/llms)+ 页面级检查(schema/结构/FAQ/时效/作者)分别聚合。

## Capabilities

### 新增
- `geo-readiness`: GEO 就绪度审计维度 —— AI 爬虫准入、结构化数据、答案结构、FAQ、时效、作者、llms.txt,聚合为 `geoScore` + GEO issues

### 修改
- `src/lib/skills/site-intelligence/crawler/fetcher.ts` 或 `crawler.service.ts`: 新增 `/robots.txt` + `/llms.txt` 抓取(带超时/容错,抓不到不阻断审计)
- `src/lib/skills/site-intelligence/crawler/parser.ts`: 扩展 `ScrapedPage` 提取(JSON-LD 类型、列表/表格数、问句标题、时效、作者)
- `src/lib/skills/site-intelligence/types.ts`: `ScrapedPage` + `SiteAuditResult` 增 GEO 字段
- `src/lib/skills/site-intelligence/audit-analyzer.ts`: 新增 GEO 检测 + `geoScore` 计算 + GEO `IssueItem` 翻译条目
- save 路由 / 审计落库: 写入 `geoScore` + GEO issues

### 不变
- `seoScore` / 技术分计算逻辑(GEO 是新增维度,不动既有)
- `IssueItem` 结构(复用 code/severity/title/explanation/howToFix + 双语表)
- 熔断/降级逻辑(robots/llms 抓取失败 = 一条发现,不整单失败)
- admin 中文 UI;用户侧 GEO issue 文案双语

## 消费方(本 change 只产出,不实现这些消费 UI)
- `first-impression-and-shell` 揭示屏 §2.5.9:消费 1 条头条 GEO 发现(AI 爬虫准入优先);**依赖本 change,缺则优雅降级不阻塞**
- 站点详情审计页:GEO 维度与 SEO 并列展示
- 教练招式:未来可基于 GEO issue 派生招式(本期不做)

## Non-Goals（后续独立 change）
- **真·AI 引用测量**(替换 `citationSource='Google SERP'` 的 SERP 冒充)—— GEO-PERFORMANCE,本期严格不碰
- Tier 3 软指标(答案前置/定义清晰、可引用统计)—— 需 LLM 判定,留待迭代
- llms.txt **自动生成**(本期只检测存在与否)
- 揭示屏 / 站点详情的 GEO 展示 UI(属消费方 change)
