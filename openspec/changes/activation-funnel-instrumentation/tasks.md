## 1. 事件契约与工具

- [ ] 1.1 在一处共享常量（如 `src/lib/analytics/events.ts`，若不存在则新建）集中定义事件名与属性类型：`first_meaningful_action_completed`、`dashboard_returned`、`onboarding_completed`（如缺）
- [ ] 1.2 实现 `daysSinceSignup(user)` 辅助函数（服务端，基于 `User.createdAt`），供各埋点复用

## 2. 埋点植入（按数据流顺序）

- [ ] 2.1 `onboarding_completed`：确认 onboarding 完成落地 `/dashboard` 处是否已埋；未埋则补，携带 `days_since_signup`
- [ ] 2.2 `first_meaningful_action_completed`（生成路径）：内容生成成功回调处触发，`action_type='generated'`，带 `credits_spent`、`days_since_signup`；以用户维度只触发一次
- [ ] 2.3 `first_meaningful_action_completed`（发布路径）：`src/app/actions/content.ts` 发布成功后触发，`action_type='published'`；与 2.2 共用"首次"去重逻辑
- [ ] 2.4 `dashboard_returned`：进入 GrowthHome 时触发，带 `days_since_signup`、`is_return`、`landing_surface='growth_home'`

## 3. 验证

- [ ] 3.1 本地走通 onboarding → 生成一篇 → 发布 → 次日（或改 createdAt 模拟）重进 `/dashboard`，在 PostHog Live Events 确认五个事件按序出现且属性正确
- [ ] 3.2 验证 `first_meaningful_action_completed` 对同一用户**只触发一次**（生成第二篇不再触发）
- [ ] 3.3 在 PostHog 配置激活漏斗（funnel）与 D1/D7 retention 视图；将配置步骤与事件口径写入本变更目录下 `posthog-dashboard.md`
