## 1. PostHog 事件补点

- [x] 1.1 `geo-writer/page.tsx`：在首个 `useEffect`（deps `[]`）里加 `posthog.capture('tool_page_viewed', { tool: 'geo-writer' })`，验证 PostHog 已 import
- [x] 1.2 `StrategyBoard.tsx`：找到内容计划生成成功的回调位置，加 `posthog.capture('content_plan_created', { siteId, planCount })`
- [x] 1.3 Library 保存：确认 `src/app/(protected)/dashboard/library/` 中哪个 client 组件负责保存操作，import posthog 并加 `posthog.capture('article_saved_to_library', { articleId })`

## 2. 手动验证

- [x] 2.1 验证密码重置邮件流程：在 `/forgot-password` 输入真实邮箱提交，确认收到重置邮件，点击链接能进入 `/reset-password` 并成功重置
- [x] 2.2 `npm run build` 全量验证：本地跑通构建，确认无 TypeScript / ESLint 报错，输出 build 成功日志截图或记录

## 3. 收尾

- [x] 3.1 更新 `openspec/technical-backlog.md`：将"随时可做"区块中已完成的 6 条任务移除或标记完成
