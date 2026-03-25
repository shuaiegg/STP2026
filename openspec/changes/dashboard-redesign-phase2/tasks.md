## 前置条件

Phase 1（`dashboard-perf-phase1`）已完成：所有路由有 `loading.tsx`，`[siteId]/page.tsx` 已是 Server Component + Suspense 结构，Tab 面板已动态导入。

---

## 1. Top Nav 组件（先做，影响所有页面）

- [ ] 1.1 读取 `src/app/(protected)/layout.tsx` 和 `src/app/(protected)/DashboardShell.tsx`，理解现有 Sidebar 数据流（`initialSites`、`session` 等 props）
- [ ] 1.2 创建 `src/components/dashboard/TopNav.tsx`（`'use client'`）：
  - 接收 `sites: { id, domain, latestHealthScore }[]`、`currentSiteId?: string`、`user: { name, email, role }` props
  - **左区**：Logo（链接 `/dashboard`，使用现有 Logo 组件或 SVG）
  - **左中区**：站点切换器——`currentSiteId` 存在时显示当前域名 + `▾`；无站点时显示「添加你的网站」文字链接
  - **右中区**：全局功能链接（内容库 → `/dashboard/library`，工具箱 → `/dashboard/tools`，积分 → `/dashboard/billing`），激活路由对应链接高亮（`text-gray-900 font-medium`），非激活（`text-gray-500`）
  - **右区**：用户头像下拉（显示 `user.name` 首字母，下拉含：设置链接、退出登录按钮）
  - 高度固定 `h-14`，`border-b border-gray-200 bg-white`，`sticky top-0 z-40`
- [ ] 1.3 实现站点切换器下拉（`'use client'` state 控制开关）：
  - 列出所有站点（域名 + `<HealthScoreBadge />`），当前站点显示 `✓`
  - 点击站点执行 `router.push('/dashboard/site-intelligence/${siteId}')`
  - 列表底部固定「+ 添加新站点」入口，链接 `/dashboard/onboarding`
  - 点击下拉外区域关闭（`useEffect` + `document.addEventListener('click', ...)` 或 `Popover` 组件）
- [ ] 1.4 重构 `DashboardShell.tsx`：
  - 移除左侧 Sidebar 及其所有 JSX 和 import
  - 在内容区上方插入 `<TopNav />`，传入已有的 `initialSites`、`session` 数据
  - 内容区改为全宽：去掉 `flex` 布局中 sidebar 占位的 `w-64` 或等效宽度

## 2. 更新所有 loading.tsx 骨架（移除 sidebar 占位）

- [ ] 2.1 更新 `src/app/(protected)/loading.tsx`：去掉左侧 sidebar 骨架列，顶部改为 Top Nav 骨架（全宽单行，含左中右三区灰色占位块）
- [ ] 2.2 更新 `src/app/(protected)/dashboard/loading.tsx`：骨架改为全宽布局，顶部 Top Nav 骨架 + 主内容区卡片网格骨架（3 列 × 2 行）
- [ ] 2.3 更新 `src/app/(protected)/dashboard/site-intelligence/loading.tsx`：全宽，Top Nav 骨架 + 内容区
- [ ] 2.4 更新 `src/app/(protected)/dashboard/site-intelligence/[siteId]/loading.tsx`：全宽，Top Nav 骨架 + SiteHeader 骨架（一行域名占位 + 徽章占位）+ Tab bar 骨架 + 面板骨架
- [ ] 2.5 更新 `src/app/(protected)/dashboard/library/loading.tsx`：全宽，Top Nav 骨架 + 列表骨架
- [ ] 2.6 更新 `src/app/(protected)/dashboard/billing/loading.tsx`：全宽，Top Nav 骨架 + 账单骨架
- [ ] 2.7 更新 `src/app/(protected)/dashboard/tools/loading.tsx`：全宽，Top Nav 骨架 + 工具卡片骨架
- [ ] 2.8 更新 `src/app/(protected)/dashboard/settings/loading.tsx`：全宽，Top Nav 骨架 + 表单骨架

