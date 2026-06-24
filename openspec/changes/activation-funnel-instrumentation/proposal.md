## Why

我们对"onboarding 后主页体验"的瓶颈判断（激活 → 第二次回来之间漏水）目前**无法被验证**：单人自测 n=1 看不见漏斗现象，而关键事件又缺失。

现状埋点（PostHog）只有：
- `first_coach_moment_viewed`（GrowthHome 首次渲染，[GrowthHome.tsx:45](src/components/coach/GrowthHome.tsx#L45)）
- `first_action_started`（点击某个招式，[GrowthHome.tsx:57](src/components/coach/GrowthHome.tsx#L57)）

缺两个最关键的环节：
1. **首个有意义动作完成**（生成 / 发布第一篇内容）——这是"激活"的真实定义，现在只有"开始"没有"完成"。
2. **D7 回访**（用户第几天回来、回到哪个面）——留存的核心指标。

没有这两个，P1（修数据管道）和 P2（DNA 进写作）改完也**无法度量是否真的提升了激活与留存**。这是后续所有优化的"尺子"，必须先行。

## What Changes

- 新增 `first_meaningful_action_completed` 事件：用户首次成功生成或发布一篇内容时触发，携带 `action_type`（`generated` / `published`）、`days_since_signup`、`credits_spent`。
- 新增 `dashboard_returned` 事件：用户进入 `/dashboard`（GrowthHome）时触发，携带 `days_since_signup`、`landing_surface`、`is_return`（非首日）。
- 复用并补齐既有事件命名，使 `signup → onboarding_completed → first_coach_moment_viewed → first_action_started → first_meaningful_action_completed → dashboard_returned` 构成一条可在 PostHog 里画出的完整漏斗。
- 产出一份漏斗看板配置说明（哪些事件、怎么搭 funnel / retention 视图），写入变更内文档，供手动在 PostHog 配置。

## Capabilities

### New Capabilities

- `activation-analytics` — 定义激活/留存漏斗的事件契约（事件名、属性、触发时机）。

### Modified Capabilities

无既有 spec 行为变更。这是纯观测性增强，不改变任何用户可见功能或接口契约。

## Impact

- **定位**：本变更只影响 **dashboard（仪表盘，非公开、中文 UI）** 的观测性，不触及公开获客页，无双语 / i18n 影响。
- **文件**（预估，实施时以代码为准）：内容生成完成处（`generate-stream` / 写作 skill 结果回调）、发布动作（`src/app/actions/content.ts` / library 保存）、`/dashboard` 进入处（GrowthHome 或其 server 组件）、onboarding 完成处。
- **无 token / 无 UI / 无 i18n 变更**：仅插入 `posthog.capture` 调用与少量 server 端属性计算（`days_since_signup`）。
- **无破坏性**：纯增量埋点，可随时移除。
