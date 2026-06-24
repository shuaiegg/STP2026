## Context

产品是慢反馈生意（SEO/GEO 真实见效需 4–8 周）。这类产品的结构性瓶颈几乎必然在"激活 → 第二次回来"之间，而非获客或首日激活。但该判断**目前不可证伪**——没有埋足够的事件。

现有 PostHog 事件散落且不完整：
- `first_coach_moment_viewed` / `first_action_started` 只覆盖"看到"与"开始"，没有"完成"。
- 没有任何回访 / 留存维度的事件。

本变更先把"尺子"补齐，再支撑 P1/P2 的成效度量。

## Goals / Non-Goals

**Goals:**
- 能在 PostHog 里画出一条完整激活漏斗，并区分首日与回访。
- 让"首个有意义动作完成率"和"D7 回访率"成为可观测、可对比的基线指标。
- 事件命名与属性标准化，避免后续口径漂移。

**Non-Goals:**
- 不做任何 UI / 功能 / 文案改动。
- 不引入新的分析后端（继续用现有 PostHog）。
- 不在本变更里"优化"漏斗——只负责能看见，优化由 P1/P2/P3 承担。
- 不做服务端会话级 retention 计算（交给 PostHog 的 retention 视图）。

## Decisions

### 决策 1：事件契约（新增两个事件）

| 事件 | 触发时机 | 关键属性 |
|------|----------|----------|
| `first_meaningful_action_completed` | 用户**首次**成功生成或发布一篇内容 | `action_type`: `'generated' \| 'published'`；`days_since_signup`: number；`credits_spent`: number |
| `dashboard_returned` | 用户进入 `/dashboard`（GrowthHome） | `days_since_signup`: number；`is_return`: boolean（`days_since_signup >= 1`）；`landing_surface`: `'growth_home'` |

"首次"语义：以用户维度去重。优先用 PostHog 的首次事件能力 / `$set_once`，或在服务端依据用户历史判断"是否此前已有完成动作"，避免每篇都触发污染漏斗。实施时择一，design 不锁死实现细节。

### 决策 2：`days_since_signup` 在服务端计算

`days_since_signup = floor((now - user.createdAt) / 1 day)`。在已有用户上下文的服务端（server component / server action / route handler）计算后随事件上报，避免客户端时钟漂移。

### 决策 3：漏斗口径（用于 PostHog 看板）

```
signup
  → onboarding_completed
    → first_coach_moment_viewed
      → first_action_started
        → first_meaningful_action_completed   ← 激活定义
          → dashboard_returned (is_return=true) ← 留存定义
```

`onboarding_completed` 若当前未埋，则在本变更补一个（onboarding 保存落地 `/dashboard` 处）。

## Risks / Trade-offs

- **"首次"去重的正确性**：若实现不当会重复触发，污染漏斗。缓解：用 `$set_once` / 服务端历史判断，并在验证步骤显式检查只触发一次。
- **PostHog 看板为手动配置**：事件就位后需人工在 PostHog 搭 funnel / retention 视图。已在 tasks 中列为显式步骤 + 文档。
- **极低实现风险**：纯 `capture` 调用，无逻辑分支变更，可随时回退。
