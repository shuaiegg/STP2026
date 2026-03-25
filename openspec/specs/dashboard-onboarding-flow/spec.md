# dashboard-onboarding-flow Specification

## Purpose
Provide a frictionless onboarding experience for new users by offering a URL-first instant analysis flow that automatically registers a site and redirects to the workbench upon completion.

## Requirements

### Requirement: 新用户引导页提供 URL 输入和即时分析入口
`/dashboard/onboarding` SHALL 展示一个以 URL 输入为核心的引导界面，用户无需任何预配置即可输入网站域名并触发即时分析。

#### Scenario: 用户首次进入引导页
- **WHEN** 用户访问 `/dashboard/onboarding`
- **THEN** 页面显示欢迎标题、URL 输入框（placeholder: `example.com`）和「开始免费分析」主 CTA 按钮
- **THEN** 页面不显示任何需要预配置的表单字段

#### Scenario: 用户提交有效 URL 并触发分析
- **WHEN** 用户在输入框填写合法域名后点击「开始分析」
- **THEN** 页面切换至分析进度视图，复用 instant-audit 的 SSE 流式进度显示（进度条 + 状态文字）
- **THEN** URL 参数写入 `?url=<domain>` 以支持刷新恢复

#### Scenario: 用户提交空 URL 或无效格式
- **WHEN** 用户点击「开始分析」但 URL 为空或格式无效
- **THEN** 输入框下方显示内联错误提示，不触发分析请求

#### Scenario: 分析过程中显示流式进度
- **WHEN** 即时分析 SSE 流正在进行
- **THEN** 页面显示进度百分比、当前步骤文字（如「正在检测技术架构...」）和动态进度条
- **THEN** 用户不可编辑 URL 输入框

### Requirement: 分析完成后自动注册站点并跳转工作台
引导页分析完成后 SHALL 自动将分析结果保存为正式站点记录，并跳转至 `/dashboard/site-intelligence/[siteId]`。

#### Scenario: 分析完成且 activeSiteId 已关联
- **WHEN** SSE 流返回 `done` 事件且 `siteId` 存在
- **THEN** 系统自动跳转至 `/dashboard/site-intelligence/[siteId]`
- **THEN** 跳转后概览 Tab 顶部显示「建议下一步」横幅

#### Scenario: 分析失败时保留重试入口
- **WHEN** SSE 流返回 `error` 事件
- **THEN** 页面显示错误摘要和「重新分析」按钮，URL 输入框恢复可编辑状态

### Requirement: 跳转工作台后展示「建议下一步」横幅
完成 Onboarding 进入站点工作台后，概览 Tab 顶部 SHALL 显示可关闭的「建议下一步」横幅，引导用户完成关键集成配置。

#### Scenario: 首次进入工作台显示建议横幅
- **WHEN** 用户从 onboarding 流程跳转到工作台且 localStorage 中无 `stp_next_steps_dismissed_${siteId}` 记录
- **THEN** 概览 Tab 顶部显示横幅，包含三张引导卡：「连接 GSC」、「连接 GA4」、「添加竞争对手」

#### Scenario: 用户关闭横幅后不再显示
- **WHEN** 用户点击横幅右上角关闭按钮
- **THEN** 横幅消失，`stp_next_steps_dismissed_${siteId}` 写入 localStorage
- **THEN** 刷新页面后横幅不再出现

#### Scenario: 已完成的集成项显示已完成状态
- **WHEN** 横幅显示时用户已连接 GSC
- **THEN** GSC 引导卡显示「已连接 ✓」状态，不显示 CTA 按钮