## 3. 健康评分徽章组件

- [ ] 3.1 创建 `src/components/ui/HealthScoreBadge.tsx`：
  - 接收 `score: number | null` prop
  - `score >= 80`：`bg-emerald-100 text-emerald-700`
  - `score 60–79`：`bg-amber-100 text-amber-700`
  - `score < 60`：`bg-red-100 text-red-600`
  - `score === null`：`bg-gray-100 text-gray-500`，文字「未评分」
  - 样式：`rounded-full px-2.5 py-0.5 text-sm font-medium`

## 4. `/dashboard` 主页智能路由重构

- [ ] 4.1 读取 `src/app/(protected)/dashboard/page.tsx`，理解现有 `getUserData` 数据获取逻辑
- [ ] 4.2 在 `getUserData` 中补充查询用户站点列表（`id` + `domain` + 最新审计分数），与现有 metrics 查询并行（`Promise.all`）
- [ ] 4.3 在 page.tsx 服务端逻辑中添加智能路由分支：
  - `totalSites === 0` → `redirect('/dashboard/onboarding')`
  - `totalSites === 1` → `redirect('/dashboard/site-intelligence/${sites[0].id}')`
  - `totalSites > 1` → 渲染 `<SiteSelector sites={sites} />`
- [ ] 4.4 创建 `src/app/(protected)/dashboard/SiteSelector.tsx` Client Component：
  - 接收 `sites: { id, domain, latestHealthScore, lastAuditAt }[]` prop
  - 渲染卡片网格（`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`）
  - 每卡片：域名、`<HealthScoreBadge />`、上次审计相对时间、「进入工作台」按钮

## 5. 新用户引导页 `/dashboard/onboarding`

- [ ] 5.1 创建路由目录 `src/app/(protected)/dashboard/onboarding/`
- [ ] 5.2 创建 `page.tsx`（Server Component）：
  - 若用户已有站点（`totalSites > 0`），服务端 redirect 到 `/dashboard`
  - 否则渲染 `<OnboardingClient />`
- [ ] 5.3 创建 `OnboardingClient.tsx`（`'use client'`）四阶段状态机：
  - **IDLE**：居中布局，欢迎标题 + 副标题，URL 输入框（`placeholder="example.com"`），「开始分析」主 CTA
  - **ANALYZING**：输入框禁用，接入 instant-audit SSE 流，显示动态进度条 + 当前步骤文字
  - **DONE**：SSE 返回 `done` + `siteId` 后，`router.push('/dashboard/site-intelligence/${siteId}?onboarded=1')`
  - **ERROR**：显示错误摘要 + 「重新分析」按钮（重置为 IDLE）
- [ ] 5.4 URL 格式 inline 校验：空值或不含 `.` 时输入框下方显示「请输入有效的网站域名」，阻止提交
- [ ] 5.5 创建 `loading.tsx`：居中两行骨架（输入框占位 + 按钮占位）
- [ ] 5.6 创建 `error.tsx`：通用错误边界

## 6. 「建议下一步」横幅

- [ ] 6.1 创建 `src/components/dashboard/NextStepsBanner.tsx`（`'use client'`）：
  - 接收 `siteId: string`、`hasGsc: boolean`、`hasGa4: boolean`、`hasCompetitors: boolean` props
  - mount 时读取 `localStorage.getItem('stp_next_steps_dismissed_${siteId}')`，存在则返回 `null`
  - 渲染三张引导卡（GSC、GA4、添加竞品）；已完成项显示绿色 `✓`，不显示 CTA
  - 右上角关闭按钮：写入 localStorage key 后隐藏横幅
- [ ] 6.2 在 `site-intelligence/[siteId]/page.tsx` 中：
  - 检测 `searchParams.onboarded === '1'`
  - 若存在，在概览 Tab 顶部渲染 `<NextStepsBanner />`

## 7. 站点工作台 Site Header

