## ADDED Requirements

### Requirement: Admin 所有页面提供 loading.tsx 骨架
Admin 后台每一个页面路由 SHALL 拥有对应的 `loading.tsx` 文件，在 Next.js App Router 路由跳转期间立即展示骨架占位，消除空白期。骨架 MUST 使用 `animate-pulse`、`bg-slate-100`/`bg-slate-200`、`rounded-xl`/`rounded-2xl` 风格，与现有 `dashboard/loading.tsx` 保持视觉一致。

#### Scenario: 管理员导航到 admin 主页
- **WHEN** 管理员点击导航进入 `/dashboard/admin`
- **THEN** 页面立即展示统计卡片骨架（4 个横向卡片 + 内容列表行），不出现空白

#### Scenario: 管理员导航到内容列表页
- **WHEN** 管理员访问 `/dashboard/admin/content`
- **THEN** 页面展示包含页头和多行内容条目的表格骨架

#### Scenario: 管理员导航到内容编辑页
- **WHEN** 管理员访问 `/dashboard/admin/content/[id]`
- **THEN** 页面展示包含标题输入框、摘要文本区、封面选择器的编辑器骨架

#### Scenario: 管理员导航到同步管理页
- **WHEN** 管理员访问 `/dashboard/admin/sync`
- **THEN** 页面展示包含状态卡片和操作按钮的轻量骨架

#### Scenario: 管理员导航到用户管理页
- **WHEN** 管理员访问 `/dashboard/admin/users`
- **THEN** 页面展示搜索栏 + 5 行用户列表行的表格骨架

#### Scenario: 管理员导航到技能配置页
- **WHEN** 管理员访问 `/dashboard/admin/skills`
- **THEN** 页面展示 3 列技能卡片网格骨架

#### Scenario: 管理员导航到积分退款页
- **WHEN** 管理员访问 `/dashboard/admin/credit-refund`
- **THEN** 页面展示搜索栏 + 用户结果区骨架

#### Scenario: 管理员导航到订单列表页
- **WHEN** 管理员访问 `/dashboard/admin/orders`
- **THEN** 页面展示过滤栏 + 5 行订单条目骨架

### Requirement: 骨架显示后无闪烁地被实际内容替换
Admin loading 骨架在页面数据加载完成后 SHALL 被实际内容替换，不出现二次闪烁或布局跳动。

#### Scenario: 骨架到内容的过渡
- **WHEN** admin 页面数据 fetch 完成
- **THEN** 骨架被实际内容替换，不出现空白中间状态
