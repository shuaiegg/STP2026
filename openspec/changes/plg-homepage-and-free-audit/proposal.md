## Why

获客侧有两个互相咬合的硬伤(explore 收敛):

1. **没有任何"先试后买"的公共入口**:`instant-audit` 在登录墙后(`/dashboard/...`),首页 hero 输域名也是直接进登录/注册 → **注册前看不到任何价值 = 转化墙**。对一个靠 SEO/PLG 获客的产品,这是致命的。
2. **首页像内部说明书,不是转化机器**(已做专业文案诊断):
   - Hero "Secure Your Traffic Gaps / map your traffic galaxy" 过不了 5 秒测试,用隐喻代替结果,且与"理性/证据"调性矛盾;
   - 三步流程**第 2 步明写"先注册"**=自毁式转化墙(与"免费/无需卡"自相矛盾);
   - 全页**零证据**、卖功能不卖结果、用内部黑话("Diagnosis/Production/Verification");
   - **GEO 差异化被埋没、品类没教育**;
   - 定价段 "No expensive subscriptions" **反订阅**(与我们转订阅方向冲突)。

这两件是同一个获客故事:Hero 该承诺"免费、无需注册看结果"→ 必须有一个真正公共的审计来兑现 → 注册闸落在"行动"。

## What Changes

1. **公共免费审计(无需登录)**:新增轻量公共端点 + 结果页,复用 `CrawlerService.performFullAuditWithProgress`(爬取 + 规则:SEO + GEO 就绪/AI 爬虫可达性 + 可选免费 Google PSI),**不调 LLM/DataForSEO**(边际成本≈0)。输域名 → 当场看诊断 → 行动(修复/生产/追踪)才注册。
2. **首页 PLG 重写(en/zh)**:用已装的 `copywriting`/`cro`/`marketing-psychology` 技能 + `.agents/product-marketing.md`,按转化动线重排:
   - Hero:AI 搜索转变楔子 + 结果导向 + 免费无墙审计(诚实:不宣称"AI 引用追踪",说"搜索排名/可见度"+"GEO 就绪/可被引用度");
   - 即时证明(审计样张)→ 痛点共鸣 → 新方法(SEO+GEO 品类教育)→ 怎么做(去掉"先注册"步)→ 凭什么信(对比/双语优势)→ FAQ(异议)→ 单一 CTA;
   - 修掉反订阅的定价文案。
3. **注册闸位**:诊断免费公开;**注册发生在"行动"**(修复/生成/连接 GSC/保存)。
4. **防滥用**:公共审计按 IP 限流 + 按域名缓存 + 限爬取深度。

## Capabilities

### New Capabilities
- `public-free-audit`: 无需登录的公共站点审计(爬+规则+可选 PSI,≈$0),作为获客钩子。
- `plg-homepage`: 转化导向、诚实、双语的首页信息架构与文案。

### Modified Capabilities
<!-- 衡量/审计措辞延续 citation-tracking-honesty;不改其 spec -->

## Impact

- **新增**:公共审计端点(`api/(public)/audit` 或 `api/public-audit`)+ 公共结果页(`[locale]/(public)/audit` 或复用 tools 区)+ 限流/缓存。
- **修改**:`[locale]/(public)/page.tsx` + `HomePageCTA`(hero→公共审计而非登录)+ `messages` home namespace(en/zh 全量文案)+ 首页各 section(证据/痛点/FAQ/对比)。
- **复用**:`CrawlerService.performFullAuditWithProgress`(免费爬+规则);可选 Google PageSpeed Insights API(免费配额)。
- **不影响**:登录后的 instant-audit(深度版,含 LLM)、模型路由、积分。
- **风险**:中。新公共端点(防滥用必做)+ 首页结构性重排;审计措辞须诚实。
- **依赖**:`.agents/product-marketing.md`(已建)+ 营销技能(已装)。
- **关联**:与 `tools-placement-and-access` 是相邻的获客 vs 产品归位;延续 citation-honesty。
- **Deferred(backlog)**:邮箱留资门(partial→full report)、个性化 hero(输域名后 CTA 动态)、动态社会证明、真证言(有了再加)、深度审计的公共预览。
