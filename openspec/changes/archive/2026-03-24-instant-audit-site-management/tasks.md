## 1. 修复站点切换时星图不更新（Bug Fix）

- [ ] 1.1 在 `renderSiteItem` 的 `onClick` 中，切换 `activeSiteId` 之前同步调用状态重置：清空 `activeAuditId`、`graphData`、`techScore`、`issueReport`、`auditHistory`、`selectedNode`，并将 `status` 重置为 `'READY_FOR_SCAN'`
- [ ] 1.2 验证：切换站点后星图立即清空，侧边栏 HUD 数据清空，不残留上一个站点的数据
- [ ] 1.3 验证：切换后自动加载新站点的最新审计记录（`fetchLatestAudit` 被正确调用）

## 2. 重构删除功能的状态管理

- [ ] 2.1 移除 `showDeleteConfirm: boolean` state，新增 `deleteTarget: { id: string; domain: string } | null` state（`null` 表示弹窗关闭）
- [ ] 2.2 新增 `deleteConfirmInput: string` state，用于存储用户在确认弹窗中输入的域名
- [ ] 2.3 将 `handleDeleteSite` 改为接受 `(siteId: string)` 参数，从 `deleteTarget` state 读取目标信息，不再硬绑 `activeSiteId`
- [ ] 2.4 实现删除后切换逻辑：若被删站点 === `activeSiteId`，切换至剩余列表第一个；否则仅更新 `sites` 列表
- [x] 2.1 移除 `showDeleteConfirm: boolean` state，新增 `deleteTarget: { id: string; domain: string } | null` state（`null` 表示弹窗关闭）
- [x] 2.2 新增 `deleteConfirmInput: string` state，用于存储用户在确认弹窗中输入的域名
- [x] 2.3 将 `handleDeleteSite` 改为接受 `(siteId: string)` 参数，从 `deleteTarget` state 读取目标信息，不再硬绑 `activeSiteId`
- [x] 2.4 实现删除后切换逻辑：若被删站点 === `activeSiteId`，切换至剩余列表第一个；否则仅更新 `sites` 列表
- [x] 2.5 删除成功或取消后，清空 `deleteTarget` 和 `deleteConfirmInput`

## 3. 更新站点选择器下拉 UI

- [x] 3.1 从下拉菜单头部移除现有的 Trash2 图标按钮（`activeSite && <button onClick={() => setShowDeleteConfirm(true)}>` 那段）
- [x] 3.2 在 `renderSiteItem` 的条目容器上添加 `group` className
- [x] 3.3 在每个条目右侧添加 hover 显示的删除按钮：`opacity-0 group-hover:opacity-100 transition-opacity`，点击时调用 `(e) => { e.stopPropagation(); setDeleteTarget({ id: site.id, domain: site.domain }); setIsSelectorOpen(false); }`
- [x] 3.4 确认删除图标（Trash2）使用 `text-slate-400 hover:text-rose-500` 颜色，不使用硬编码 hex

## 4. 实现域名输入确认弹窗

- [x] 4.1 将现有的 `showDeleteConfirm` 弹窗条件改为 `deleteTarget !== null`
- [x] 4.2 更新弹窗标题和说明文案，展示目标域名（加粗），提示用户输入域名以确认
- [x] 4.3 添加文本输入框，绑定 `deleteConfirmInput` state，`autoFocus`，`placeholder` 为目标域名
- [x] 4.4 「确认删除」按钮的 `disabled` 条件：`deleteConfirmInput.trim() !== deleteTarget.domain || isDeleting`
- [x] 4.5 将所有用户可见文案提取至文件顶部的 `const COPY` 对象（含弹窗标题、说明、按钮文字、placeholder 等）
- [x] 4.6 弹窗样式：`rounded-xl`，rose 主题，符合设计系统规范（无硬编码色值）

## 5. 验证与收尾

- [x] 5.1 检查是否有 `border-brutalist`、`bg-gradient-brand` 等禁用 class 被意外引入
- [x] 5.2 确认所有中文文案使用「你」而非「您」
- [x] 5.3 运行 `npm run build` 确认 TypeScript 无类型错误
