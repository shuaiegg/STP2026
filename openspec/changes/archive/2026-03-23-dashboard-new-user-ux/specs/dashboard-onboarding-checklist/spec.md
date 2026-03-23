## ADDED Requirements

### Requirement: 新用户欢迎空状态
当用户没有任何站点时，系统 SHALL 在 `/dashboard` 展示欢迎空状态，替换原有的零数据统计区域，并提供单一主 CTA 引导用户添加第一个站点。

#### Scenario: 0 站点时显示欢迎空状态
- **WHEN** 用户访问 `/dashboard` 且 `totalSites === 0`
- **THEN** 统计卡片区域被替换为欢迎文案 + "添加第一个站点" 主 CTA 按钮

#### Scenario: 欢迎空状态不显示空数字
- **WHEN** 用户处于 EMPTY 态
- **THEN** 页面不显示任何为 0 的指标数字或空数据卡片

#### Scenario: 欢迎空状态提供即时审计入口
- **WHEN** 用户处于 EMPTY 态
- **THEN** 页面同时展示"免费即时审计"次要入口，链接至 `/dashboard/site-intelligence/instant-audit`

### Requirement: 设置进度 Checklist 横幅
当用户有站点但未完成关键设置步骤时，系统 SHALL 在 `/dashboard` 顶部展示可关闭的 Checklist 横幅，显示步骤完成进度。

#### Scenario: 有站点但未跑审计时显示 Checklist
- **WHEN** 用户访问 `/dashboard` 且 `totalSites > 0` 且 `auditCount === 0` 且未关闭 Checklist
- **THEN** 页面顶部显示 Checklist 横幅，高亮"运行首次审计"步骤

#### Scenario: Checklist 步骤完成状态准确反映
- **WHEN** 用户完成某一步骤（如连接 GSC）
- **THEN** 对应步骤显示已完成勾选状态，进度计数更新

#### Scenario: Checklist 可手动关闭
- **WHEN** 用户点击 Checklist 横幅右上角关闭按钮
- **THEN** Checklist 横幅消失，关闭状态写入 `localStorage` key `stp_checklist_dismissed`

#### Scenario: 关闭后刷新不再显示
- **WHEN** 用户已关闭 Checklist 且刷新页面
- **THEN** Checklist 横幅不再显示（从 localStorage 读取关闭状态）

#### Scenario: GSC 步骤可跳过
- **WHEN** 用户查看 Checklist 且 GSC 步骤未完成
- **THEN** GSC 步骤显示"可选"标记，且 Checklist 整体完成判断不依赖 GSC 步骤

### Requirement: Checklist 自动消失
当所有必须步骤完成时，系统 SHALL 自动隐藏 Checklist 横幅。

#### Scenario: 必须步骤全部完成时自动隐藏
- **WHEN** `totalSites > 0` 且 `auditCount > 0` 且 `totalPlannedArticles > 0`
- **THEN** Checklist 横幅不显示（无论 localStorage 状态如何）
