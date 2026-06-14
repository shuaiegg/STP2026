# 激活漏斗 + 教练层 MVP — 任务清单

> 教练是编排层，复用现有器官。admin 中文 UI；用户侧双语。⚠️ schema 改动前先 pg_dump（生产库）。

---

## Sprint 1 — auth 前门 + 冷启动自动流（~3 天）

### 1.1 auth 前门
- [ ] 1.1.1 hero（HomePageCTA）提交域名时判断登录态：已登录 → 直接 `/dashboard/onboarding?domain=`；未登录 → `/register?domain=`
- [ ] 1.1.2 登录/注册页：邮箱验证码 与 账号密码登录并排（check-user 已有，整理入口）
- [ ] 1.1.3 验证码登录成功后新增"设置密码"可选步骤（可跳过）→ 设置后下次可密码直登
- [ ] 1.1.4 域名 token 穿过整个 auth（含 Google OAuth 回跳）不丢：sessionStorage + query 双通道，回跳后恢复
- [ ] 1.1.5 验证：已登录输域名不再被要求注册；验证码后设密码；OAuth 路径域名不丢

### 1.2 冷启动自动流
- [ ] 1.2.1 onboarding 编排：审计 → 提取本体 → 派生种子词 → SERP 推断竞品 → 语义缺口（串成一条自动流）
- [ ] 1.2.2 竞品推断：DataForSEO SERP top 域名，过滤自己/巨头/百科/市场；人在环确认候选
- [ ] 1.2.3 GSC 缺失优雅降级：无 GSC 时用本体 + 竞品给招，不空屏
- [ ] 1.2.4 验证：新站输域名后自动得到 本体 + ≥2 竞品 + 缺口

---

## Sprint 2 — 生命周期 + CoachMove + 规则引擎（~3-4 天）

### 2.1 Schema
- [ ] 2.1.1 `CoachMove` 模型（type/stage/status/evidence/payload/priority/autoExecutable）+ Site 关系；阶段跃迁记录（StageTransition 或复用事件表）
- [ ] 2.1.2 `npx prisma db push`（生产库，**已备份**）+ generate

### 2.2 生命周期判定
- [ ] 2.2.1 `detectStage(site)`：2D 矩阵（成熟度×数据可得），阈值放 config
- [ ] 2.2.2 阶段每次重算 + 存储跃迁事件（0→1 等）
- [ ] 2.2.3 GSC 缺失走独立分支（"unmeasured" 老站强推 GSC）

### 2.3 招式注册表 + 规则引擎
- [ ] 2.3.1 `MoveDefinition` 注册表：每 type 的 `detect/humanCTA`（`autoExecute` 留接口不实现）
- [ ] 2.3.2 实现 MVP 招式：connect_gsc/connect_ga4 · fix_tech · define_ontology · add_competitor · write_gap · internal_links（接现有器官深链）
- [ ] 2.3.3 规则引擎：跑 detect 选合格招 → 准备度门禁（地基 gate 增长）+ 性价比排序 → top 3
- [ ] 2.3.4 混合持久化：重算合格招 + 落地 move 实例保状态；触发失效的实例过期
- [ ] 2.3.5 evidence 用真实数字模板（AI 措辞推迟）；write_gap 引用/写入策略看板（不重复造待办）

---

## Sprint 3 — 增长主页 IA + 埋点 + 验收（~3 天）

### 3.1 增长主页
- [ ] 3.1.1 站点详情默认落地页改为增长主页：上下文条（阶段 + 诚实动量，无虚荣分）
- [ ] 3.1.2 首屏"本周 3 件事"CoachMove 卡片（图标 + 标题 + 数字理由 + 一键深链）
- [ ] 3.1.3 动量 Pulse 条（最近发布/追踪中/排名变化，只读）
- [ ] 3.1.4 8 tab 收成闭环 3 阶段：诊断/生产/衡量（+设置）
- [ ] 3.1.5 形态随阶段变：Stage 0 引导式建站清单；Stage 1/2 排序机会流
- [ ] 3.1.6 多站顶层：站点选择器 + 组合概览（每站阶段 + 待办数）
- [ ] 3.1.7 文案双语（messages dashboard.coach.*），过 check:cjk

### 3.2 激活埋点
- [ ] 3.2.1 6 事件：hero_domain_submitted → registered → audit_completed → first_coach_moment_viewed → first_action_started → first_action_completed
- [ ] 3.2.2 PostHog 漏斗 + time-to-first-action，按 locale 切分

### 3.3 验收（design「验收基准」全项）
- [ ] 3.3.1 已登录 hero 不再要注册；验证码后设密码；OAuth 域名不丢
- [ ] 3.3.2 新站 onboarding 自动出 本体+竞品+缺口；GSC 未连也有≥1 具体动作
- [ ] 3.3.3 增长主页：阶段 + 本周3招（数字理由+深链）+ 闭环3阶段；Stage 0 引导清单
- [ ] 3.3.4 CoachMove 落库/状态流转/失效过期；招式深链正常
- [ ] 3.3.5 阶段判定符合 2D 矩阵；0→1 跃迁有记录
- [ ] 3.3.6 激活漏斗按 locale 上报；admin 中文/用户双语；`tsc`+`build`+`check:cjk` 通过
- [ ] 3.3.7 输出给后续 change：GSC 白手套 / 周报邮件 / agent autoExecute / 真·GEO / 分发 / 向量
