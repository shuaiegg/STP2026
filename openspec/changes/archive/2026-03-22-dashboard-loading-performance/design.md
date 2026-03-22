## Context

ScaletoTop dashboard 由两类路由组成：用户侧 `(protected)/dashboard/` 和管理员侧 `(protected)/dashboard/admin/`。两者均通过 Next.js App Router 的 `loading.tsx` 机制提供骨架屏，但 admin 侧 8 个页面完全缺失这一机制，导致导航时出现空白期。

性能调查发现最严重的瓶颈是 `site-intelligence/[siteId]/page.tsx`：该页面在初始化时调用 `GET /api/dashboard/sites`（返回所有站点列表）再从中筛选当前站点，而正确的 API 端点 `GET /api/dashboard/sites/${siteId}` 实际上已经存在。这是一个调用量 O(N) 而非 O(1) 的 bug，站点数越多越慢。

`site-intelligence/page.tsx`（列表页）是一个 client component，使用 localStorage 缓存，导致首次加载时出现客户端水合后才发起 fetch 的瀑布流（即使 loading.tsx 已存在，真实内容也要等客户端 JS 执行后才渲染）。

Tab 面板（StrategyBoard、OverviewPanel 等）各自独立发起 API fetch，且均无内部骨架，导致 tab 内容区域在数据到达前呈现空白或仅有 spinner 文字。

## Goals / Non-Goals

**Goals:**
- 消除 admin 所有页面导航时的空白期（loading.tsx）
- 修复 site-intelligence 详情页的 O(N) API 调用 bug，降低首屏等待
- 将 site-intelligence 列表页转为 server component，消除客户端水合瀑布
- 为 6 个 Tab 面板添加内部骨架，保持与现有 animate-pulse 风格一致
- 修复 instant-audit Suspense fallback 为真实骨架

**Non-Goals:**
- 不引入 React Query / SWR 等第三方数据管理库
- 不重构 Tab 面板为 server component（架构变动过大，风险高）
- 不修改 admin 页面的实际业务逻辑
- 不对 admin/setup 页面做任何修改（公开路由，不属于 dashboard 范畴）
- 不修改 DB schema 或 Prisma 模型

## Decisions

### D1: site-intelligence 列表页转 server component

**Decision**: 将 `site-intelligence/page.tsx` 改为 async server component，直接用 `auth.api.getSession()` + Prisma 查询站点列表，移除 localStorage 缓存和 client-side fetch。

**Rationale**: 列表页数据（站点列表）没有用户交互依赖，完全适合在服务端一次性获取。Server component 消除了客户端水合前的空白等待，配合已有的 `loading.tsx` 效果最佳。localStorage 缓存 5 分钟 TTL 与服务端渲染的实时性相比，反而会导致数据陈旧。

**Alternative considered**: 保留 client component 但用 `useSWR`。Rejected — 引入新依赖，且问题根源是渲染模式选择而非缓存策略。

**Redirect handling**: 若用户只有一个站点，server component 用 Next.js `redirect()` 直接跳转，与原有 client-side `router.push` 逻辑等价但无水合延迟。

---

### D2: site-intelligence/[siteId] 修复 API 调用

**Decision**: 将 `useEffect` 中的 `fetch('/api/dashboard/sites')` + filter 替换为 `fetch('/api/dashboard/sites/${siteId}')`。

**Rationale**: `GET /api/dashboard/sites/${siteId}` 已存在，只返回当前站点数据，无需加载所有站点。这是最小改动但收益最大的优化，不需要重构整个页面。

**Return shape**: 需要确认 `GET /api/dashboard/sites/${siteId}` 返回的字段与页面期望的 `SiteRecord` 接口匹配（domain, name, createdAt, latestAudit）。若字段有差异，在 `useEffect` 内做轻量映射。

---

### D3: Tab 面板内部骨架策略

**Decision**: 在各 panel 组件内部，基于已有的 `loading` state 显示骨架，而非新增外部 Suspense 边界。

**Rationale**: Tab 面板均为 client component，其 `loading` 状态已通过 `useState` 管理（如 `const [loading, setLoading] = useState(true)`）。直接在组件内 `if (loading) return <PanelSkeleton />` 是最小改动，且无需修改父组件。

**Skeleton 内容**: 每个面板骨架反映该面板的实际布局轮廓，不需像素级精确，使用 `animate-pulse` + `bg-slate-100/bg-slate-200` + `rounded-xl/rounded-2xl`，与现有项目骨架风格完全一致。

