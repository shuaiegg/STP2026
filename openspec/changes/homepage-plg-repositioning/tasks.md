# 首页 PLG 重定位 — 任务清单

> 前置依赖：`site-i18n-bilingual` Sprint 1 完成（`[locale]` 路由 + messages 基建可用）

---

## Sprint 1 — Voice 与文案 + 首页结构（~3 天）

> 目标：双语新首页上线（hero 暂为静态 CTA 占位），文案体系完整

### 1.1 英文 Voice 准则

- [x] 1.1.1 撰写 `rules/voice-en.md`（受众/语调/禁词表/标题规则/美式拼写，见 design 决策 4）
- [x] 1.1.2 在 CLAUDE.md「Design & Copy Rules」处登记该文件

### 1.2 双语文案

- [x] 1.2.1 中文首页文案新写（走 `scaletotop-copywriter` 规则），区块①-⑥ 全量进 `messages/zh.json` `home.*`
- [x] 1.2.2 英文首页文案原生撰写（走 `rules/voice-en.md`），进 `messages/en.json` `home.*`
- [x] 1.2.3 ②区块"产品实证"数字盘点：可用的真实数字（审计维度数/已分析页面数等真实数字）；无可用数字则砍掉该区块

### 1.3 首页结构实装

- [ ] 1.3.1 重构 `src/app/[locale]/(public)/page.tsx`：区块①-⑥，Server Component 优先，hero 本期为"输入框 UI + 提交跳 /register"最简版
- [ ] 1.3.2 能力三栏配真实产品截图（截图需中英 dashboard 通用，避免暴露中文界面给英文访客——优先选图表/报告类视觉）
- [ ] 1.3.3 咨询次要 CTA 区块（单行、安静），指向 `/consultation`
- [ ] 1.3.4 `generateMetadata` 双语（title/description/OG/canonical/hreflang 接 i18n 基建）
- [ ] 1.3.5 设计检查清单全项过一遍 + `/audit` ≥14/20 + `/polish` + `/web-design-guidelines`

---

## Sprint 2 — Hero 审计漏斗实装（~2-3 天）

> 目标：输入域名 → 注册 → 自动审计的完整动线

### 2.1 域名透传

- [x] 2.1.1 hero 提交 → `/register?domain=`，域名校验（格式/协议剥离）+ sessionStorage 双通道（OAuth 回跳不丢）
- [x] 2.1.2 注册页感知 domain 参数：展示"注册后立即体检 example.com"上下文条
- [x] 2.1.3 注册成功分支：带 domain → 直接触发 instant-audit 并跳转报告页；无 domain → 原 onboarding 流程不变

### 2.2 首审计体验

- [x] 2.2.1 审计运行页：进度反馈（复用现有 instant-audit UI），完成后报告页顶部加"下一步"引导卡（注册站点到 Site Intelligence / 试用 geo-writer）
- [x] 2.2.2 新用户免费积分足够覆盖首次审计的校验（不足则注册赠送逻辑兜底，确认 `registration-credit-bonus` 规格仍成立）

### 2.3 漏斗埋点

- [x] 2.3.1 `homepage_audit_submitted`（domain + locale）
- [x] 2.3.2 `register_completed` 加 `source: 'homepage_hero'` 属性
- [x] 2.3.3 `first_audit_completed` 事件；PostHog 建立三步漏斗看板（按 locale 切分）

### 2.4 定价 CTA 门控

- [x] 2.4.1 读取 `site-i18n-bilingual` 任务 3.3（Creem MoR）结论：英文⑤区块展示完整购买动线或仅"免费起步"
- [x] 2.4.2 中文⑤区块照常（积分简述 → /pricing）

### 2.5 总验收

- [x] 2.5.1 人工计时：hero 输入 → 报告可见 ≤ 90 秒（中英各跑一遍）
- [x] 2.5.2 OAuth 注册路径域名不丢失
- [x] 2.5.3 PostHog 漏斗数据正确（两种 locale 各一条测试记录）
- [x] 2.5.4 Lighthouse 首页 LCP 不劣于改版前基线（改版前先记录基线）
- [x] 2.5.5 messages 无未使用的旧首页 key 残留
