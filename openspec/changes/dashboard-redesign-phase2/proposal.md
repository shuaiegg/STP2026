## Why

Dashboard 当前的 Sidebar 导航模式将「功能页面」作为一级入口，新用户进入后不知道从哪里开始，数据呈现缺乏视觉层次和引导性，用户激活率低。本阶段在 Phase 1 性能优化的基础上，将 dashboard 从「功能导航型」重构为「站点工作台型」，以站点为中心组织所有功能，并为新用户提供一键引导式上手流程。

## What Changes

- **新增新用户引导页** (`/dashboard/onboarding`)：URL 输入 → 即时分析 → 进入工作台，全程 2 步，无需注册即可感受核心价值；完成后展示「建议下一步」卡片（连接 GSC、GA4、添加竞品）
- **重设计站点工作台布局**（`/dashboard/site-intelligence/[siteId]`）：顶部 Header（站点名 + 健康评分 + 快捷操作）+ Tab 导航替代深度嵌套的 sidebar 模式，内容区按优先级纵向排布：关键词/流量 → 内容策略 → 待办事项 → 健康评分 → 审计摘要
- **自适应布局**：新用户（未连接 GSC/GA4）显示「解锁更多数据」引导卡替代空数据区域；老用户显示完整指标
- **重设计 `/dashboard` 主页**：有站点时自动跳转到站点工作台（1 个站点）或显示站点选择器（多个站点）；无站点时引导进入 onboarding
- **保留所有现有路由路径**：不变更 URL 结构，Phase 1 添加的所有 `loading.tsx` 文件路径继续有效

## Capabilities

### New Capabilities

- `dashboard-onboarding-flow`: 新用户引导流程，包括 URL 输入、即时审计触发、进入工作台后的「建议下一步」卡片展示
- `dashboard-site-workbench-layout`: 站点工作台的新布局架构，包括顶部 site header、Tab 导航模式、自适应内容区（新用户态 vs 老用户态）

### Modified Capabilities

- `dashboard-onboarding-checklist`: 扩展空状态逻辑，将「添加第一个站点」CTA 改为跳转至新 `/dashboard/onboarding` 页面，而非内联表单
- `global-dashboard-metrics`: 修改 `/dashboard` 主页路由逻辑，1 个站点时直接 redirect 到工作台，多站点时显示站点卡片选择器，替换原有通用大盘布局

## Impact

- **新增路由**：`/dashboard/onboarding`（新用户引导页，不需要已注册站点）
- **重构页面**：`/dashboard/site-intelligence/[siteId]/page.tsx` 布局层（Phase 1 已将其转为 Server Component，Phase 2 在此基础上重构 UI 结构）
- **调整页面**：`/dashboard/page.tsx`（主页重定向逻辑）
- **无路由删除**，无 API 变更，无数据库变更
- **影响 loading.tsx**：Phase 1 创建的所有 `loading.tsx` 路径不变，Phase 2 可能需要更新骨架形状以匹配新布局