- [ ] 7.1 创建 `src/components/dashboard/SiteHeader.tsx`（Server Component）：
  - 接收 `site: { domain, latestAudit?: { overallScore } }` prop
  - 渲染：域名（`font-display text-xl font-semibold`）、`<HealthScoreBadge score={latestAudit?.overallScore ?? null} />`、「运行新审计」按钮
  - 若无审计记录，徽章旁追加「立即评分」文字链接
- [ ] 7.2 在 `[siteId]/page.tsx` 服务端数据获取中补充查询最新 `SiteAudit.overallScore`
- [ ] 7.3 将 `<SiteHeader />` 插入 `<TabContainer />` 上方，Tab 切换时 Header 保持可见

## 8. Tab 导航改造（hash 路由 + 激活样式）

- [ ] 8.1 读取现有 `TabContainer.tsx`，理解当前 Tab 状态管理
- [ ] 8.2 修改 Tab 切换：`router.replace(pathname + '#' + tabKey, { scroll: false })`；mount 时读 `window.location.hash` 初始化激活 Tab
- [ ] 8.3 激活样式：`border-b-2 border-[--color-brand-secondary] text-gray-900 font-medium`；非激活：`text-gray-500 hover:text-gray-700`
- [ ] 8.4 在 Tab bar 右侧固定「运行新审计」快捷按钮（与 SiteHeader 中的按钮共用逻辑，任选其一保留）

## 9. 概览 Tab 自适应内容卡片

- [ ] 9.1 创建 `src/components/dashboard/IntegrationGuidanceCard.tsx`（Server Component）：
  - 接收 `type: 'gsc' | 'ga4' | 'content-plan'`、`href: string` props
  - 渲染：`border-2 border-dashed border-gray-200 rounded-lg` 容器、锁图标、说明文字、CTA 按钮
- [ ] 9.2 修改 `OverviewPanel` 数据层，补充传入 `hasGsc: boolean`、`hasGa4: boolean`、`hasContentPlan: boolean`
- [ ] 9.3 在 OverviewPanel 渲染逻辑中：
  - 关键词区：`hasGsc ? <KeywordPerformanceCard /> : <IntegrationGuidanceCard type="gsc" />`
  - 流量区：`hasGa4 ? <TrafficTrendCard /> : <IntegrationGuidanceCard type="ga4" />`
  - 内容策略区：`hasContentPlan ? <ContentStrategyCard /> : <IntegrationGuidanceCard type="content-plan" />`
  - 健康评分卡和待办事项卡始终显示，不受影响

## 10. 验收测试

- [ ] 10.1 **Top Nav 全页面**：访问所有 dashboard 路由（/dashboard、/library、/tools、/billing、/settings、/site-intelligence/[siteId]），确认左侧无 Sidebar，顶部有 Top Nav
- [ ] 10.2 **站点切换器**：有 2+ 站点时，点击 Top Nav 站点切换器，下拉显示所有站点，点击切换正确跳转
- [ ] 10.3 **新用户流程**：新账号访问 `/dashboard` → 跳转 `/dashboard/onboarding` → 输入 URL → 分析完成 → 进入工作台 → 顶部显示「建议下一步」横幅
- [ ] 10.4 **单站点路由**：有 1 个站点的用户访问 `/dashboard` → 直接跳转工作台，无额外点击
- [ ] 10.5 **多站点选择器**：有 2+ 站点时访问 `/dashboard` → 渲染站点卡片网格
- [ ] 10.6 **Site Header**：站点工作台顶部显示域名 + 健康评分徽章，Tab 切换时 Header 不动
- [ ] 10.7 **自适应概览**：未连接 GSC 的站点，概览关键词区域显示虚线引导卡而非空数据
- [ ] 10.8 **Tab hash 路由**：手动在 URL 加 `#strategy` 后刷新，「内容策略」Tab 自动激活
- [ ] 10.9 **横幅关闭持久化**：关闭「建议下一步」横幅后刷新，横幅不再出现
- [ ] 10.10 运行 `npm run build` 确认无 TypeScript 编译错误
- [ ] 10.11 运行 `npm run lint` 确认无新增 lint 错误
