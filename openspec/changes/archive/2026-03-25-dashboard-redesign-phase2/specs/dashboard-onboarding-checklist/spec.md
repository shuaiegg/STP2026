## MODIFIED Requirements

### Requirement: 新用户欢迎空状态
当用户没有任何站点时，系统 SHALL 在 `/dashboard` 展示欢迎空状态，替换原有的零数据统计区域，并提供单一主 CTA 引导用户跳转至 `/dashboard/onboarding` 页面开始引导流程。

#### Scenario: 0 站点时显示欢迎空状态
- **WHEN** 用户访问 `/dashboard` 且 `totalSites === 0`
- **THEN** 统计卡片区域被替换为欢迎文案 + 「开始分析你的第一个网站」主 CTA 按钮
- **THEN** 点击 CTA 跳转至 `/dashboard/onboarding`，而非显示内联表单

#### Scenario: 欢迎空状态不显示空数字
- **WHEN** 用户处于 EMPTY 态
- **THEN** 页面不显示任何为 0 的指标数字或空数据卡片

#### Scenario: 欢迎空状态提供即时审计次要入口
- **WHEN** 用户处于 EMPTY 态
- **THEN** 页面同时展示「先试试免费即时审计」次要文字链接，链接至 `/dashboard/site-intelligence/instant-audit`
