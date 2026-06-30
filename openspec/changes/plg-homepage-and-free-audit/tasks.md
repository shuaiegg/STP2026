## 1. 公共免费审计端点

- [ ] 1.1 `POST /api/public-audit`:入参 domain → `CrawlerService.normalizeDomain` + 爬+规则审计(复用 `performFullAuditWithProgress` 的非 LLM 部分),**不调** getSemanticGap/DataForSEO,不写 DB、不需 session
- [ ] 1.2 (可选)并入 Google PSI(免费配额,env key;无 key 跳过)
- [ ] 1.3 防滥用:IP 限流 + 按域名缓存(短 TTL)+ 爬取页数上限

## 2. 公共审计结果页

- [ ] 2.1 `[locale]/(public)/audit`:输域名 → 进度 → 评分 + 问题清单 + GEO 就绪("AI 引擎能否读到您")
- [ ] 2.2 每个问题旁"注册以行动"CTA(修复/生成/追踪);诊断本身全公开
- [ ] 2.3 i18n Link、error.tsx、generateMetadata(收益+关键词)

## 3. 首页 PLG 重写(用 copywriting/cro/psychology 技能 + product-marketing 上下文)

- [ ] 3.1 Hero:AI 搜索楔子 + 结果导向 + 免费无墙审计 CTA(en/zh,用「您」)
- [ ] 3.2 重排 section:即时证明/审计样张 → 痛点 → SEO+GEO 品类教育 → 怎么做(去掉"先注册"步)→ 凭什么信(对比/双语)→ FAQ → 单一 CTA
- [ ] 3.3 `HomePageCTA` 域名 → 进**公共审计**(非登录)
- [ ] 3.4 移除反订阅定价文案(中性化)
- [ ] 3.5 全量文案进 `messages/{en,zh}.json`(home + audit + faq namespace),诚实措辞、用「您」

## 4. 诚实 & 合规

- [ ] 4.1 审计/首页措辞:"搜索排名与可见度" + "GEO 就绪/可被引用";不出现"AI 引用追踪/实时 AI 监测"
- [ ] 4.2 无虚构数据/证言

## 5. 验证

- [ ] 5.1 `npx tsc --noEmit` 仅剩 1 预存 auth.ts 错误,零新增
- [ ] 5.2 未登录可看完整诊断;行动才要注册
- [ ] 5.3 公共审计零 LLM/DataForSEO 调用;限流/缓存/深度上限生效
- [ ] 5.4 首页 5 秒可懂、单一 CTA、en/zh 文案诚实用「您」
- [ ] 5.5 i18n-auditor(首页/审计页)+ design-checker(首页/审计 UI)
- [ ] 5.6 更新 backlog:勾本期项;保留 deferred(邮箱留资门/个性化 hero/动态社证/真证言)
