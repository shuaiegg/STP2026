# 激活漏斗 + 教练层 MVP — 设计决策

## 决策 1：教练 = 规则做骨架，AI 做叙事（不要纯 AI）

```
规则引擎(确定)          AI(第二阶段,可选)
detect 哪些招合格   →   "为什么这对你的业务重要"的措辞 + 具体主题/标题
准备度门禁排序          (具体来自语义缺口/本体，非凭空)
```
- 纯 AI 选优先级 → 不确定、会乱排、动摇信任；纯规则 → 死板
- MVP：规则保证"选招+排序"正确一致；理由先用**带真实数字的模板**；AI 个性化措辞推迟
- 为什么：教练的可信度是续费理由，不能押在 LLM 随机性上

## 决策 2：准备度门禁排序（不是纯性价比）

```
地基层(gate)  连GSC/GA4 · 修技术 · 定本体 · 加竞品
增长层(被gate) 写缺口 · 抓临门一脚 · 救衰减 · 内链 · 分发
规则：地基有未完成 → 优先；地基齐 → 增长层按性价比排
```
地基没好就喊"写 10 篇"是沙上盖楼。门禁天然产生"进度感"（地基 3/4 → 解锁增长），比虚荣分健康。

## 决策 3：CoachMove 模型 + 招式注册表（agent 前身）

```prisma
model CoachMove {
  id           String   @id @default(uuid())
  siteId       String
  type         String   // connect_gsc|fix_tech|define_ontology|add_competitor
                        // |write_gap|refresh_decay|internal_links|consolidate|distribute|submit_index
  stage        String   // "0"|"1"|"2"|"2_scale"
  status       String   @default("suggested") // suggested|in_progress|done|dismissed|snoozed
  evidence     Json     // 为什么：真实数字 + 指向 audit/gap/gsc 记录的引用
  payload      Json     // 执行参数（write_gap: {keyword,title,competitorRefs}）
  priority     Int
  autoExecutable Boolean @default(false) // agent 化开关
  createdAt    DateTime @default(now())
  resolvedAt   DateTime?
  site         Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)
  @@index([siteId, status])
}
```

**招式注册表**（代码侧，每个 type 一组函数）：
```ts
interface MoveDefinition {
  type: string;
  stages: Stage[];
  detect(signals): { eligible: boolean; evidence?; payload?; priority? };
  humanCTA(payload): { label: string; href: string };   // 今天：人点深链
  autoExecute?(payload): Promise<void>;                  // 明天：agent 调（本期不实现）
}
```
- **今天**：教练跑 `detect` → 生成 move → 渲染 `humanCTA`
- **明天**：用户设自动化级别 → 高级别下 agent 调 `autoExecute`（同一 payload）
- 同一招式定义，推荐/自动共用 → 教练 MVP 自动是 agent 地基

**混合持久化**：信号每轮重算合格招式，落地为 move 实例保状态/历史；触发条件不再成立的旧实例**自动过期**（避免陈旧建议）。move 实例同时供：邮件摘要数据源、采纳率分析、未来 agent 执行日志。

## 决策 4：生命周期判定 = 2D 矩阵（成熟度 × 数据可得）

```
detectStage(site):
  hasGSC = GSC 已连接;  impr = 近30天展示;  pages = 最近审计 pageCount
  若 !hasGSC:
     pages < 30  → "0"        (新站冷启动；本体+竞品驱动)
     pages ≥ 30  → "unmeasured"(老站未被衡量；强推 GSC + 审计/竞品动作)
  若 hasGSC:
     impr < 100        → "0"
     100 ≤ impr < 5000 → "1"
     impr ≥ 5000       → "2"  (且 pages>300 → "2_scale"：批量诊断/去重/自残)
```
- 阈值放 **config**（真实数据会推翻拍脑袋值，MVP 给默认 + 可调）
- **GSC 缺失独立分支**，不是一律 Stage 0
- 每次重算；**存储阶段跃迁事件**（0→1）用于"🎉 进入成长期"庆祝 + 留存
- **任何格子都有招**（降级永不空屏）

## 决策 5：增长主页 IA — 教练在上、器官降级为闭环阶段

```
[domain]  阶段:成长期 · 本月发布3·收录2          ← 上下文条(诚实动量,无虚荣分)
─────────────────────────────────────────────
本周该做的 3 件事                  [全部动作→]    ← 主角(CoachMove卡:图标+标题+数字理由+CTA)
─────────────────────────────────────────────
动态 Pulse: 文章A已收录 · 排名↑3                 ← 动量条(只读,建信心)
─────────────────────────────────────────────
深入: 🔍诊断(审计/竞品/缺口) ✍️生产(看板/内容库) 📊衡量(GSC/GA4/追踪)  ← 8tab→闭环3阶段
```
- **8 个并列 tab → 闭环 3 阶段**：不只是收纳，是把导航变成"诊断→生产→衡量"的思维模型，强化闭环定位。设置单独放
- **形态随阶段变**：Stage 0 = 引导式建站清单（有顺序，配准备度门禁）；Stage 1/2 = 排序机会流
- 增长主页 = 站点详情**默认落地页**（非又一个 tab）
- 多站顶层 = 站点选择器 + 组合概览（每站阶段 + 待办数）

## 决策 6：冷启动 = 本体（懂你）+ 竞品推断（懂市场）

```
输域名 → 审计 → 提取本体(业务/受众/主题) → 派生种子词 → DataForSEO SERP
       → 候选竞品(排除自己/巨头/百科/市场) → 人在环确认 → 扫描 → 语义缺口
       → 教练第一刻("你是做X的+竞品在排Y你没有→写第一篇[一键]")
```
- 两条腿：本体回答"基于你是谁该写什么"，竞品回答"机会在哪"——都扎根真实网站
- **避坑**：SERP 可能返回巨头/百科 → 过滤；人在环确认候选竞品（轻交互 + 让用户觉得参与）
- GSC 缺失时这套照样跑（不依赖用户自有流量数据）

## 决策 7：教练 vs 策略看板 — 一个指挥，一个车间

- 教练 = 当下/本周"该做什么"的总指挥（跨技术/数据/内容/分发）
- 策略看板 = 内容生产流水线
- 教练的 `write_gap` 招式**引用**看板 top 项 / 写入看板，**不重复造"待办源"**

## 决策 8：啊哈时刻前置 + 激活可度量

- 啊哈 = 第一会话内一句**懂业务的洞察 + 一个一键动作**，不是"审计完成✅"
- 漏斗埋点：`hero_domain_submitted → registered → audit_completed → first_coach_moment_viewed → first_action_started → first_action_completed`
- 北极星：**time-to-first-action**（按 locale 切分）

## 验收基准
- 已登录用户在 hero 输域名 → 直接进 onboarding，不再被要求注册
- 未登录 → 验证码或密码登录；验证码后可设密码；域名穿过 auth（含 OAuth）不丢
- 新站 onboarding 自动产出本体 + 竞品 + 缺口；GSC 未连也能在增长主页看到≥1 个具体动作
- 增长主页：阶段标识 + 本周3招（每张带真实数字 + 一键深链）+ 闭环3阶段下钻；Stage 0 显示引导式清单
- CoachMove 落库、状态可流转、触发失效后过期；招式注册表 humanCTA 正常深链
- 阶段判定符合 2D 矩阵；0→1 跃迁有记录
- 激活漏斗 6 事件按 locale 上报；admin 中文、用户侧双语；`tsc`+`build`+`check:cjk` 通过
