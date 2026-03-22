## 1. 性能修复 — Site Intelligence 详情页 API Bug

- [x] 1.1 读取 `src/app/api/dashboard/sites/[siteId]/route.ts`，确认其返回结构（domain, name, createdAt, latestAudit 等字段）
- [x] 1.2 对比 `page.tsx` 中使用的 `SiteRecord` 接口，列出字段差异
- [x] 1.3 在 `src/app/(protected)/dashboard/site-intelligence/[siteId]/page.tsx` 的 `useEffect` 中，将 `fetch('/api/dashboard/sites')` + `.find()` 替换为直接 `fetch(\`/api/dashboard/sites/${siteId}\`)`
- [x] 1.4 若 API 响应结构有字段缺失，在 `useEffect` 内做轻量适配映射（不修改 API 本身）
- [x] 1.5 验证：站点不存在时仍跳转 `/dashboard/site-intelligence`

## 2. 性能修复 — Site Intelligence 列表页转 Server Component

- [x] 2.1 读取完整的 `src/app/(protected)/dashboard/site-intelligence/page.tsx`，理解所有 client-side 逻辑
- [x] 2.2 将页面改为 async server component：移除 `'use client'`，用 `auth.api.getSession()` + Prisma 查询替换 `useEffect` + localStorage 逻辑
- [x] 2.3 处理三种状态：无站点（显示引导 UI）、单站点（server-side `redirect()`）、多站点（渲染列表）
- [x] 2.4 移除所有 `useState`、`useEffect`、`useRouter`、localStorage 相关代码
- [x] 2.5 保留 `TechScoreBadge` 和 `timeAgo` 工具函数（可内联到 server component）
- [x] 2.6 验证：多站点用户看到列表；单站点用户自动跳转；无站点用户看到引导

## 3. 性能修复 — API 缓存头

- [x] 3.1 在 `src/app/api/dashboard/sites/route.ts` 的 GET 响应中添加 `Cache-Control: private, max-age=0, s-maxage=30, stale-while-revalidate=60` header
- [x] 3.2 在 `src/app/api/dashboard/sites/[siteId]/route.ts` 的 GET 响应中添加相同 `Cache-Control` header
- [x] 3.3 确认两个 API 均为用户私有数据（`private` 指令正确，不会跨用户共享）

## 4. Admin Loading 骨架 — 新建 loading.tsx（8 个文件）

- [x] 4.1 读取 `src/app/(protected)/dashboard/admin/page.tsx` 顶层布局，新建 `src/app/(protected)/dashboard/admin/loading.tsx`（页头 + 4 个统计卡片 + 内容列表行，animate-pulse 风格）
- [x] 4.2 读取 `src/app/(protected)/dashboard/admin/content/page.tsx` 布局，新建 `loading.tsx`（页头 + 搜索/过滤栏 + 8 行内容条目骨架）
- [x] 4.3 读取 `src/app/(protected)/dashboard/admin/content/[id]/page.tsx` 布局，新建 `loading.tsx`（页头 + 标题输入框 + 摘要文本区 + 封面选择器骨架）
- [x] 4.4 读取 `src/app/(protected)/dashboard/admin/sync/page.tsx` 布局，新建 `loading.tsx`（页头 + 状态卡片 + 操作按钮骨架）
- [x] 4.5 读取 `src/app/(protected)/dashboard/admin/(admin-only)/users/page.tsx` 布局，新建 `loading.tsx`（搜索栏 + 表头 + 5 行用户行骨架）
- [x] 4.6 读取 `src/app/(protected)/dashboard/admin/(admin-only)/skills/page.tsx` 布局，新建 `loading.tsx`（页头 + 3 列技能卡片网格骨架）
- [x] 4.7 读取 `src/app/(protected)/dashboard/admin/(admin-only)/credit-refund/page.tsx` 布局，新建 `loading.tsx`（搜索栏 + 用户信息卡片 + 积分调整表单骨架）
- [x] 4.8 读取 `src/app/(protected)/dashboard/admin/(admin-only)/orders/page.tsx` 布局，新建 `loading.tsx`（过滤栏 + 5 行订单条目骨架）

## 5. Tab 面板内部骨架 — StrategyBoard（优先，默认 Tab）

- [x] 5.1 读取 `src/app/(protected)/dashboard/site-intelligence/[siteId]/components/StrategyBoard.tsx`，找到 `loading` state 的判断位置（`if (loading)`）
- [x] 5.2 在 `loading === true` 时返回 3 列看板骨架（每列含列标题占位 + 3 张卡片形状，animate-pulse 风格）
- [x] 5.3 验证：首次进入 site-intelligence/[siteId] 时 StrategyBoard 显示骨架后再显示真实内容

## 6. Tab 面板内部骨架 — OverviewPanel

- [x] 6.1 读取 `src/app/(protected)/dashboard/site-intelligence/[siteId]/components/OverviewPanel.tsx`，找到 `loading` 判断位置
- [x] 6.2 在 `loading === true` 时返回：顶部 4 个统计卡片骨架 + 进度/评分条骨架（反映页面实际结构）

## 7. Tab 面板内部骨架 — CompetitorsPanel

- [x] 7.1 读取 `CompetitorsPanel.tsx`，找到 loading state 逻辑
- [x] 7.2 在 `loading === true` 时返回 4 行竞争对手卡片占位骨架

## 8. Tab 面板内部骨架 — PerformanceDashboard

- [x] 8.1 读取 `PerformanceDashboard.tsx`，找到 loading state 逻辑
- [x] 8.2 在 `loading === true` 时返回关键词表格（表头 + 5 行）+ 折线图占位框骨架

## 9. Tab 面板内部骨架 — AuditHistoryPanel

- [x] 9.1 读取 `AuditHistoryPanel.tsx`，找到 loading state 逻辑
- [x] 9.2 在 `loading === true` 时返回审计历史时间线占位骨架（3 行日期 + 评分条）

## 10. Tab 面板内部骨架 — IntegrationsPanel

- [x] 10.1 读取 `IntegrationsPanel.tsx`，找到 loading state 逻辑（若有）
- [x] 10.2 在 `loading === true` 时返回 GSC + GA4 两个集成卡片骨架

## 11. Instant Audit Suspense Fallback 修复

- [x] 11.1 在 `src/app/(protected)/dashboard/site-intelligence/instant-audit/page.tsx` 中，将 Suspense `fallback` 替换为内联骨架：顶部 header 区（域名输入框 + 按钮形状） + 主内容区两栏（左侧大面积卡片 + 右侧小卡片堆叠），animate-pulse 风格

## 12. 验证

- [x] 12.1 在本地 dev 环境依次访问所有 8 个 admin 页面，确认每个页面导航时显示骨架而非空白
- [x] 12.2 访问 `/dashboard/site-intelligence/[siteId]`，确认 StrategyBoard 显示骨架（Network throttle 到 Slow 3G 验证）
- [x] 12.3 访问 `/dashboard/site-intelligence`（有多站点的账号），确认服务端直接渲染列表
- [x] 12.4 访问 `/dashboard/site-intelligence/instant-audit`，确认 Suspense fallback 显示骨架
- [x] 12.5 运行 `npm run build` 确认无 TypeScript 或构建错误
