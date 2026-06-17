# 首次印象与外壳重做 — 提案

## Why

教练层上线后，用户**首次进后台没有"被理解"的惊喜**——只有两张平淡的地基卡（确认本体 / 加竞品）、动量全 0。我们明明做了技术审计 + AI 业务分析，却没在第一面 show 出"我们懂你的业务 + 看到了你的网站问题"。

更严重的是，真机测试暴露了一批 **auth 前门 bug**，它们正好砸在"第一印象"上——再惊艳的首屏，用户也到不了：

1. **生产 429 雪崩**：`rateLimit.max=10/分钟` 对每页都跑 `useSession` 的 SPA 太低，触顶后客户端持续重试 → get-session 被打到 1330 次全 429。
2. **设密码失败**：`auth.api.setPassword` 在核心 better-auth 不存在（只在 phone-number/admin 插件），运行时 `not a function`。
3. **Google 登录失败**：social provider 复用 GSC 的 `GOOGLE_CLIENT_ID`，redirect/consent 未跑通。
4. **站点无法删除**：DB 层 cascade 已齐，是新 GrowthHome 首屏**没有可达的删除入口**。

同时用户提出两个产品级诉求：**整体缺专业 SaaS 的信息架构**（应改侧边抽屉式导航）、**面向英文用户却无法切换 dashboard 语言**。

> 一句话：**门漏水（auth）、第一面不动人（首屏）、外壳不专业（IA + 双语）**。这三件事环环相扣，合并为一个 change 便于整体审核与排序。

## What Changes

按 4 个 Sprint 顺序推进（前门止血 → 首屏惊喜 → 专业外壳 → 双语收尾）：

**Sprint 1 · 前门止血（阻断级，最先）**
- `rateLimit` 调到合理值；收敛全局重复 `useSession` 订阅，降低 get-session 压力
- 设密码改为对**已认证 session 直接设密码**（零二次验证码、可选可跳过）；不走会要二次码的重置流；核心 API 不可行则直接写 credential 账户，再不行则砍掉（OTP-only 可接受）
- Google 登录跑通（确认 redirect URI / consent / 与 GSC OAuth 的 client_id 关系）
- 站点删除补可达入口（首屏 / 站点列表）

**Sprint 2 · 首屏"逐条点亮"被理解（核心哇塞）**
- onboarding → 增长主页首屏改为流式"AI 正在读懂你"逐条点亮：① 业务理解（DNA，快）② 轻量网站审计 / 健康分（中）③ 市场机会（竞品 / 缺口，慢 → 异步补 + 引导连 GSC 解锁）
- 愿意在 onboarding 花 10–20s 把 ①② 跑扎实（逐条点亮天然掩盖等待）
- DNA 提取**必须稳定 + 失败优雅降级成"网站体检"**，绝不显示驴唇不对马嘴的理解（比空白更伤专业度；注意全库曾 0 本体）

**Sprint 3 · 侧边栏 IA（专业 SaaS 骨架）**
- 顶部导航 → 侧边抽屉式；把"诊断 / 生产 / 衡量"闭环升为主导航（产品定位即信息架构）
- auth 登录页视觉归一（去掉残留 brutalist `shadow-[8px_8px_0_0]` / `border-brutalist`，拉回 `brand-*` 设计系统）
- 重写组件时同步抽双语 key（边做边双语，省一倍活）

**Sprint 4 · 双语收尾 + 切换器**
- 右上角语言切换器：即时切 + 写回 `User.locale`
- dashboard 剩余 UI 字符串双语化收尾

## Capabilities

### 新增
- `auth-frontdoor`: 限流合理化 + 设密码（零二次码、可选）+ Google 登录 + 站点删除入口
- `first-impression`: onboarding→首屏流式"逐条点亮"被理解，DNA 可靠性 + 失败降级
- `dashboard-shell`: 侧边抽屉式 IA（诊断/生产/衡量主导航）+ auth 页视觉归一
- `dashboard-i18n-switch`: 右上角语言切换器 + dashboard 字符串双语收尾

### 修改
- `src/lib/auth.ts`: rateLimit 值；socialProviders google 配置核对
- `src/app/actions/auth.ts`: setInitialPassword 改为可行的零二次码方案
- `src/app/[locale]/(public)/login/page.tsx`: 设密码步去伪存真 + 视觉归一
- `src/components/providers/PostHogAuthListener.tsx` / providers: 收敛 useSession 订阅
- `src/app/(protected)/dashboard/onboarding/OnboardingClient.tsx`: 流式逐条点亮
- `src/components/coach/GrowthHome.tsx` + `src/lib/coach/*`: 首屏被理解卡 / 降级
- `src/lib/skills/site-intelligence/crawler.service.ts`: DNA 提取稳定性 + 降级
- dashboard 外壳：DashboardShell / TopNav → 侧边导航；新增语言切换器
- `src/lib/auth.ts` user.locale 写回；messages/{en,zh}.json 双语 key

### 不变
- dashboard/admin **仍非 locale 路由**（语言跟 `User.locale` + `NextIntlClientProvider` 注入）
- `localeCookie: false`；root 客户端组件不得 `useLocale`
- admin 中文 UI；用户侧双语
- 教练层 registry/lifecycle/GrowthHome 的招式/阶段逻辑（仅首屏呈现增强）
- markdown/Content 为内容真相源

## Non-Goals（后续独立 change）
- 真·AI 引用测量（替换当前 SERP 冒充 GEO）
- agent autoExecute（自动执行招式）
- 内容分发层（WordPress/Shopify/Webflow）
- 向量 / pgvector 站点画像
- 公共页全静态化（需把 `<html>` 移出 root layout 的较大重构；当前缓存已够快）
