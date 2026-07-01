## Context

- `instant-audit` 现在在 `/dashboard/site-intelligence/instant-audit`(登录后);审计核心 `CrawlerService.performFullAuditWithProgress`(爬取 + 规则,免费)。登录后的审计路由额外调 `getSemanticGap`(LLM,付费)。
- 首页 `[locale]/(public)/page.tsx`:Hero(`HomePageCTA` 捕获域名)→ 三支柱 → 三步流程(第 2 步=注册)→ 定价 → 博客 → 咨询。文案在 `messages.home`。
- 首页 hero 现在把域名带进登录(`HomePageCTA`)。
- 已装营销技能(copywriting/cro/ai-seo/marketing-psychology/lead-magnets)+ `.agents/product-marketing.md`。
- 成本已查证:爬+规则≈$0;LLM/DataForSEO 才是钱。

## Goals / Non-Goals

**Goals:**
- 公共、无需登录的免费审计,当场给真实诊断(≈$0 边际成本)。
- 转化前给价值,注册闸落在"行动"。
- 首页:秒懂、AI 搜索楔子、证据、品类教育、单一 CTA、诚实、双语。

**Non-Goals:**
- 不在公共审计里跑 LLM/DataForSEO(语义缺口/DNA/竞品/生成都留登录后)。
- 不做邮箱留资门、个性化 hero、动态社会证明(deferred)。
- 不引入调度器/订阅闸(订阅另排)。
- 不改深度 instant-audit(登录版)。

## Decisions

1. **公共审计端点**:`POST /api/public-audit`(或 `(public)` 分组),入参 domain。内部:
   - `CrawlerService.normalizeDomain` + `performFullAuditWithProgress`(或其非流式等价),**只跑爬取+规则**(SEO 技术/on-page + GEO 就绪:robots/AI 爬虫可达、llms.txt、结构、schema 存在性、sitemap、4xx/5xx)。
   - 可选并入 **Google PSI API**(免费配额,env key)取性能/核心指标;无 key 则跳过。
   - **不写 DB / 不需 session**(纯只读诊断);结果直接返回。
   - 防滥用:IP 限流(复用现有 rateLimit 思路)+ 按域名内存/边缘缓存(短 TTL)+ 爬取页数上限。
2. **公共结果页**:`[locale]/(public)/audit`(输域名→进度→评分+问题清单+"AI 引擎能否读到您"GEO 信号)。每个问题旁是**注册才能行动**的 CTA("注册以修复/生成内容/追踪")。诊断本身全公开(决策:慷慨给诊断换信任)。
3. **首页重排(信息架构)**——文案用 copywriting/cro 技能产出,结构:
   ```
   ① Hero(AI 搜索楔子 + 结果 + 免费无墙审计 CTA)
   ② 审计样张/即时证明(展示"您会看到什么")
   ③ 痛点共鸣(AI 读不到您 / 竞品被引用 / 内容排不上)
   ④ 新方法 = SEO + GEO(品类教育:Google 找到您 + AI 引用您)
   ⑤ 怎么做 3 步(审计→补齐→用 GSC 真实数据验证;【无"先注册"步】)
   ⑥ 凭什么信(对比:只做 SEO 的工具 vs SEO+GEO;出海双语优势;有证言再加)
   ⑦ FAQ(我已做 SEO 为何要 GEO?AI 内容会被罚吗?和 Ahrefs/Jasper 区别?)
   ⑧ 单一 CTA(免费审计;咨询作次级)
   ```
4. **诚实措辞**(硬约束):审计/衡量说"搜索排名与可见度"(GSC/SERP)+ "GEO 就绪 / 可被引用度"(内容结构);**不**说"追踪 AI 引用 / 实时监测 AI"。
5. **定价文案**:移除 "No expensive subscriptions / Credits Never Expire" 这类反订阅表述(为订阅转向让路;具体定价文案待订阅方案定,本期先中性化)。
6. **CTA 纪律**:全页主 CTA = 免费审计,第一人称("审计我的网站"),重复出现;咨询/定价为次级。

## Risks / Trade-offs

- **公共端点滥用**:必须限流 + 缓存 + 限深度,否则被刷爆(虽≈$0,但占带宽/CPU)。
- **审计深度 vs 成本**:公共版只给爬+规则(够制造问题意识);深度(缺口/竞品/DNA)留作"注册后"诱因——这正是转化设计,不是缺陷。
- **首页结构性改动**:section 增删 + messages 大改;需 design-checker + i18n-auditor 过。
- **诚实陷阱**:审计结果与 hero 措辞都不得过度宣称(延续 citation-honesty)。
- **失去"免费试写手"钩子**:geo-writer 不再公共(见 tools-placement)。靠"免费审计"做钩子替代——审计是更强的问题意识钩子,可接受。

## Implementation Notes (for Gemini / Antigravity)

**已知遗留冲突:**
- 登录后的审计路由会调 `getSemanticGap`(LLM)——公共版**绝不**调它,只用 `performFullAuditWithProgress` 的爬+规则。
- `HomePageCTA` 现在把域名带进登录;改为带进**公共审计**(无登录)。
- 文案诚实约束已在 `.agents/product-marketing.md` 写明,产出时严格遵守。

**禁止触碰范围:**
- 不改登录后 instant-audit 的深度逻辑、不引入订阅闸、不动模型路由/积分。
- 公共端点不写 DB、不需 session;不触碰 better-auth。

**本 change 边界(只允许改动):**
- 新增:`api/public-audit` 端点 + `[locale]/(public)/audit` 结果页 + 限流/缓存 util。
- 修改:`[locale]/(public)/page.tsx`、`HomePageCTA`、`messages/{en,zh}.json`(home + 新 audit/faq namespace,用「您」)。
- 复用:`CrawlerService`、(可选)Google PSI。

**其他注意事项:**
- 文案产出走 `copywriting`/`cro`/`marketing-psychology` 技能 + `.agents/product-marketing.md`;英文 voice 引 `rules/voice-en.md`。
- 公共页:i18n Link、error.tsx、generateMetadata(SEO 标题/描述用收益+关键词)。
- 改完 i18n-auditor + design-checker;`tsc` 保持仅 1 预存 auth.ts 错误。
- 验证:未登录可看完整诊断;行动才要注册;限流/缓存生效;en/zh 文案诚实、用「您」。
