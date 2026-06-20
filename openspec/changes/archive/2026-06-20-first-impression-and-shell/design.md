# 首次印象与外壳重做 — 设计决策

## 决策 1：429 根因是限流过低 + 客户端重复订阅，双管齐下

```
现状                                      修复
─────────────────────────────────        ─────────────────────────────
rateLimit.max = 10/60s（全 /api/auth/*）   提高 max（建议 ~100/60s）
        +                                  + 对 get-session 单独放宽规则
多组件各自 authClient.useSession()    →    收敛为单一全局 session 订阅
触顶后客户端持续重试 → 雪崩 1330           （其余组件从 context 读，不再各自 fetch）
```
- better-auth 默认内存限流（多实例下按实例计）；MVP 先调 max + 自定义 `customRules` 给 `/get-session` 更高配额
- `cookieCache`（5min）已启用——保留；它降低**服务端 DB** 命中，但客户端 `useSession` 仍 HTTP 往返，所以**减少订阅数**是关键
- 验收：登录 + 正常浏览 10+ 页不再出现 429

## 决策 2：设密码 = 已认证 session 直接设，零二次验证码

```
排除：忘记/重置密码流 → 会发第二封邮件/OTP（违背"不要二次码"）
首选路径（按可行性降级）：
  A. auth.api 若存在可用的"已认证设密码"端点 → 用它（传 session headers）
  B. 否则：用 better-auth 的密码哈希（auth.$context.password.hash）
     直接写/更新 Account 表 credential 账户（providerId='credential'）
  C. 都不干净 → 砍掉设密码步，OTP-only（MVP 完全可接受）
```
- 上次 bug 正是调了**不存在**的 `auth.api.setPassword`（核心无此 API，只在插件）→ 本期先在运行时确认 A 是否可行，不可行直接走 B
- 设密码**永远可选可跳过**，绝不阻断进入 dashboard
- 用户已通过 OTP 认证 → 设密码本就不该再要任何码

## 决策 3：Google 登录——厘清与 GSC OAuth 的 client 关系

```
两套 Google OAuth 用途不同：
  better-auth 登录   → 回调 /api/auth/callback/google  （身份）
  GSC/GA4 数据授权   → 自定义 /api/auth/google-callback（数据 scope）
```
- 同一 `GOOGLE_CLIENT_ID` 可共用，但**两个回调 URI 都要在 Google Console 白名单**（用户已加登录回调）
- 本期核对：consent screen scopes、回调 URI、`baseURL`/`trustedOrigins` 与生产域一致
- 验收：新用户 Google 一键登录回跳成功、域名 token 不丢

## 决策 4：站点删除是 UI 可达性问题，不是数据问题

- DB 层 Site 所有关联均 `onDelete: Cascade`（已核实）——删除逻辑 [api/dashboard/sites/[siteId] DELETE] 正确
- 缺的是**入口**：新 GrowthHome（单站首屏）和多站 SiteSelector 都没有删除按钮（埋在站点详情 SiteSwitcher）
- 补：站点级菜单（设置/删除）放在首屏上下文条或站点列表卡，带确认弹窗（复用 DeleteSiteButton/AlertDialog）

## 决策 5：首屏 = onboarding 的"逐条点亮"本身，不是事后拼

```
现状：onboarding 转圈 → 跳 dashboard → 拼凑式洞察
改为：onboarding 流式逐条点亮，本身就是第一印象，然后落 GrowthHome 稳态

⠋ 正在读取 example.com…
  ✓ 你专注「{coreOffering}」，面向「{audience}」      ← ① DNA（快，~10-20s 等它）
  ✓ 扫描 {N} 个页面 · 技术健康分 {score}             ← ② 轻审计（中）
  ✓ 发现 {k} 个问题：缺 meta description…
  ⠋ 分析市场机会…（连接 GSC 解锁竞品对比）           ← ③ 慢，异步/引导
        [进入工作台 →]
```
- 复用现有：audit 路由已 SSE 式 emit（discovery/dna_extracted/competitors_inferred/done）；OnboardingClient 已消费——本期是把它**渲染成有分量的逐条揭示**，而非 loading 文案
- ①② 同步等待（10–20s，点亮掩盖），③ 可异步补 + 引导
- 稳态 GrowthHome 首屏复用本期产出的"被理解"卡 + 教练招式

## 决策 6：DNA 必须可信，否则降级"网站体检"——绝不显示错误理解

```
DNA 提取结果分级
─────────────────────────────────────────
成功且可信   → 展示"你专注 X，面向 Y"（最强被理解）
失败/空/低质 → 降级为"网站体检"（页数 + 健康分 + 问题清单）
              绝不显示驴唇不对马嘴的 "你是做 X 的"
```
- 全库曾 0 本体 = 提取链路从未验证可靠 → 本期含一项硬任务：实测 DNA 产出质量 + 落库验证 + 失败降级
- 降级文案仍专业（"我们扫描了你的网站，发现…"），只是不假装"懂业务"
- 错误的理解比空白更伤专业度——这是降级的第一原则

## 决策 7：侧边抽屉式 IA——把"诊断/生产/衡量"闭环升为主导航

