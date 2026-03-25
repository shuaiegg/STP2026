## 前置条件

Phase 1（`dashboard-perf-phase1`）已完成：所有路由有 `loading.tsx`，`[siteId]/page.tsx` 已是 Server Component + Suspense 结构，Tab 面板已动态导入。

---

## 1. Top Nav 组件（先做，影响所有页面）

- [x] 1.1 读取 `src/app/(protected)/layout.tsx` 和 `src/app/(protected)/DashboardShell.tsx` 了解 Sidebar 数据流（`initialSites`、`session`）
- [x] 1.2 创建 `src/components/dashboard/TopNav.tsx`（`'use client'`）：
  - 左区：Logo + 站点选择器（显示当前域名 + 下拉列表 + 「添加新站点」入口）
  - 中区：全局功能链接（内容库、工具箱、积分）
  - 右区：用户头像下拉（含：设置链接、退出登录按钮）
- [x] 1.3 实现 Top Nav 中的站点切换逻辑：点击下拉列表中的站点 -> `router.push('/dashboard/site-intelligence/[id]')`
- [x] 1.4 重构 `src/app/(protected)/DashboardShell.tsx`：
  - 移除 `aside` Sidebar
  - 在内容区上方插入 `<TopNav />`
  - 内容区改为全宽（移除左侧 margin/padding 偏移）

## 2. 骨架屏同步更新（Task 2）

- [x] 2.1 更新 `src/app/(protected)/loading.tsx`：去掉左侧 sidebar 骨架列，顶部改为 Top Nav 骨架（全宽单行，含左中右三区灰色占位块）
- [x] 2.2 更新 `src/app/(protected)/dashboard/loading.tsx`：骨架改为全宽布局，顶部 Top Nav 骨架 + 主内容区卡片网格骨架（3 列 × 2 行）
- [x] 2.3 更新 `src/app/(protected)/dashboard/site-intelligence/loading.tsx`：全宽，Top Nav 骨架 + 内容区
- [x] 2.4 更新 `src/app/(protected)/dashboard/site-intelligence/[siteId]/loading.tsx`：全宽，Top Nav 骨架 + SiteHeader 骨架（一行域名占位 + 徽章占位）+ Tab bar 骨架 + 面板骨架
- [x] 2.5 更新 `src/app/(protected)/dashboard/library/loading.tsx`：全宽，Top Nav 骨架 + 列表骨架
- [x] 2.6 更新 `src/app/(protected)/dashboard/billing/loading.tsx`：全宽，Top Nav 骨架 + 账单骨架
- [x] 2.7 更新 `src/app/(protected)/dashboard/tools/loading.tsx`：全宽，Top Nav 骨架 + 工具卡片骨架
- [x] 2.8 更新 `src/app/(protected)/dashboard/settings/loading.tsx`：全宽，Top Nav 骨架 + 表单骨架

## 3. UI 原子组件

- [x] 3.1 创建 `src/components/ui/HealthScoreBadge.tsx`：
  - 接收 `score: number | null`
  - 逻辑：`score >= 80` (绿色), `>= 60` (黄色), `< 60` (红色), `null` (灰色「未评分」)

## 4. `/dashboard` 首页智能分流（Task 4）

- [x] 4.1 读取 `src/app/(protected)/dashboard/page.tsx` 现有逻辑
- [x] 4.2 在 `getUserData` 中补充查询用户站点列表（`id` + `domain` + 最新审计分数）
- [x] 4.3 修改 `UserDashboard` 组件逻辑：
  - `totalSites === 0` -> `redirect('/dashboard/onboarding')`
  - `totalSites === 1` -> `redirect('/dashboard/site-intelligence/${sites[0].id}')`
  - `totalSites > 1` -> 渲染 `<SiteSelector sites={sites} />`
- [x] 4.4 创建 `src/app/(protected)/dashboard/SiteSelector.tsx`：大卡片网格显示站点，含健康分徽章，末尾有一个「添加新站点」虚线卡片

## 5. 新用户引导页 `/dashboard/onboarding`（Task 5）

- [x] 5.1 创建目录 `src/app/(protected)/dashboard/onboarding/`
- [x] 5.2 创建 `page.tsx`：Server Component，校验若用户已有站点则重定向回 `/dashboard`
- [x] 5.3 创建 `OnboardingClient.tsx`（`'use client'`）：
  - 状态：**IDLE** (输入框 + 品牌 Slogan) -> **ANALYZING** (进度条) -> **DONE** (跳转)
  - 交互：输入 URL -> 点击「立即分析」
  - 接入 instant-audit SSE 流，显示动态进度条 + 当前步骤文字
  - 分析完成后，自动调用保存接口，获取 `siteId` 后跳转 `router.push('/dashboard/site-intelligence/[siteId]?onboarded=1')`
