## Why

Dashboard 所有导航页面（包括 dev 和 production 环境）存在明显的白屏等待，根因是核心页面使用客户端 `useEffect` 发起数据请求、缺少 `loading.tsx` 骨架、重型子面板无代码分割，导致用户点击导航后需等待 1-3 秒才能看到任何内容，严重影响产品体验和用户留存。

## What Changes

- **为所有 `/dashboard` 路由段添加 `loading.tsx` 骨架**：用户导航时立即显示占位 UI，消除白屏等待
- **将 `site-intelligence/[siteId]` 从纯客户端组件改为 Server Component + Suspense 流式加载**：数据在服务端开始 fetch，不等待客户端 JS 水合
- **Site Intelligence 详情页 8 个 Tab 面板改用 `dynamic import` 懒加载**：首屏只加载当前 Tab，减少初始 JS bundle 体积
- **修复 Layout 的 `useEffect` 数据获取问题**：将 sites 列表请求移出 Client Component，避免每次导航触发网络请求
- **在侧边栏导航 Link 上添加 `router.prefetch()`**：鼠标 hover 时预加载目标路由，进一步降低感知延迟

## Capabilities

### New Capabilities

- `dashboard-code-splitting`: Site Intelligence 详情页 Tab 面板的动态导入和按需加载策略，避免将 8 个重型面板组件全部打包进首屏 JS

### Modified Capabilities

- `dashboard-loading-ui`: 补充 layout 层 useEffect 修复要求，以及导航 prefetch 要求；现有 loading.tsx 骨架和 Server Component 转换要求不变，本次变更将其实际落地实现

## Impact

- **影响文件**：
  - `src/app/(protected)/layout.tsx` — 修复 useEffect sites fetch
  - `src/app/(protected)/dashboard/site-intelligence/[siteId]/page.tsx` — Server Component 改造
  - `src/app/(protected)/dashboard/site-intelligence/[siteId]/` 下各 Tab 面板组件 — dynamic import
  - 所有 `/dashboard` 路由段新增 `loading.tsx`
- **无 API 变更**，无数据库变更，无破坏性改动
- **构建产物**：首屏 JS bundle 体积预计减少，Lighthouse Performance 分数预计提升
