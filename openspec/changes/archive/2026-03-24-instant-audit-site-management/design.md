## Context

即时审计页（`page.tsx`，约 950 行）是一个单文件 `'use client'` 组件，包含站点选择器、GalaxyMap、侧边栏 HUD、审计历史、多个弹窗。本次变更**仅涉及该单文件**，不新增文件，不修改 API，不变更 DB Schema。

**当前缺陷根因**：

```
useEffect([activeSiteId, sites]) {
    if (!activeAuditId) → fetchLatestAudit(新站点)   ✓
    else               → fetchSpecificAudit(新站点, 旧auditId)  ✗
}
```

切换站点时 `activeAuditId` 未清空，导致 else 分支用旧 auditId 请求新站点数据，星图不刷新。

**当前删除按钮位置**：下拉菜单头部，一个无 label 的 Trash2 图标，删除的是「当前激活站点」，操作语义与「切换站点」混杂，且仅有一层弹窗确认（无输入验证）。

## Goals / Non-Goals

**Goals:**
- 切换站点时星图、审计历史、得分、issueReport 正确重置并加载新站点数据
- 删除按钮移至每个站点条目右侧，hover 时显示，作用于该条目站点（不依赖激活状态）
- 删除操作触发域名输入确认弹窗，按钮在输入与域名完全匹配前保持禁用
- 支持删除任意站点；若删除的是当前激活站点，自动切换至列表首个剩余站点

**Non-Goals:**
- 不新增批量删除功能
- 不修改 API 层或 DB 结构
- 不为竞品站点（`isCompetitor: true`）增加独立删除入口（复用同一逻辑）
- 不做 Optimistic UI（删除期间保持 loading 状态即可）

## Decisions

### D1：切换站点时的状态重置策略

在 `renderSiteItem` 的 `onClick` 中，切换 `activeSiteId` 之前**同步清空**以下状态：

```
setActiveAuditId(null)
setGraphData({ nodes: [], links: [] })
setTechScore(null)
setIssueReport(null)
setAuditHistory([])
setSelectedNode(null)
setStatus('READY_FOR_SCAN')
```

**为什么在 onClick 而非 useEffect 中清空**：`useEffect` 异步执行，若在 effect 里清空，会有一帧旧数据残留在星图上，视觉上产生闪烁。在 onClick 中同步清空可确保切换瞬间 UI 立即进入干净状态，再由 effect 触发新站点加载。

**替代方案**：在 `useEffect` 增加 prev/next 对比，检测到站点变化时清空——逻辑更分散，容易遗漏 edge case，不采用。

### D2：删除按钮的作用对象与触发方式

`handleDeleteSite` 签名改为 `handleDeleteSite(siteId: string, domain: string)`，接收条目自身的 siteId 和 domain，而非读取 `activeSiteId`。

删除图标放入 `renderSiteItem`，使用 CSS `group/group-hover` 实现 hover 显示：

```
<button className="... group relative">
    <span>{site.domain}</span>
    <button
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => { e.stopPropagation(); openDeleteConfirm(site); }}
    >
        <Trash2 size={14} />
    </button>
</button>
```

`e.stopPropagation()` 防止触发父级的「切换站点」onClick。

### D3：域名输入确认弹窗的状态管理

新增两个 state：

```ts
const [deleteTarget, setDeleteTarget] = useState<{ id: string; domain: string } | null>(null);
const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
```

`showDeleteConfirm` boolean 替换为 `deleteTarget !== null` 派生判断，减少冗余 state。

确认按钮 disabled 条件：`deleteConfirmInput.trim() !== deleteTarget?.domain`（精确匹配，不忽略大小写，避免歧义）。

关闭弹窗时同时清空 `deleteConfirmInput`，防止下次打开时残留上次输入。

### D4：删除后的激活站点切换逻辑

```
if (deleteTarget.id === activeSiteId) {
    const remaining = sites.filter(s => s.id !== deleteTarget.id);
    if (remaining.length > 0) setActiveSiteId(remaining[0].id);
    else { setActiveSiteId(null); /* 显示空态 */ }
} else {
    // 激活站点不变，仅更新 sites 列表
    setSites(prev => prev.filter(s => s.id !== deleteTarget.id));
}
```

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 域名输入大小写不匹配导致用户困惑 | 弹窗内明确展示需输入的完整域名字符串（加粗），并在输入框下方显示实时匹配状态提示 |
| `e.stopPropagation()` 阻止了条目 hover 失焦 | 不影响功能；弹窗打开后下拉关闭，不存在状态冲突 |
| 切换站点时同步清空状态后 `useEffect` 立即重新加载，若切换频繁会触发多次 fetch | 当前场景下站点数量少（<20），可接受；如需优化，后续可加 debounce |
| 删除非激活站点时 `sites` 列表更新但 URL `siteId` 参数不变 | 正常——URL 对应当前激活站点，未受影响 |