**StrategyBoard 优先级最高**: 它是默认 Tab（strategy），是用户进入详情页时首先看到的内容。

---

### D4: Admin loading.tsx 骨架粒度

**Decision**: 每个 admin 页面骨架按页面实际布局的「大轮廓」设计，不追求精确匹配内容，遵循现有 `dashboard/loading.tsx` 的风格。

骨架对应关系：
- `admin/loading.tsx` → 页头 + 4 个统计卡片 + 内容列表行
- `admin/content/loading.tsx` → 页头 + 过滤栏 + N 个文章行
- `admin/content/[id]/loading.tsx` → 页头 + 宽输入框 + 文本区域
- `admin/sync/loading.tsx` → 页头 + 状态卡片 + 按钮
- `admin/users/loading.tsx` → 搜索栏 + 表格行（头部 + 5 行数据）
- `admin/skills/loading.tsx` → 3 列卡片网格
- `admin/credit-refund/loading.tsx` → 搜索栏 + 结果区
- `admin/orders/loading.tsx` → 过滤栏 + 表格行

---

### D5: API 缓存头

**Decision**: 对 `GET /api/dashboard/sites` 和 `GET /api/dashboard/sites/${siteId}` 的 NextResponse 添加 `Cache-Control: private, max-age=0, s-maxage=30, stale-while-revalidate=60`。

**Rationale**: 这些端点数据变化频率低（只在用户主动触发 audit 或修改站点配置时变化），30 秒 CDN 缓存 + 60 秒 stale-while-revalidate 能显著降低重复请求。`private` 确保缓存不跨用户共享。

**Alternative considered**: 在 Next.js route handler 用 `revalidate` 时间。Rejected — route handler 的 `fetch` cache 不适用于数据库查询路径，响应头方式更可控。

---

### D6: Instant Audit Suspense Fallback

**Decision**: 将 `<Suspense fallback={<div className="p-6 text-slate-500 text-sm">加载中...</div>}>` 的 fallback 替换为一个内联的轻量骨架，模拟顶部 header 区域 + 主内容区两栏布局。

**Rationale**: 该 Suspense 仅在 `useSearchParams` 解析时短暂显示（< 200ms），但即便如此，文字 fallback 在骨架屏风格一致性上仍是异类。

## Risks / Trade-offs

**[Risk] site-intelligence 列表页 server component 转换可能丢失 client-side 交互** → 调查后，列表页除了 `router.push` 无其他 client-only 交互，`router.push` 可替换为 server-side `redirect()`（一个站点时）或静态 Link 渲染（多站点时）。

**[Risk] `GET /api/dashboard/sites/${siteId}` 返回字段与 SiteRecord 接口不完全匹配** → 实施前先对比接口，必要时做字段映射或扩展 API 响应，不改动 API 参数签名。

**[Risk] Tab 面板骨架的 loading 判断时机** → 若面板在 `loading=false` 之前已有部分数据渲染，骨架可能闪烁。缓解：仅在 `data === null` 时显示骨架，有数据（即使不完整）则直接渲染。

**[Risk] Admin loading.tsx 骨架与实际页面布局差异过大** → 骨架仅需传达「页面正在加载」的信号，不需精确还原，因此布局差异在可接受范围内。

## Migration Plan

1. **Admin loading.tsx（最低风险）** — 新文件，不修改任何现有代码，直接可部署
2. **Tab 面板内部骨架** — 在现有 `if (loading)` 分支增加返回内容，最小改动
3. **Instant Audit Suspense fallback** — 单行替换，无逻辑变化
4. **API 缓存头** — 在响应对象上添加 header，无逻辑变化，可即时回滚
5. **site-intelligence/[siteId] API bug fix** — 修改一行 fetch URL，低风险
6. **site-intelligence 列表页 server component 转换** — 最大改动，需在本地完整测试导航、自动跳转、空站点状态三种场景后上线

**Rollback**: 所有改动均为可逆操作，回滚仅需恢复对应文件的原始内容。

## Open Questions

- `GET /api/dashboard/sites/${siteId}` 当前返回的响应结构是什么？是否包含 `latestAudit`？（实施前检查）
- Admin layout 是否也有全局 `loading.tsx`？若有，admin 子页面的 `loading.tsx` 优先级更高，行为会覆盖父级。（确认现有 `admin/layout.tsx` 结构）
