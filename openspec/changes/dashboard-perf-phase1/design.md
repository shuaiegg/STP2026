## Context

当前 dashboard 所有页面导航存在 1-3 秒白屏等待。根因分析：

1. **Layout 是 Client Component + useEffect fetch**：`src/app/(protected)/layout.tsx` 使用 `'use client'`，在 `useEffect` 里请求 sites 列表，每次页面挂载后才开始网络请求，形成 waterfall。
2. **无 `loading.tsx` 文件**：App Router 的即时骨架机制未被利用，导航时浏览器呈现空白。
3. **Site Intelligence `[siteId]` 是纯 Client Component**：页面 JS 水合完成后才触发 `useEffect` fetch，数据延迟叠加。
4. **8 个 Tab 面板全量打包**：StrategyBoard、OverviewPanel 等重型组件不论当前 Tab 是否激活都被打包进首屏 JS。

## Goals / Non-Goals

**Goals:**
- 所有 dashboard 路由导航时立即显示骨架，消除白屏
- Site Intelligence 详情页数据提前在服务端开始 fetch
- Tab 面板按需加载，减少首屏 JS bundle
- 侧边栏导航添加 prefetch，降低感知延迟
- Layout 的 sites 获取不阻塞页面渲染

**Non-Goals:**
- 不涉及 dashboard 视觉布局重设计（Phase 2 范围）
- 不修改任何 API 路由或数据库结构
- 不改变用户可见的功能行为

## Decisions

### 决策 1：Layout 的 sites 数据获取策略

**选择**：保留 Layout 为 Client Component（因其包含 sidebar 交互、session 管理、低积分 banner 等 hooks），但将 sites 列表的初始数据通过 Server Component 父级传入 props，而非在 Layout 内 useEffect 请求。

**具体做法**：在 `(protected)/layout.tsx` 的外层创建一个 Server Component wrapper，由它 fetch sites 数据并作为 props 传给 Layout Client Component。这样 sites 数据随 HTML 一起到达客户端，无需额外的客户端请求。

**放弃的方案**：将 Layout 完全改为 Server Component——不可行，因为 sidebar 的折叠状态、session 追踪、低积分 banner dismiss 等需要 useState/useEffect。

### 决策 2：Site Intelligence `[siteId]` 页面改造策略

**选择**：将页面改为 Server Component，在服务端 fetch 站点基础信息，Tab 内容区用 Suspense 包裹，各面板通过 `dynamic import` 懒加载。

```
Server Component (page.tsx)
  ├── 服务端 fetch: 站点基础信息
  ├── Header 区域（立即渲染）
  └── <TabContainer>（Client Component，管理 Tab 切换状态）
        └── <Suspense fallback={<PanelSkeleton />}>
              <DynamicPanel /> ← dynamic import，仅当 Tab 激活时加载
            </Suspense>
```

**放弃的方案**：完全重写为全 Server Component + RSC streaming——风险过高，Tab 切换需要客户端状态，强行 RSC 化会引入复杂的 URL 参数管理。

### 决策 3：`loading.tsx` 骨架实现策略

**选择**：每个路由段添加独立的 `loading.tsx`，骨架使用 `animate-pulse` + `bg-slate-100/200`，形状与页面实际布局大致对应（非像素级还原）。复用一套公共骨架原语（`SkeletonBlock`、`SkeletonCard`）减少重复代码。

**骨架风格约束**：
- 使用 `bg-slate-100 animate-pulse rounded-lg` 为基准
- 不使用品牌色作为骨架颜色
- 骨架高度与实际内容区域高度接近，避免内容加载后布局跳动

### 决策 4：Dynamic Import 的加载时机

**选择**：Tab 面板在用户**首次点击该 Tab 时**才加载（lazy + no SSR），而非页面加载时预加载所有面板。这在首屏性能和交互响应之间取得平衡。

```typescript
const StrategyBoard = dynamic(() => import('./panels/StrategyBoard'), {
  loading: () => <PanelSkeleton />,
  ssr: false,
})
```

**放弃的方案**：`ssr: true` 的 dynamic import——对于依赖浏览器 API 的重型面板（如图表库）会增加服务端渲染复杂度且收益有限。

### 决策 5：Navigation Prefetch 策略

**选择**：在 sidebar 的 `<Link>` 组件上保持 Next.js 默认的 `prefetch` 行为（viewport 可见时自动 prefetch），并对主要导航项在 `onMouseEnter` 时额外调用 `router.prefetch()`，覆盖 sidebar 折叠时 Link 不在 viewport 的场景。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| Layout 改造引入 props drilling，增加维护复杂度 | 限制传入 props 仅为 `initialSites`，其他状态保留在 Layout 内部 |
| dynamic import 首次点击 Tab 时有短暂加载 | 每个 Panel 提供 `loading` 骨架，用户感知为「加载中」而非白屏 |
| Server Component 改造后若 fetch 失败，整页报错 | 为每个路由段添加 `error.tsx` 边界，配合 `loading.tsx` |
| 骨架与实际内容高度不一致导致 CLS | 骨架区域设置与实际内容接近的固定高度，可接受轻微 CLS |

## Migration Plan

1. 先添加所有 `loading.tsx` 文件（最低风险，立即见效）
2. 再添加公共骨架组件 `SkeletonBlock` / `SkeletonCard`
3. 改造 Layout Server wrapper（影响全局，需仔细测试）
4. 改造 Site Intelligence `[siteId]` 页面（范围最大，最后进行）
5. 添加 dynamic imports
6. 添加 navigation prefetch

每步独立可回滚。无数据库变更，回滚只需 revert 代码。

## Open Questions

- Layout Server wrapper 的实现是否需要同时调整 better-auth 的 session 获取方式（目前在 Layout Client Component 里通过 `useSession`）？需要实现时确认 `auth()` server-side session API 是否可用。
