# 激活漏斗 + 教练层 MVP — 提案

## Why

产品有完整的"器官"（审计、本体、竞品、语义缺口、geo-writer、GSC/GA4、引用追踪、策略看板），但**没有神经系统**——没有一个"现在该做什么、为什么"的引导层。验证首页→onboarding 时暴露的割裂感（登录后还让注册、onboarding 除审计外没指引、分析完不知道下一步、有审计但不显性告知行动）全是同一个根因：

> CLAUDE.md 定义的用户任务是 **"Show me what's happening AND what I should do about it"** —— 产品只做了前半句。

这导致两个问题：
1. **激活漏斗漏水**：PLG 的留存 = 用户多快摸到价值。`首页→onboarding→第一个行动` 是激活漏斗，但前门有摩擦（auth）、中段无指引（onboarding）、落点是一堆并列 tab（混乱）。
2. **价值一次性**：用户走完长链路才尝到甜头，且拿到的是"分析"不是"行动"。

本 change 把产品**从"工具集"重组为"会指路的增长伙伴"**：重做首次激活旅程 + 落地教练层 MVP。教练层是**编排层**，复用全部现有器官，不从零造功能。它也是未来"自主内容 agent"的前身（推荐在前、自动在后）。

## What Changes

**① auth 前门重排（激活漏斗前门）**
- hero 提交域名时**判断登录态**：已登录 → 直接进 onboarding（带域名）；未登录 → auth
- 未登录走邮箱验证码登录 **或** 账号密码登录（check-user 已有）
- 验证码登录后**新增"设置密码"可选步骤**（设了下次可直登，免每次收码）
- **域名 token 穿过整个 auth（含 OAuth 回跳）不丢**（sessionStorage + query 双通道）

**② 冷启动自动流（60 秒"懂你+懂市场"）**
- 用户输域名 → 审计 → 提取本体（懂你的业务）→ SERP 推断竞品（懂市场）→ 语义缺口 → 教练第一刻
- 竞品推断：本体派生种子词 → DataForSEO SERP → 排名域名（过滤巨头/百科/市场，人在环确认）
- **GSC 缺失优雅降级**：用本体 + 竞品照样给招，不空屏

**③ 增长主页 IA（解决"并列 tab 混乱"）**
- 站点详情/登录后**默认落地页** = 增长主页：上下文条（阶段 + 诚实动量，无虚荣分）+ 首屏"本周 3 件事"CoachMove 卡片（每张带真实数字理由 + 一键深链）+ 动量 Pulse 条
- **8 个并列 tab 收成闭环 3 阶段**：诊断（审计/竞品/缺口）· 生产（策略看板/内容库）· 衡量（GSC/GA4/引用追踪）
- 主页形态随阶段变：Stage 0 = 引导式建站清单；Stage 1/2 = 排序机会流

**④ 生命周期判定**
- 2D 矩阵：成熟度 × 数据可得（GSC 缺失为独立分支）；阈值可调放配置
- 阶段每次重算（便宜）；**存储阶段跃迁事件**（0→1）用于庆祝/留存

**⑤ CoachMove 数据模型 + 招式注册表**
- `CoachMove`：type/stage/status/evidence/payload/priority/autoExecutable
- 注册表：每个 type 注册 `detect / humanCTA / autoExecute?` → **推荐在前、自动在后，通向自主 agent**
- 混合持久化：信号重算合格招式 + 落地 move 实例保状态/历史

**⑥ 规则引擎 + 准备度门禁排序**
- 规则选招（confidence 高、可解释、便宜）+ **准备度门禁**（地基 gate 增长：GSC/本体没好不喊"写 10 篇"）+ 性价比排序
- AI 个性化措辞 = 第二阶段（MVP 用带真实数字的模板理由）

**⑦ 激活埋点**
- `hero_domain_submitted → registered → audit_completed → first_coach_moment_viewed → first_action_started → first_action_completed`
- 北极星 = **time-to-first-action**，按 locale 切分（复用 PostHog locale 属性）

## Capabilities

### 新增
- `auth-funnel`: 登录态感知 hero + 验证码/密码登录 + 设密码步骤 + 域名透传守卫
- `cold-start-intel`: 本体 + 竞品推断（SERP）驱动的冷启动，GSC 缺失降级
- `growth-home`: 教练优先的站点主页 IA（本周3招 + 动量 + 闭环3阶段下钻），阶段自适应形态
- `lifecycle-detection`: 2D 阶段判定 + 跃迁事件
- `coach-move`: CoachMove 模型 + 招式注册表（detect/humanCTA/autoExecute）
- `coach-rules-engine`: 规则选招 + 准备度门禁 + 性价比排序
- `activation-analytics`: 激活漏斗事件 + time-to-first-action

### 修改
- `src/app/[locale]/(public)/HomePageCTA.tsx`: hero 登录态判断分支
- `src/app/[locale]/(public)/login|register/page.tsx`: 设密码步骤 + 域名透传
- `src/app/(protected)/dashboard/site-intelligence/[siteId]/`: 默认页改增长主页；TabContainer 8 tab → 闭环 3 阶段
- `prisma/schema.prisma`: 新增 `CoachMove`（+ 阶段跃迁记录）
- 竞品/本体/缺口服务：onboarding 自动编排调用
- geo-writer：作为 write_gap 招式的 humanCTA 深链（预填，已有）

### 不变
- 现有器官逻辑（审计/本体/竞品/缺口/geo-writer/GSC/追踪）——教练是编排层
- 策略看板作为内容生产流水线（教练**引用** top 项，不重复造"待办"）
- admin 中文 UI；用户侧双语
- markdown/Content 为内容真相源

## Non-Goals（后续独立 change）
- GSC 白手套代接 + 自助文档
- 每周邮件摘要（教练动作推送，用 Resend）
- agent 自动执行（`autoExecute` 落地 + 自动化级别设置）
- **真·AI 引用测量**（替换当前 `citationSource='Google SERP'` 冒充 GEO 的实现）
- 内容分发层（WordPress/Shopify/Webflow 适配器）
- 向量/pgvector 站点画像与自相残杀检测（喂教练更好信号）
