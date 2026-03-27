## ADDED Requirements

### Requirement: 引用已有 spec 完成实现

`audit-delta-comparison` 的完整需求已定义于 `openspec/specs/audit-delta-comparison/spec.md`。本 change 负责实现该 spec，无需修改需求。

实现要点（来自已有 spec）：
- `HealthReport` 组件接受可选 `previousIssueReport` prop
- 父页面 `[siteId]/page.tsx` 传入 `audits[1].issueReport` 作为 `previousIssueReport`
- Delta banner 显示"比上次新增 N 个问题，修复了 M 个问题"
- `previousIssueReport` 为 null 时不渲染 banner

#### Scenario: 引用已有 spec 的实现验证
- **WHEN** 站点有两条及以上审计记录
- **THEN** HealthReport SHALL 显示 Delta banner，内容符合 `openspec/specs/audit-delta-comparison/spec.md` 中所有场景的定义
