# 激活漏斗 + 教练层 MVP — 任务清单

> 教练是编排层，复用现有器官。admin 中文 UI；用户侧双语。
> 图例：`[x]` 代码完成且本地验证通过（tsc/build/check:cjk/单测/真实站点重算）。
> `[ ]` 需**部署后手动验证**或依赖外部配置 —— 见 [docs/activation-coach-manual-actions.md](../../../docs/activation-coach-manual-actions.md)。

---

## Sprint 1 — auth 前门 + 冷启动自动流

### 1.1 auth 前门
- [x] 1.1.1 hero 提交域名判断登录态：已登录 → onboarding；未登录 → `/login?domain=`
- [x] 1.1.2 统一登录页：邮箱验证码 与 账号密码 并排
- [x] 1.1.3 验证码登录后 "设置密码" 可选步骤（`setInitialPassword` 已修为传 headers 的正确签名）
- [x] 1.1.4 域名 token 穿过 auth（含 Google OAuth callbackURL）：sessionStorage + query 双通道
- [ ] 1.1.5 **部署后验证**：已登录输域名不再要求注册；验证码后设密码；OAuth 域名不丢

### 1.2 冷启动自动流
- [x] 1.2.1 onboarding 编排：审计 → 本体 → SERP 推断竞品 → 人在环确认 → save 后异步触发语义缺口
- [x] 1.2.2 竞品推断：DataForSEO SERP，过滤自己/巨头/百科；LLM 排序 top 3
- [x] 1.2.3 GSC 缺失优雅降级：用本体 + 竞品照样给招（lifecycle `unmeasured` 分支 + 招式 stage 覆盖）
- [ ] 1.2.4 **部署后验证**：新域名冷启动一条龙产出 本体 + 竞品 + 缺口

---

## Sprint 2 — 生命周期 + CoachMove + 规则引擎

### 2.1 Schema 落地 ✅（生产库已 apply，索引/无重复已核实）
- [x] 2.1.1 `CoachMove` 模型（type/stage/status/evidence/payload/priority/autoExecutable）
- [x] 2.1.2 `Competitor.reason` + `@@unique([siteId,domain])`；`db push` 已应用生产库
- [x] 2.1.3 `Site.onboardingStage`（"0" | "unmeasured" | "1" | "2" | "2_scale"）

### 2.2 生命周期引擎（2D 矩阵）
- [x] 2.2.1 `src/lib/coach/lifecycle.ts`：2D 矩阵（成熟度 × 数据可得），阈值放 `STAGE_THRESHOLDS`
- [x] 2.2.2 真实判定逻辑（替换原 publishedCount 拍脑袋版）：
    - `!hasGSC`：审计页数 <30 → "0"；≥30 → "unmeasured"
    - `hasGSC`：近30天展示 <100 → "0"；100–5000 → "1"；≥5000 → "2"（页数 >300 → "2_scale"）
- [x] 2.2.3 `syncSiteStage` 在 site save + 缺口分析后触发；**阶段跃迁记录为 stage_transition 事件**

### 2.3 招式注册表 + 规则引擎
- [x] 2.3.1 `src/lib/coach/registry.ts`：招式定义（detect/reason/humanCTA/deepLink）+ foundation 标记
- [x] 2.3.2 规则引擎：detect 选合格招 → **准备度门禁**（地基未完成压低增长层）→ 性价比排序 top 3
- [x] 2.3.3 **混合持久化**：`reconcileAndGetMoves` 落地 move 实例保状态 + 刷新真实数字 evidence + 触发失效自动过期；幂等（真实站点二次重算不重复创建）
- [x] 2.3.4 状态流转 server actions：`dismissCoachMove` / `startCoachMove` / `completeCoachMove`

---

## Sprint 3 — 增长主页 IA + 埋点 + 验收

### 3.1 增长主页（Growth Home）
- [x] 3.1.1 `/dashboard` 单站默认 = 增长主页：上下文条（阶段 + 诚实动量，无虚荣分）
- [x] 3.1.2 "本周招式" CoachMove 卡片：图标 + 标题 + **真实数字理由** + 一键深链 + 忽略
- [x] 3.1.3 动量 Pulse 条（本月发布 / 机会缺口 / 近30天展示；GSC 未连显式标注而非伪造）
- [x] 3.1.4 闭环 3 阶段下钻（诊断 / 生产 / 衡量）替代原装饰卡片
- [x] 3.1.5 形态随阶段变：Stage 0/unmeasured = 引导式编号清单；Stage 1/2 = 排序机会流
- [x] 3.1.6 多站 `/dashboard` 组合概览：每站阶段 chip + 待办数（SiteSelector）
- [x] 3.1.7 全部 token 化（brand-*）、rounded-lg、去除装饰背景/glassmorphism；文案双语过 check:cjk

### 3.2 激活埋点
- [x] 3.2.1 6 事件：`hero_domain_submitted → registered → audit_completed → first_coach_moment_viewed → first_action_started → first_action_completed`
- [x] 3.2.2 用户属性 identify：locale + credits；阶段随事件携带（onboarding_stage 为按站点维度，不做 person 属性）

### 3.3 交付验收
- [x] 3.3.1 `tsc` + `build` + `check:cjk` 全通过；阶段判定 2D 矩阵单测全过；真实站点端到端重算通过
- [x] 3.3.2 posthog server 去重（删 integrations/posthog 重复，统一 analytics/posthog-server，不再每次 shutdown）
- [ ] 3.3.3 **部署后验证**：增长主页阶段 + 本周招式 + Pulse + 闭环；招式深链切 tab 正常
- [ ] 3.3.4 **部署后验证**：忽略招式后不再出现；多站概览显示阶段 + 待办数
- [ ] 3.3.5 **外部配置**：Google OAuth 回调 URI 加入白名单（见手动事项文档第 2 节）
- [x] 3.3.6 输出给后续 change：GSC 白手套 / 周报邮件 / agent autoExecute / 真·GEO / 分发 / 向量

---

## 已知偏差 / 推迟（诚实记录）
- `autoExecute` 仅在数据模型留 `autoExecutable` 字段，本期不实现（通向 agent 的接口预留）。
- 真·AI 引用测量未做：现有 `citationSource='Google SERP'` 仍是 SERP 冒充 GEO，留待独立 change。
- onboarding_stage 未作为 PostHog person 属性（一个用户可多站、各站阶段不同），改为随事件携带。
