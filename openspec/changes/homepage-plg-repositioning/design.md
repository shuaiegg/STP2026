# 首页 PLG 重定位 — 设计决策

## 决策 1：执行顺序 — 在 site-i18n-bilingual Sprint 1 之后

首页新文案必须直接写进 messages 文件（双语原生撰写），所以本 change 依赖 i18n 路由与 messages 基建先就位。**绝不先翻译旧首页**——那是翻译即将扔掉的文案。

```
site-i18n-bilingual Sprint 1 (路由+messages)
        ↓
homepage-plg-repositioning Sprint 1 (voice + 文案 + 结构)
        ↓
homepage-plg-repositioning Sprint 2 (hero 漏斗实装)
        ↓（英文侧上线门槛）
dashboard-i18n Phase 1 完成 —— hero 动线的落点（注册→onboarding→审计报告）
在 dashboard 内，英文访客的第一个产品体验在登录墙后；dashboard 关键路径
未英文化前，英文 hero 漏斗不对外推（中文侧不受此门槛影响）
```

## 决策 2：审计钩子的门槛 — "输入后注册"，不做公开 lite 审计

| 方案 | 优点 | 缺点 |
|------|------|------|
| A. 公开无登录审计 | 转化摩擦最低 | 爬虫/滥用消耗审计资源；拿了报告就走，无账户沉淀 |
| **B. 输入 URL → 注册 → 自动跑审计（选定）** | 捕获意图+账户沉淀；审计成为注册奖励；复用现有 instant-audit | 多一步注册，部分流失 |

选 B 的核心理由：现阶段北极星不是流量是**激活**——hero 输入框已经完成了"意图捕获"，注册墙挡掉的恰好是无意图访客。域名透传让注册后的第一屏就是"你的网站正在体检"，aha moment 出现在注册后 60 秒内。

机制：
```
首页 hero 输入 example.com → /register?domain=example.com
  → 注册成功 → 跳过通用 onboarding，直接触发 instant-audit(domain)
  → 报告页 = 第一个 dashboard 体验（结果含"下一步"引导，衔接未来教练层）
```

域名参数经 sessionStorage + query 双通道透传（OAuth 回跳不丢失）。

## 决策 3：首页区块结构（en 与 zh 同构，文案各自原生）

```
① Hero: H1 价值主张 + URL 输入框 + 微文案（"60秒 · 免费 · 无需信用卡"）
② 社会证明替代区: 没有客户案例 → 用产品实证替代
   （审计维度数量 / 已分析页面数等真实数字，禁止编造）
③ 能力三栏: Site Intelligence(诊断) → geo-writer(生产) → 引用追踪(验证)
   每栏配真实产品截图，叙事 = "诊断→生产→验证"闭环
④ How it works: 3 步流程图（对应 hero 动线）
⑤ 定价引导: 积分制简述 + 免费起步 → /pricing
⑥ 咨询次要 CTA: 安静的单行区块（"需要人帮你做？"）→ /consultation
```

- 遵守 CLAUDE.md 设计检查清单全部条款（brand tokens、`font-display`、`py-16+`、COPY 抽取→本期直接进 messages、error.tsx、metadata）
- ②区块**用真实数据**，没有就砍掉该区块——设计原则"Data is the hero"，禁止假数字/假 logo 墙

## 决策 4：英文 voice — 独立准则，不是中文规则的翻译

落地 `rules/voice-en.md`，要点：

- 受众：英语市场的中小企业主/营销负责人（客户的客户视角）+ 顺路进来的英文自助用户
- 语调：direct, evidence-led, no hype——对标 Stripe/Linear 的文案密度，避免 AI 营销腔（"unleash" / "supercharge" / "game-changing" 列入禁词表）
- 标题规则与中文一致：benefit 先行，工具名后置
- 拼写：美式英语（目标市场以美国搜索量为主）
- 中文侧继续走 `scaletotop-copywriter` skill 规则（"你"不用"您"等）

## 决策 5：漏斗埋点（接 site-i18n-bilingual 的 locale 属性）

| 事件 | 触发点 |
|------|--------|
| `homepage_audit_submitted` | hero 输入框提交（带 domain、locale） |
| `register_completed`（已有则复用） | 注册成功（带 `source: 'homepage_hero'`） |
| `first_audit_completed` | 透传域名的首次审计完成 |

这条漏斗按 locale 切分后，就是"英文市场是否值得加注"的第一手数据。

## 决策 6：英文侧定价 CTA 受 Creem MoR 核实结果门控

`site-i18n-bilingual` 任务 3.3 的结论决定：
- Creem 是 MoR → 英文首页⑤区块带完整购买动线（USD）
- 不是 → 英文⑤区块只展示"免费起步"，隐藏购买按钮，中文侧不受影响

## 验收基准

- 中英文首页通过设计检查清单 + `/audit` 14/20 以上
- hero 动线全程 ≤ 90 秒：输入域名 → 注册 → 看到审计报告（人工计时验证）
- PostHog 漏斗三事件按 locale 正确上报
- 旧首页文案全部退役，messages 中无残留未用 key
- Lighthouse：首页 LCP 不劣于现状（hero 输入框为静态 SSR，无重 JS）
