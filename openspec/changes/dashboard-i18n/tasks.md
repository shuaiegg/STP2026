# Dashboard 英文化 — 任务清单

> 前置依赖：`site-i18n-bilingual` Sprint 1（next-intl 基建）+ Sprint 3 的 `User.locale` 字段（可提前到本 change 一并做）
> Phase 1 须与 `homepage-plg-repositioning` 同期完成（英文 hero 漏斗落点在 dashboard）

---

## Sprint 1 — Phase 1：英文漏斗关键路径（~4 天）

### 1.1 locale 供给

- [ ] 1.1.1 `(protected)/dashboard/layout.tsx` 注入 `NextIntlClientProvider`，locale 取 session 用户的 `User.locale`
- [ ] 1.1.2 messages 新增 `dashboard.*` 命名空间（体积大则拆 `messages/dashboard.{en,zh}.json` 按需加载）
- [ ] 1.1.3 settings 页语言切换控件 → 更新 `User.locale` → `router.refresh()` 即时生效

### 1.2 关键路径 UI 英文化

- [ ] 1.2.1 TopNav / 侧边导航 / 面包屑 / 通用空状态与 loading 文案
- [ ] 1.2.2 onboarding 流程全部屏
- [ ] 1.2.3 instant-audit 运行页 + 报告页（含图表轴标签、维度名、评级文案）
- [ ] 1.2.4 site-intelligence 列表页 + `[siteId]` 详情核心视图（概览/审计 tab）
- [ ] 1.2.5 涉及的共享组件文案迁移（注意 admin/public 复用侧回归）

### 1.3 AI 输出英文化（关键路径）

- [ ] 1.3.1 `base-skill.ts` / `types.ts`：执行上下文增加 `outputLocale`（默认取 `User.locale`）
- [ ] 1.3.2 审计分析输出"静态标签 key 化"：analyzer 输出稳定 key，前端经 messages 渲染（历史报告自动兼容）
- [ ] 1.3.3 instant-audit / 站点审计的 AI 生成文本（摘要/建议）prompt 按 `outputLocale` 输出
- [ ] 1.3.4 用 content-scorecard 语言质量维度抽查 2-3 份英文报告

### 1.4 Phase 1 验收

- [ ] 1.4.1 英文新用户 hero → 注册 → onboarding → 审计报告全程无中文（截屏走查）
- [ ] 1.4.2 中文用户同路径全流程无回归
- [ ] 1.4.3 settings 切换语言即时生效

---

## Sprint 2 — Phase 2：全量补完（~3 天，可由首批 en 用户数据触发）

### 2.1 其余页面 UI

- [ ] 2.1.1 library（列表 + 编辑页）
- [ ] 2.1.2 tools 列表页 + geo-writer 界面文案（产出语言逻辑不动）
- [ ] 2.1.3 billing（积分/订单/购买流程文案）+ settings 全量
- [ ] 2.1.4 site-intelligence 其余 tab（竞品/策略看板/语义分析视图）

### 2.2 其余 AI 输出

- [ ] 2.2.1 策略看板生成（ContentPlan/PlannedArticle 产出）接 `outputLocale`
- [ ] 2.2.2 语义分析 / 市场差距分析输出接 `outputLocale`

### 2.3 防回归门禁

- [ ] 2.3.1 `scripts/check-cjk.ts`：扫描用户侧 dashboard 目录 JSX 字符串字面量中的 CJK（排除 admin/注释/测试），接入 `npm run lint`
- [ ] 2.3.2 全量验收：en 账号遍历全部用户侧页面零中文；zh 账号零回归
