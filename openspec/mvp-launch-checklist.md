# MVP 上线走查清单

> 2026-06-27 起。来源:`/openspec:explore` 的 MVP 就绪度分析。这是**活清单**——上线前逐条过,勾完即 go。
> 骨架已 ~80% 就绪(获客/认证/onboarding/诊断/激活/生产/衡量/变现都在)。下面是"到可信 MVP"还差的。

## 🔴 阻塞项(不完成不上线)

- [ ] **DNA 提取质量** —— change `dna-extraction-quality`。脊柱:现在 onboarding 会把英文/双语站(含 scaletotop 自己)提取成错误 DNA(中文亚马逊),"懂你的业务"当场翻车。**头号阻塞**,先做。
- [ ] **引用追踪诚实化** —— change `citation-tracking-honesty`。移除"追踪 AI 引用/AI citation tracking/实时监测 AI 引擎"的虚假宣称(实为 Google SERP),改"搜索可见度/收录排名追踪"。便宜但必做(虚假宣传风险)。

## 🟡 市场质量(英文市场在 MVP 范围内则做)

- [ ] **geo-writer 全文件 i18n + token 归正** —— 公开双语工具页对 EN 用户显示中文(121 处 slate + 0 i18n)。见 backlog normalize 项。
- [ ] **onboarding DNA 确认一等步骤** —— 把"确认/修正业务基因"做成显眼 onboarding 步(激活总开关;依赖 DNA 提取修好)。见 backlog。
- [ ] **内容质量达标线** —— 抽样按 `rules/content-scorecard.md` 五维,确认生成内容达到"能直接发布"水准(P2 + DNA 质量驱动)。

## 🔍 上线走查(验证为主,非新建)

### 健壮性 / 边界
- [ ] 关键路由有 `error.tsx` 边界(生成/审计/支付/GSC 失败不白屏)
- [ ] 关键空状态友好(无站点/无内容/无 GSC 数据/薄站 DNA)
- [ ] LLM/外部 API 失败有兜底与用户可读提示(Gemini 429 兜底已做;其余 DataForSEO/GSC 抽查)

### 真机冒烟(CLAUDE.md 部署清单)
- [ ] Email OTP 登录 / Google OAuth 登录 / 设密码(新用户)
- [ ] Creem 支付 webhook → 自动加 credits + CreditTransaction
- [ ] GSC OAuth 回调 → 选 property → 自动 sync → 主页出数据
- [ ] 语言切换(User.locale)/ 站点删除 / 移动端抽屉
- [ ] 博客发布 → 公开页 ISR 渲染(`/` 与 `/zh/blog`)+ 图片走 MinIO

### 度量 / 经济性
- [ ] PostHog 激活漏斗 + D1/D7 retention 看板配好(P0 事件已埋)——上线后才看得到激活/留存
- [ ] credits 定价经济性核一遍(真实用量下 LLM 成本 vs 售价不亏)
- [ ] GTM(生产环境)/ PostHog key 配置确认

### 数据 / 部署安全
- [ ] 迁移走 `migrate dev`(勿 db push;漂移已基线化,保持纪律)
- [ ] VPS Postgres 自动备份(DB 是内容唯一副本,见 backlog ⚡ 项)——上线前强烈建议
- [ ] MinIO `media.scaletotop.com` 反代正常(图片不 504)

## ⏭️ 明确 Post-MVP(快随,不阻塞上线)

文章→URL 映射 + 逐文章衡量(A) · P3b 每周简报 · 业务类型轨 · 活的 DNA(GSC 回流) · P4 站点详情 IA 重构 · 真做 GEO 引用(接大模型) · 展示层翻译

---

## Go / No-Go

**最短可信 MVP 路径**:① `dna-extraction-quality` → ② `citation-tracking-honesty` → ③ 上线走查(健壮性 + 真机冒烟 + PostHog 看板 + 定价 + 备份)。英文市场在范围内则加 geo-writer i18n。

> 一句话:**MVP 不缺大功能,缺"脊柱正确 + 不虚假宣传 + 上线打磨"。**
