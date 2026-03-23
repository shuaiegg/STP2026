## 1. Toast 基础设施修复

- [x] 1.1 在 `src/app/layout.tsx` 中 import `Toaster` from `sonner`，并在 `<body>` 底部挂载 `<Toaster position="top-right" richColors />`
- [x] 1.2 验证：进入 `/dashboard/settings` 修改密码，成功后应出现 toast 通知

## 2. 服务端数据层扩展

- [x] 2.1 在 `src/app/(protected)/dashboard/page.tsx` 的 `getUserData` 函数中，向 `Promise.all` 新增 `prisma.siteAudit.count({ where: { site: { userId } } })`
- [x] 2.2 将 `auditCount` 从 `getUserData` 返回值中解构，并作为 prop 传入 `<DashboardContent auditCount={auditCount} />`
- [x] 2.3 在 `DashboardContent` 的 props interface 中新增 `auditCount?: number`，默认值 `0`

## 3. EMPTY 态：欢迎空状态

- [x] 3.1 在 `DashboardContent.tsx` 顶部定义 `const COPY` 对象，包含所有欢迎空状态用户可见文案
- [x] 3.2 实现 `isNewUser` 判断逻辑：`const isNewUser = metrics.totalSites === 0`
- [x] 3.3 当 `isNewUser === true` 时，替换统计卡片区域与站点列表区域，渲染欢迎空状态 UI
- [x] 3.4 欢迎空状态包含：欢迎文案、品牌说明（1 句话）、主 CTA 按钮"添加第一个站点"（链接至 `/dashboard/site-intelligence`）、次要入口"免费即时审计"（链接至 `/dashboard/site-intelligence/instant-audit`）
- [x] 3.5 欢迎空状态使用 `bg-brand-secondary-muted` 背景卡片，CTA 使用 `bg-brand-secondary` 样式，所有圆角用 `rounded-lg`

## 4. SETUP 态：Checklist 横幅

- [x] 4.1 定义 Checklist 所需常量：步骤定义数组放入 `COPY` 对象（添加站点、运行审计、连接GSC[可选]、查看战略看板）
- [x] 4.2 实现 `useChecklistDismissed` 逻辑：在 `useEffect` 中读取 `localStorage.getItem('stp_checklist_dismissed')`，初始值 `false`
- [x] 4.3 实现 `isSetupState` 判断：`metrics.totalSites > 0 && (auditCount === 0 || !checklistDismissed)`
- [x] 4.4 实现 Checklist 自动隐藏条件：`metrics.totalSites > 0 && auditCount > 0 && metrics.totalPlannedArticles > 0`（满足则不显示，无论 localStorage）
- [x] 4.5 实现 Checklist 横幅组件，包含：步骤进度（X/N 完成）、每步的完成/未完成状态图标、各步骤对应的操作链接、右上角关闭按钮
- [x] 4.6 步骤完成状态判断：添加站点 = `totalSites > 0`；运行审计 = `auditCount > 0`；连接GSC = `gscCount > 0`（显示"可选"标记）；查看战略看板 = `totalPlannedArticles > 0`
- [x] 4.7 关闭按钮点击后：`localStorage.setItem('stp_checklist_dismissed', 'true')` + 更新 state 隐藏横幅
- [x] 4.8 Checklist 横幅样式：`border border-brand-secondary/20 bg-brand-secondary-muted rounded-lg p-4`，进度条/徽标使用 `bg-brand-secondary`

## 5. Design Compliance

- [x] 5.1 验证所有新增颜色使用 brand token 类（无硬编码 hex）
- [x] 5.2 验证所有用户可见文案在 `const COPY` 对象中
- [x] 5.3 验证所有交互元素圆角为 `rounded-lg`（非 `rounded-xl`，`rounded-xl` 仅用于 modal）
- [x] 5.4 验证无 `.border-brutalist`、`.brutalist-hover`、`.bg-gradient-brand`、`.text-gradient-brand` 类
- [x] 5.5 运行 `/web-design-guidelines` skill 检查修改的文件，修复所有报告问题
