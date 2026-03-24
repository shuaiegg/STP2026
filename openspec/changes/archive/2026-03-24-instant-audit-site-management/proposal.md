## Why

即时审计页（`/dashboard/site-intelligence/instant-audit`）在引入站点切换功能后存在两个 UX 缺陷：切换站点时星图（GalaxyMap）不更新，以及删除站点的入口位置反直觉且缺乏足够的误操作保护。这两个问题影响了高频操作路径的可靠性，需在进一步扩展该页面功能前修复。

## What Changes

- **修复星图未随站点切换更新的 bug**：切换 `activeSiteId` 时未清空 `activeAuditId`，导致新站点加载旧 audit 数据（或加载失败），星图不刷新
- **重定位删除按钮**：将「取消绑定站点」操作从下拉菜单头部移至每个站点条目的右侧（hover 显示），作用于该条目对应站点（无需先激活）
- **新增域名输入确认弹窗**：删除操作触发弹窗，要求用户手动输入目标域名后「确认删除」按钮才可用，防止误操作
- **删除任意站点**：`handleDeleteSite` 接受 `siteId` 参数，支持直接删除列表中任意站点；若被删站点为当前激活站点，自动切换至列表第一个

## Capabilities

### New Capabilities

- `instant-audit-site-delete-confirm`: 域名输入确认删除弹窗交互——用户触发删除 → 弹窗展示目标域名 → 输入匹配后按钮激活 → 确认删除

### Modified Capabilities

- `instant-audit-persistence`: 切换站点时的 audit 数据加载逻辑变更——需在 `activeSiteId` 变化时先重置 `activeAuditId` 及相关展示状态，再触发新站点数据加载

## Impact

- **文件**：`src/app/(protected)/dashboard/site-intelligence/instant-audit/page.tsx`（唯一修改文件）
- **状态逻辑**：`useEffect` 依赖 `activeSiteId` 的加载分支；`handleDeleteSite` 签名变更
- **UI**：站点选择器下拉内每个条目新增 hover 删除图标；新增确认弹窗组件（内联）
- **无 API / Schema 变更**：复用现有 `DELETE /api/dashboard/sites/[siteId]`
