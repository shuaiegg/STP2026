# GEO 就绪度审计维度 — 设计决策

## 决策 1：只做 READINESS，严格不碰 PERFORMANCE

```
READINESS（本期）                          PERFORMANCE（推迟）
内容结构是否"可被" AI 引用                   内容是否"已被" AI 引用
确定性、从已抓 HTML/robots 即可判定           需真实查询各 AI 引擎
↓ 永远不说"你被/没被引用"                     ↓ 当前 SERP 冒充，独立 change 替换
↓ 只说"你的内容（不）具备被引用的结构条件"
```
文案纪律:GEO issue 只描述"结构缺失/具备",绝不出现"已被引用 / 未被引用 / 引用次数"。

## 决策 2：两类检查 —— 站点级 + 页面级，分别聚合

```
站点级（每站一次，新增 fetch）            页面级（每页，扩展 parser）
──────────────────────────              ──────────────────────────
/robots.txt → AI 爬虫准入                 JSON-LD schema 类型 + 覆盖
/llms.txt   → 存在与否                    列表/表格数、问句式标题
                                         FAQ（FAQPage schema / Q&A 块）
                                         时效（datePublished/Modified）
                                         作者（author schema / byline）
```
- 站点级 2 个额外 fetch（robots/llms），只在审计开始抓一次，**带超时 + 容错**
- 页面级全部从**已抓 HTML** 解析（零额外网络），cheap

## 决策 3：AI 爬虫准入是头条信号 —— 二元、存亡级

```
解析 /robots.txt 中针对 AI 爬虫的 User-agent 段：
  GPTBot(OpenAI) · Google-Extended(Gemini/AIO) · ClaudeBot/anthropic-ai(Claude)
  PerplexityBot · CCBot(Common Crawl，多数 LLM 训练源)
对每个：是否被 Disallow: /（或覆盖关键路径）
```
- 任一被 block → 严重(P0)GEO issue:"你在屏蔽 {Bot},该引擎无法引用你的内容"
- 全放行 → 正向信号(不报 issue 或记一条 ✓)
- **抓不到 robots.txt**(404/超时)= 视为"无限制"(默认放行),但记一条**信息级**提示;绝不因抓不到而整单失败
- 这是首屏头条 GEO 发现的首选(差异化、震撼、1 fetch)

## 决策 4：结构化数据从"有没有"升级到"有什么 + 覆盖多少"

```
现状: ScrapedPage.hasStructuredData: boolean（只知有无 JSON-LD）
升级: 解析 <script type="application/ld+json"> 的 @type
      → schemaTypes: string[]（如 ['Article','Organization']）
聚合:
  - 覆盖率 = 有 schema 的页 / 总页
  - 关键类型缺失：内容站缺 Article/BlogPosting、缺 Organization、缺 FAQPage
issue 示例: "21 页仅 3 页有结构化数据 → AI 难以提取并引用你的内容"
```
- JSON-LD 解析要容错(脏 JSON / @graph 数组 / 多个 script)→ try/catch,失败按"无"计
- 关键类型按站点性质给(博客/内容站重点看 Article/FAQPage)

## 决策 5：答案可提取结构 —— AI 引用的是"自包含的块"

```
已有: h1/h1Count/h2/h3
新增（从 HTML 计数，cheap）:
  listCount   = <ul> + <ol>
  tableCount  = <table>
  qHeadings   = h2/h3 中问句式（含 ? 或 What/How/Why/When/Which 开头，中英）
就绪信号:
  H1 唯一 + 有 H2/H3 分层 + 有列表/表格 + 有问句式标题 = 易被分块引用
issue 示例: "内容缺少列表/表格/问答式结构，AI 难以摘出可引用片段"
```

## 决策 6：geoScore 计算 —— 站点级闸门 + 页面级覆盖，可调权重

```
geoScore（0-100）= 站点级 × 页面级聚合，权重放 config（真实数据会推翻拍脑袋）
  站点级闸门:
    AI 爬虫被 block       → 重罚（这是存亡项）
    llms.txt 缺失         → 轻提示
  页面级（站点平均/覆盖率）:
    schema 覆盖率         权重高
    答案结构（列表/表格/问句）
    FAQ 覆盖
    时效（有发布/更新日期）
    作者/E-E-A-T
```
- MVP 给一组默认权重 + 可调常量；不追求"科学",追求"方向正确 + 可解释"
- `geoScore` 与现有 `seoScore`/技术分并列填入 `SiteAudit`

## 决策 7：每条不达标 = 一条 GEO IssueItem，复用既有结构与双语表

```
复用 audit-analyzer 的 IssueItem { code, severity, title, explanation, howToFix }
新增 GEO code 段（双语翻译表），如：
  GEO_AI_CRAWLER_BLOCKED   (P0)  你在屏蔽 {Bot}
  GEO_NO_SCHEMA            (P1)  结构化数据覆盖过低
  GEO_NO_ANSWER_STRUCTURE  (P2)  缺答案可提取结构
  GEO_NO_FAQ               (P2)  无 FAQ / FAQPage
  GEO_STALE_NO_DATES       (P3)  内容缺时效信号
  GEO_NO_AUTHOR            (P3)  缺作者/E-E-A-T
  GEO_NO_LLMS_TXT          (info) 无 llms.txt
```
- 严重度反映对"可被引用"的实际影响(爬虫被封最重)
- howToFix 给可操作步骤(如"在 robots.txt 移除对 GPTBot 的 Disallow")

## 决策 8：抓取健壮性 —— 沿用 first-impression 的"发现而非中止"原则

- robots.txt / llms.txt 抓取失败(超时/404)**不计入熔断、不整单失败**
- 缺失本身就是一条发现(robots 缺=默认放行的信息项;llms 缺=轻提示)
- 与 `first-impression-and-shell` 已落地的 transport-vs-HTTP 区分一致

## 验收基准
- `SiteAudit.geoScore` 被真实计算并落库（不再为空）
- robots.txt 解析正确识别 5 类 AI 爬虫的 allow/block;被 block 出 P0 GEO issue
- schema 类型被解析(非仅布尔);覆盖率正确;低覆盖出 issue
- 列表/表格/问句标题被计数;缺答案结构出 issue
- FAQ / 时效 / 作者 / llms.txt 各出对应 issue
- GEO issues 双语;admin 中文、用户侧双语
- robots/llms 抓不到时审计照常完成(降级为发现)
- 文案零"已被/未被引用"措辞(readiness≠performance)
- `tsc` + `build` 通过;真实站点(scaletotop.com)跑出非空 geoScore + 至少数条 GEO 发现
