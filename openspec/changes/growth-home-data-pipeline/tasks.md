## 1. GSC 自动首次同步（bug fix，可独立先发）

- [ ] 1.1 在 `gsc/properties/select` 路由保存 `propertyId` 成功后，fire-and-forget 触发一次 `gsc-sync`（不阻塞响应，失败入日志）
- [ ] 1.2 记录"property 选定时间"（用于主页 `syncing` 态判定）——复用 `GscConnection.updatedAt` 或新增字段，二选一在实现时定
- [ ] 1.3 验证：本地连 GSC + 选 property 后，无需进入任何 tab，`SiteKeywordSnapshot` 在数秒内开始回填

## 2. 主页数据层（home.ts）

- [ ] 2.1 `getGrowthHomeData` 增加 `syncing` 态判定：`hasGsc && 快照为空 && 距 property 选定较近`
- [ ] 2.2 `buildInsight` 增补"真实排名发现"洞察分支（最接近第一页的关键词），与现有 ontology/competitor/gap 洞察按可得性择优
- [ ] 2.3 主页展示数据复用 `gsc/performance` 或 `keyword-snapshots/trends` API，确认无需新建接口

## 3. 组件：PerformanceDashboard 精简版 + token 归正

- [ ] 3.1 从 `PerformanceDashboard` 抽出"摘要 + 趋势图"纯展示子组件（供主页精简卡与详情页完整版共用）
- [ ] 3.2 token 归正：将 `text-blue-600 / text-indigo-600 / text-emerald-600 / text-slate-* / border-slate-200` 及图表 `#3b82f6 / #4f46e5` 全部迁移到 `--color-brand-*` / `brand-*`
- [ ] 3.3 主页精简卡：近 30 天展示量 sparkline/area + top queries 缩略 + 环比

## 4. 主页装配（GrowthHome.tsx）

- [ ] 4.1 渲染 `syncing` 中间态（已连 GSC、数据回填中），含合理超时回退文案
- [ ] 4.2 将精简数据卡接入 GrowthHome，替换/增强当前裸数字 Pulse
- [ ] 4.3 首数据揭晓洞察接入洞察卡位

## 5. 导航入口（SidebarNav.tsx）

- [ ] 5.1 `primaryLinks` 最前新增"增长主页 / Growth"项，指向 `/dashboard`，`isActive: pathname === '/dashboard'`，无站点时指向 onboarding
- [ ] 5.2 确认导航顺序为 总览 → 诊断 → 生产 → 衡量；补 `messages` 中对应 i18n key（zh/en）

## 6. Design Compliance（UI 任务）

- [ ] 6.1 校验所有颜色使用 brand token——无硬编码 hex、无 ad-hoc Tailwind 色（slate-900 / emerald-600 / blue-50 等）
- [ ] 6.2 校验无已移除的工具类（.border-brutalist / .brutalist-hover / .bg-gradient-brand / .text-gradient-brand）
- [ ] 6.3 校验交互元素均为 rounded-lg
- [ ] 6.4 校验所有用户可见文案位于 const COPY/ITEMS 或 i18n messages（无内联硬编码字符串）
- [ ] 6.5 对修改过的文件运行 `/web-design-guidelines` 并修复所有报告问题
- [ ] 6.6 图表配色迁移后人工核对对比度达 WCAG AA

## 7. 验证

- [ ] 7.1 端到端：onboarding → 连 GSC → 选 property → 回 `/dashboard` 看到 `syncing` → 数据到位后看到真实图 + 首数据洞察，全程无需手动同步
- [ ] 7.2 导航：从任意 dashboard 子页能经"增长主页"入口回到 GrowthHome
- [ ] 7.3 回归：site-detail 的 `#performance` 完整版图表在组件抽取后仍正常
