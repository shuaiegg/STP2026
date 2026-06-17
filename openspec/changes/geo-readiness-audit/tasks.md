# GEO 就绪度审计维度 — 任务清单

> 铁律：只做 READINESS（结构上能否被引用），绝不碰 PERFORMANCE（是否已被引用）。
> 文案零"已被/未被引用"。robots/llms 抓不到 = 发现，不整单失败。
> admin 中文 UI；用户侧 GEO issue 双语。复用 `IssueItem` 结构。

---

## Sprint 1 — 数据提取（站点级 + 页面级信号）

### 1.1 站点级抓取（新增 2 个 fetch，带超时/容错）
- [ ] 1.1.1 抓 `/robots.txt`：解析 AI 爬虫段 GPTBot / Google-Extended / ClaudeBot(anthropic-ai) / PerplexityBot / CCBot 的 allow/block
- [ ] 1.1.2 抓 `/llms.txt`：是否存在（200 vs 404）
- [ ] 1.1.3 抓取失败（超时/404）→ 降级为"发现"，不计熔断、不阻断审计（沿用 transport 容错）
- [ ] 1.1.4 结果挂到 `SiteAuditResult`（新增 `geoSignals.site` 字段）

### 1.2 页面级提取（扩展 parser，全部从已抓 HTML，零额外网络）
- [ ] 1.2.1 JSON-LD 类型解析：`schemaTypes: string[]`（容错 @graph/多 script/脏 JSON；失败按无）
- [ ] 1.2.2 列表/表格计数：`listCount`(<ul>+<ol>)、`tableCount`(<table>)
- [ ] 1.2.3 问句式标题检测：h2/h3 含 `?` 或 What/How/Why/When/Which（中英）→ `questionHeadingCount`
- [ ] 1.2.4 时效：`datePublished`/`dateModified`（schema 优先，meta 兜底）→ `hasDates`
- [ ] 1.2.5 作者：author schema 或 byline → `hasAuthor`
- [ ] 1.2.6 `ScrapedPage` + `types.ts` 增上述字段；FAQPage 由 schemaTypes 派生

---

## Sprint 2 — GEO 计算 + issues + 落库 + 验收

### 2.1 geoScore 计算（audit-analyzer 新增 GEO 维度）
- [ ] 2.1.1 站点级闸门：AI 爬虫被 block 重罚；llms.txt 缺失轻提示
- [ ] 2.1.2 页面级聚合：schema 覆盖率 / 答案结构 / FAQ 覆盖 / 时效 / 作者（权重放 config 常量）
- [ ] 2.1.3 聚合为 `geoScore`(0-100)，与 `seoScore`/技术分并列填入 `SiteAudit`

### 2.2 GEO issues（复用 IssueItem + 双语表）
- [ ] 2.2.1 新增 GEO code 双语翻译：`GEO_AI_CRAWLER_BLOCKED`(P0) / `GEO_NO_SCHEMA`(P1) / `GEO_NO_ANSWER_STRUCTURE`(P2) / `GEO_NO_FAQ`(P2) / `GEO_STALE_NO_DATES`(P3) / `GEO_NO_AUTHOR`(P3) / `GEO_NO_LLMS_TXT`(info)
- [ ] 2.2.2 每条不达标生成对应 IssueItem，带受影响页/具体 Bot，进 `issueReport`
- [ ] 2.2.3 howToFix 可操作（如"在 robots.txt 移除对 GPTBot 的 Disallow"）
- [ ] 2.2.4 文案纪律审查：零"已被/未被引用"措辞

### 2.3 落库 + 验收
- [ ] 2.3.1 save 路由 / 审计写入 `geoScore` + GEO issues
- [ ] 2.3.2 验证（真机 scaletotop.com）：geoScore 非空；robots 5 类爬虫识别正确；schema 类型/覆盖正确；列表/表格/问句计数；FAQ/时效/作者/llms 各出 issue
- [ ] 2.3.3 验证：robots/llms 抓不到时审计照常完成（降级为发现）
- [ ] 2.3.4 `tsc` + `build` 通过；GEO issues 双语、admin 中文

---

## 交付给消费方
- [ ] 3.1 通知 `first-impression-and-shell` §2.5.9：GEO 维度就绪，揭示屏可消费头条 GEO 发现（AI 爬虫准入优先）
- [ ] 3.2 站点详情审计页 GEO 展示、教练招式派生 = 后续（非本 change）

---

## 已知偏差 / 推迟
- 真·AI 引用测量（替换 SERP 冒充）—— GEO-PERFORMANCE，独立后续 change
- Tier 3 软指标（答案前置/可引用统计，需 LLM 判定）
- llms.txt 自动生成（本期只检测）
- GEO 展示 UI（属消费方 change）
