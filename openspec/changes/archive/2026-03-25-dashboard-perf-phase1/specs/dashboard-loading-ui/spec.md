## ADDED Requirements

### Requirement: Layout 通过 Server Component 传递初始 sites 数据
`(protected)` Layout 的 sites 列表数据 SHALL 由外层 Server Component wrapper 在服务端获取，并以 props 形式传入 Layout Client Component，不依赖 `useEffect` 客户端请求。

#### Scenario: 用户进入任意 dashboard 页面
- **WHEN** 用户访问任意 `/dashboard/*` 路由
- **THEN** 侧边栏的站点列表数据随 HTML 一同到达客户端，不发起额外的客户端 fetch 请求

#### Scenario: Server wrapper fetch 失败
- **WHEN** 服务端获取 sites 数据失败
- **THEN** Layout 以空 sites 列表渲染，侧边栏显示「添加网站」入口，不阻塞页面加载

### Requirement: 侧边栏导航链接在 hover 时预加载目标路由
侧边栏所有主要导航 `<Link>` 项 SHALL 在鼠标 `onMouseEnter` 时调用 `router.prefetch()`，确保在 sidebar 折叠或 Link 不在 viewport 时仍能触发预加载。

#### Scenario: 用户鼠标悬停导航项
- **WHEN** 用户将鼠标移入侧边栏某导航项
- **THEN** 浏览器开始预加载该路由的 JS 和数据，用户点击时感知延迟 < 100ms

#### Scenario: 用户快速点击未 hover 的导航项
- **WHEN** 用户直接点击未经 hover 的导航项
- **THEN** 正常触发路由导航，`loading.tsx` 立即显示，行为与原来一致

### Requirement: (protected) 路由根层级提供 loading.tsx
`src/app/(protected)/` 根路由段 SHALL 提供 `loading.tsx`，作为所有子路由的兜底骨架，在子路由未提供独立 `loading.tsx` 时生效。

#### Scenario: 访问未单独配置 loading.tsx 的子路由
- **WHEN** 用户导航到未配置独立 `loading.tsx` 的 dashboard 子路由
- **THEN** 显示根层级 `loading.tsx` 的通用骨架，不出现空白屏