- [x] 5.4 确保 `instant-audit` API 逻辑支持新站点自动注册（若不存在则创建）
- [x] 5.5 创建 `loading.tsx`：居中的输入框形状骨架
- [x] 5.6 创建 `error.tsx`：显示分析失败提示及重试按钮

## 6. 「建议下一步」横幅

- [x] 6.1 创建 `src/components/dashboard/NextStepsBanner.tsx`（`'use client'`）：
  - 读取 `localStorage` 确认是否已手动关闭
  - 显示三个引导卡片：连接 GSC、连接 GA4、添加竞争对手
  - 样式：顶部淡彩色背景，右侧有关闭按钮
- [x] 6.2 在 `src/app/(protected)/dashboard/site-intelligence/[siteId]/page.tsx` 顶部引入：
  - 仅当 URL 参数 `onboarded=1` 时默认显示（后续由用户手动关闭或配置完成后自动隐藏）

## 7. 站点工作台 Site Header

- [x] 7.1 创建 `src/components/dashboard/SiteHeader.tsx`：
  - 布局：左侧大号域名标题 + 健康分 Badge；右侧「运行新审计」按钮（黑色）+「查看星图」按钮（描边）
- [x] 7.2 更新 `src/app/(protected)/dashboard/site-intelligence/[siteId]/page.tsx`：
  - 移除原有的面包屑和零散标题
  - 插入 `<SiteHeader />`

## 8. Tab 导航改造

- [x] 8.1 读取 `src/app/(protected)/dashboard/site-intelligence/[siteId]/TabContainer.tsx`
- [x] 8.2 调整 Tab 顺序：概览 (Overview) -> 内容策略 (Strategy) -> 竞争分析 (Competitors) -> ...
- [x] 8.3 更新 Tab 样式：移除背景色块，改为底部横线（Active 态）
- [x] 8.4 移除 Tab Bar 右侧的「运行新审计」按钮（已移至 Site Header，或任选其一保留）

## 9. 概览 Tab 自适应内容卡片

- [x] 9.1 创建 `src/components/dashboard/IntegrationGuidanceCard.tsx`：虚线边框卡片，含锁图标、功能说明、CTA 按钮
- [x] 9.2 修改 `OverviewPanel` 数据层，补充传入 `hasGsc: boolean`、`hasGa4: boolean`、`hasContentPlan: boolean`
- [x] 9.3 在 `OverviewPanel` UI 中：
  - 关键词区域：若 `!hasGsc`，显示引导卡片指向「设置」Tab
  - 流量区域：若 `!hasGa4`，显示引导卡片指向「设置」Tab
  - 策略区域：若 `!hasContentPlan`，显示引导卡片指向「内容策略」Tab

## 10. 验收测试

- [x] 10.1 **首页重定向**：访问 `/dashboard`，0 站点用户自动进入 `/onboarding`，1 站点用户进入工作台
- [x] 10.2 **引导流**：在 onboarding 输入新域名，观察进度条从 0% 走完，并自动跳转至工作台且带 `?onboarded=1`
- [x] 10.3 **横幅显示**：跳转后顶部出现「建议下一步」横幅
- [x] 10.4 **全宽验证**：进入工作台，确认内容区占满屏幕宽度，无 Sidebar 留白
- [x] 10.5 **Top Nav 切换**：在 Top Nav 点击站点列表，能正确在不同站点间切换，且各 Tab 面板内容同步刷新
- [x] 10.6 **骨架屏一致性**：快速切换站点，确认骨架屏形状与 Top Nav + Tab Bar 结构一致，无跳变
- [x] 10.7 **概览自适应**：未连接 GSC 的站点，概览关键词区域显示虚线引导卡而非空数据
- [x] 10.8 **Tab hash 路由**：手动在 URL 加 `#strategy` 后刷新，「内容策略」Tab 自动激活
- [x] 10.9 **横幅关闭持久化**：关闭「建议下一步」横幅后刷新，横幅不再出现
- [x] 10.10 运行 `npm run build` 确认无 TypeScript 编译错误
- [x] 10.11 运行 `npm run lint` 确认无新增 lint 错误
