## Why

Technical backlog 积累了 6 条"随时可做"的快速任务，单条耗时 10-30 分钟，合计约 1.5 小时，但因为分散在各处一直没人认领。打包处理，一次清零，顺便确认生产构建干净。

## What Changes

- Geo-writer 工具页加入公共导航入口（header/footer 工具链接）和首页工具展示区块
- PostHog 补齐三个关键事件追踪：工具页访问、策略看板内容计划创建、Library 文章保存
- 手动验证密码重置邮件流程（无代码变更，测试即可）
- `npm run build` 全量跑通，确认无 TypeScript/ESLint 报错

## Capabilities

### New Capabilities
- `posthog-event-coverage`：在 geo-writer 工具页、Strategy Board、Library 三处补充 PostHog 事件追踪，覆盖用户核心操作路径
- `geo-writer-discoverability`：Geo-writer 工具从仅 `/tools/geo-writer` 直链可达，升级为导航可见 + 首页曝光

### Modified Capabilities

（无现有 spec 级别的行为变更）

## Impact

- `src/components/layout/` — 公共导航组件（header/footer）加工具链接
- `src/app/[locale]/(public)/page.tsx` — 首页加工具展示区块
- `src/app/(protected)/dashboard/tools/` 或 `src/app/[locale]/(public)/tools/geo-writer/` — 加 posthog.capture 调用
- `src/app/(protected)/dashboard/` Strategy Board 相关组件 — 加 `content_plan_created` 事件
- `src/app/(protected)/dashboard/library/` — 加 `article_saved_to_library` 事件
- 无数据库变更，无 API 变更，无依赖新增
