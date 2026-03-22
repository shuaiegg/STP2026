## Why

Dashboard 后台（含 admin 管理页）存在两类互相叠加的用户体验问题：页面跳转时出现空白期、数据加载时无骨架占位。调查发现根本原因混合了前端渲染模式选择错误、API 调用冗余、以及缺失 Next.js loading 机制三个层面，而非单纯的网络或数据库问题。现在 admin 侧所有页面均缺少 `loading.tsx`，site-intelligence 详情页存在高代价 API 设计缺陷，急需系统性修复以确保用户和管理员的操作体验达到最佳实践标准。

## What Changes

### 1. 性能修复 — API 调用缺陷（Critical）
- **FIX** `site-intelligence/[siteId]/page.tsx`：将 `fetch('/api/dashboard/sites')` (获取所有站点) 改为 `fetch('/api/dashboard/sites/${siteId}')` (获取单个站点) — 此处存在 N 倍过度请求 bug
- **CONVERT** `site-intelligence/page.tsx`（列表页）：从 client component + localStorage 缓存改为 server component，直接 Prisma 查询，消除客户端瀑布
- **ADD** API 响应缓存头：对 `GET /api/dashboard/sites` 和 `GET /api/dashboard/sites/${siteId}` 添加 `Cache-Control: private, s-maxage=30, stale-while-revalidate=60`

### 2. 加载骨架 — Admin 页面（8 个页面全部缺失）
- **ADD** `dashboard/admin/loading.tsx` — 统计卡片 + 内容列表骨架
- **ADD** `dashboard/admin/content/loading.tsx` — 内容列表表格骨架
- **ADD** `dashboard/admin/content/[id]/loading.tsx` — 编辑器表单骨架
- **ADD** `dashboard/admin/sync/loading.tsx` — 同步状态骨架
- **ADD** `dashboard/admin/(admin-only)/users/loading.tsx` — 用户表格骨架
- **ADD** `dashboard/admin/(admin-only)/skills/loading.tsx` — 技能卡片骨架
- **ADD** `dashboard/admin/(admin-only)/credit-refund/loading.tsx` — 积分退款表单骨架
- **ADD** `dashboard/admin/(admin-only)/orders/loading.tsx` — 订单表格骨架

### 3. 加载骨架 — Dashboard Tab 面板内部（6 个组件）
- **ADD** `StrategyBoard.tsx` 内部骨架（默认首屏 Tab，优先级最高）
- **ADD** `OverviewPanel.tsx` 内部骨架（4 个并行 API fetch，加载期需占位）
- **ADD** `CompetitorsPanel.tsx` 内部骨架
- **ADD** `PerformanceDashboard.tsx` 内部骨架
- **ADD** `AuditHistoryPanel.tsx` 内部骨架
- **ADD** `IntegrationsPanel.tsx` 内部骨架

### 4. 加载骨架 — Instant Audit Suspense 回退
- **FIX** `instant-audit/page.tsx` Suspense fallback：将 `<div>加载中...</div>` 替换为与页面布局匹配的骨架

### 5. 骨架设计规范统一
- 所有新骨架 MUST 使用现有项目规范：`animate-pulse`、`bg-slate-100` / `bg-slate-200`、`rounded-xl` / `rounded-2xl`、不进行像素级还原但形状与实际布局对应

## Capabilities

### New Capabilities
- `admin-loading-skeletons`: 为 8 个 admin 页面提供标准骨架屏 loading.tsx

### Modified Capabilities
- `dashboard-loading-ui`: 扩展现有规范，覆盖 (1) admin 页面骨架要求，(2) Tab 面板级内部骨架要求，(3) Instant Audit Suspense fallback 要求

## Impact

**文件修改：**
- `src/app/(protected)/dashboard/site-intelligence/page.tsx` — 转换为 server component
- `src/app/(protected)/dashboard/site-intelligence/[siteId]/page.tsx` — 修复 API 调用 bug
- `src/app/(protected)/dashboard/site-intelligence/[siteId]/components/StrategyBoard.tsx` — 添加内部骨架
- `src/app/(protected)/dashboard/site-intelligence/[siteId]/components/OverviewPanel.tsx` — 添加内部骨架
- `src/app/(protected)/dashboard/site-intelligence/[siteId]/components/CompetitorsPanel.tsx` — 添加内部骨架
- `src/app/(protected)/dashboard/site-intelligence/[siteId]/components/PerformanceDashboard.tsx` — 添加内部骨架
- `src/app/(protected)/dashboard/site-intelligence/[siteId]/components/AuditHistoryPanel.tsx` — 添加内部骨架
- `src/app/(protected)/dashboard/site-intelligence/[siteId]/components/IntegrationsPanel.tsx` — 添加内部骨架
- `src/app/(protected)/dashboard/site-intelligence/instant-audit/page.tsx` — 修复 Suspense fallback
- `src/app/api/dashboard/sites/route.ts` — 添加缓存头
- `src/app/api/dashboard/sites/[siteId]/route.ts` — 添加缓存头

**文件新增：**
- `src/app/(protected)/dashboard/admin/loading.tsx`
- `src/app/(protected)/dashboard/admin/content/loading.tsx`
- `src/app/(protected)/dashboard/admin/content/[id]/loading.tsx`
- `src/app/(protected)/dashboard/admin/sync/loading.tsx`
- `src/app/(protected)/dashboard/admin/(admin-only)/users/loading.tsx`
- `src/app/(protected)/dashboard/admin/(admin-only)/skills/loading.tsx`
- `src/app/(protected)/dashboard/admin/(admin-only)/credit-refund/loading.tsx`
- `src/app/(protected)/dashboard/admin/(admin-only)/orders/loading.tsx`

**无 DB schema 变更、无破坏性 API 变更、无依赖项增减**