```
现在（顶部）                     侧边抽屉（专业 SaaS）
┌────────────────────┐         ┌────┬──────────────────┐
│Logo 内容库 工具 积分│         │站点│ 增长主页          │
├────────────────────┤         │────│ ─────────────    │
│   [内容区]          │   →     │诊断│ [被理解卡]        │
└────────────────────┘         │生产│ [本周招式]        │
                               │衡量│ [动量 Pulse]      │
  导航 ≠ 闭环                   │────│                  │
                               │设置│ 语言切换 · 积分 · 头像
                               └────┴──────────────────┘
```
- 导航即产品定位：诊断（审计/竞品/缺口）· 生产（看板/内容库）· 衡量（GSC/GA4/追踪）
- 移动端抽屉折叠；桌面常驻
- auth 登录页一并视觉归一（移除 `shadow-[8px_8px_0_0_rgba(10,10,10,1)]` / `border-brutalist`，改 `brand-*` + `rounded-lg` + `hover:shadow-md`）

## 决策 8：双语切换器写回 User.locale，dashboard 即时重渲染

```
dashboard 语言来源链（不变）
  protected layout 读 session.user.locale → NextIntlClientProvider locale
切换器：
  authClient.updateUser({ locale }) → router.refresh() → 新 locale 重渲染
```
- 切换器放侧边栏底部 / 顶部用户区（SaaS 标配）
- dashboard/admin **仍非 locale 路由**（不进 [locale] 段）——切换靠 User.locale，符合硬约束
- 重写组件时同步抽 `messages/{en,zh}.json` 的 `dashboard.*` key；过 `check:cjk`
- admin 保持中文 UI（不双语化）

## 决策 9：审计揭示屏 = 用真实问题清单证明"我们看了你的站"，不给空泛数字

实测发现这屏只显示 `12 issues / 21 pages`（还溢出框），而**问题数据其实已存在**：
`audit-analyzer.ts` 产出结构化 `IssueItem { code, severity, title, explanation, howToFix }`
（约 14 种类型、双语、带受影响页面）。所以这是**呈现升级**，不是新分析。

```
现状（空泛 + 溢出）            应为（证据 + 可操作）
─────────────────            ──────────────────────
76/100                        发现 N 个问题拖累排名：
21 typical pages audited       🔴 8 页缺 meta description（含 /pricing）
12 optimization issues         🔴 H1 重复（3 页）
（数字折行、像代码块）          🟠 GEO：内容缺 AI 可引用结构
                              [查看全部 N 条]  ← 渐进展开
```
- **具体到页面 = 可信度**：用 `affectedUrls` 点名真实页面（"你的 /pricing 缺…"）
- **严重度驱动**：P0 红 / P1 橙 排前；颜色=严重度而非装饰
- **渐进展开**：默认 top 3–5，"查看全部"展开，不一次性堆砌也不藏在数字后
- **修溢出**：指标卡 token 化 + 正常字号/换行（不用等宽大字硬塞）

## 决策 10：揭示屏语言 = 用户 locale；空/缺 = 行动而非死胡同

- **语言**：洞察(DNA/问题/竞品)语言跟 `User.locale`，**不跟站点内容语言**。
  现状 bug：en 用户审自己的英文站，DNA 却出中文（prompt 本意 en 未生效，
  或 LLM 读站点内容默认了中文）→ 实现期需确保 locale 真正生效（含 LLM 不遵守时的兜底）。
- **诚实框定**：顶部标 "Preliminary scan · 已扫 21/N 页"，避免抓不全被当成站点全貌。
- **空态转行动**：竞品为空 → "添加竞品看缺口"输入框；无 GSC → "连接 GSC 看真实排名"。
  绝不留 "No competitors found" 这种死胡同。

## 决策 11：第一眼用一条叙事主线，GEO 作为差异化必须露出

```
懂你（DNA）→ 你的网站卡在哪（真问题）→ 机会（竞品/GSC）→ [解锁]
```
- 不是三个等价盒子，而是有"抓人开场句"的单一叙事
- **GEO 露出**：整屏目前全是 SEO 体检，一句 GEO 没有，而 GEO 是产品差异化武器。
  至少给一条 GEO-readiness 发现（内容是否具 AI 可引用结构）——具体查什么见下一轮探讨。
  注意：真·AI 引用测量仍推迟（当前 SERP 冒充），此处只查**内容结构的 GEO 就绪度**。

## 决策 12：揭示屏问题数据来源 = 既有 issueReport，无需新审计

- 复用 `AuditAnalyzer` 既有 `IssueItem[]`（code/severity/title/explanation/howToFix + 受影响页）
- 坏页面发现（§2.4 已落核心层）也并入此清单：HTTP 错误页作为一条 finding 展示
- 揭示屏 = 既有数据的更好呈现 + 一条新增 GEO-readiness 检查（轻量）

## 硬约束（违反会回归历史 500 / 静默 bug）
- `routing.ts` 保持 `localeCookie: false`
- root 布局的客户端组件**不得** `useLocale()`（SSR 抛错 → 全站 500）
- 前门修复（Sprint 1）优先于一切美化——429 正在生产发生
- 设密码零二次码、可选；DNA 失败必降级不空屏、不乱说

## 验收基准
- 登录 + 浏览 10+ 页无 429；新用户 Google 登录回跳成功
- 设密码（若保留）零二次验证码、可跳过；OTP 登录完整可用
- 站点可从首屏/列表删除（带确认）
- 新域名 onboarding 呈现逐条点亮：DNA → 健康分/问题 → 机会；DNA 失败时降级为网站体检而非空白/错误
- 侧边栏 IA：诊断/生产/衡量主导航；auth 页视觉归一无 brutalist 残留
- 右上角语言切换即时生效并写回 User.locale；admin 仍中文、用户侧双语
- `tsc` + `build` + `check:cjk` 通过；**新增：真机跑通 auth 流（OTP/Google/设密码）后才算完成**
