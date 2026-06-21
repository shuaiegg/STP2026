## Context

6 条独立的快速任务，均无前置条件，单条 10-30 分钟。任务之间没有依赖关系，可以任意顺序完成。核心是 PostHog 事件补点 + 构建验证 + 手动测试。

公共导航已有 `/tools` 入口且 geo-writer 已在工具页展示，导航部分已完成。首页工具区块与活跃 change `homepage-plg-repositioning`（任务 1.3.x）重叠，本 change 不触碰首页，推迟到那里处理。

## Goals / Non-Goals

**Goals:**
- PostHog 覆盖 3 个核心用户操作：工具页访问、内容计划创建、Library 文章保存
- 验证密码重置邮件流程可用
- 确认 `npm run build` 无报错

**Non-Goals:**
- 首页工具区块（归入 `homepage-plg-repositioning`）
- geo-writer 导航变更（已通过 `/tools` 覆盖）
- PostHog funnel 配置（平台侧操作，不在本 change 范围）

## Decisions

**PostHog 事件命名规范**：沿用已有事件的下划线命名风格（`stellar_writer_discovery_started`、`board_start_writing`），新增事件遵循 `<entity>_<action>` 格式：
- `tool_page_viewed`（工具页 mount 时，带 `{ tool: 'geo-writer' }`）
- `content_plan_created`（Strategy Board 生成计划时，带 `{ siteId, planCount }`）
- `article_saved_to_library`（Library 文章保存时，带 `{ articleId }`）

**事件触发位置**：
- `tool_page_viewed`：geo-writer page 的 mount `useEffect`（第一个 effect 或新增独立 effect，dep `[]`）
- `content_plan_created`：StrategyBoard.tsx 中内容计划生成成功回调处
- `article_saved_to_library`：`src/app/(protected)/dashboard/library/` 的保存操作（client 侧触发）

## Risks / Trade-offs

- `content_plan_created` 触发点需确认 StrategyBoard 中计划生成的确切位置（可能在 server action 回调或 optimistic update 后）
- Library 保存可能在 server action 里（无 PostHog 访问），需要确认是 client 组件触发还是需要加 client wrapper 来 capture

## Implementation Notes (for Gemini / Antigravity)

**已知遗留冲突：**
- `homepage-plg-repositioning` change 正在重构首页（任务 1.3.1-1.3.5）——本 change 禁止触碰 `src/app/[locale]/(public)/page.tsx`

**禁止触碰范围：**
- `src/app/[locale]/(public)/page.tsx`（首页，留给 homepage-plg-repositioning）
- `src/components/layout/MainLayout.tsx`（导航已完善，不动）
- 任何 Prisma schema 或数据库相关文件

**本 change 边界：**
- `src/app/[locale]/(public)/tools/geo-writer/page.tsx`（仅加 page view event）
- `src/app/(protected)/dashboard/site-intelligence/[siteId]/components/StrategyBoard.tsx`（仅加 content_plan_created event）
- `src/app/(protected)/dashboard/library/` 下的 client 组件（仅加 article_saved event）

**其他注意事项：**
- PostHog import 已存在于 geo-writer page 和 StrategyBoard，直接用 `posthog.capture()`
- Library 目录需先确认哪个文件是 'use client' 组件，再决定在哪里加 import
- 验证任务（密码重置、npm build）是手动步骤，不产生代码变更
