## 1. i18n 文案

- [x] 1.1 `messages/en.json` + `messages/zh.json` 新增 `public.errors`(`title`/`description`/`retry`/`backHome`),en/zh 同步,中文用「您」,文案不含技术细节
- [x] 1.2 确认 `dashboard.errors` 已有 `retry` + 通用 `title`/`description`(dashboard 根复用),缺则补

## 2. 段级 error.tsx(provider 内,走 i18n)

- [x] 2.1 `[locale]/(public)/error.tsx` —— 公开根,`useTranslations('public.errors')`,含"返回首页"次操作
- [x] 2.2 `[locale]/(public)/tools/geo-writer/error.tsx` —— 生成流程(重点)
- [x] 2.3 `[locale]/(public)/blog/error.tsx` —— 博客
- [x] 2.4 `(protected)/dashboard/error.tsx` —— dashboard 根,复用 `dashboard.errors`
- [x] 2.5 `(protected)/dashboard/site-intelligence/instant-audit/error.tsx` —— 审计流程(重点)
- [x] 2.6 全部 `'use client'` + `console.error(error)` + `reset()` 重试 + brand-* token + rounded-lg

## 3. 顶层 global-error

- [x] 3.1 `app/global-error.tsx` —— 自带 `<html lang><body>`,**不**用 next-intl,自包含简洁文案(英文为主 + 一行中文),安全内联色,`reset()` 重试
- [x] 3.2 文件顶部注释说明:此处为 brand-token 规则的合理例外(运行在 CSS 变量加载之前)

## 4. 现有边界配色归正(顺带,不扩散)

- [x] 4.1 现有 5 个 error.tsx(billing/library/onboarding/site-intelligence[siteId]/tools)的 `slate-900`/`rose-50`/`slate-500` → 对应 brand token;仅改配色 ClassName,不动结构/i18n key

## 5. 验证

- [x] 5.1 `npx tsc --noEmit` 仅剩 1 个预存 auth.ts 错误,零新增
- [x] 5.2 跑 i18n-auditor(公开页 error.tsx)+ design-checker(全部新边界)并修复
- [ ] 5.3 临时在根 layout `throw` 一次,生产构建验证 global-error 真捕获,验后撤销 ← 需手动验证
- [ ] 5.4 抽验 geo-writer / instant-audit 边界:模拟渲染期错误显示降级 UI、重试可恢复 ← 需手动验证
- [x] 5.5 勾选 `openspec/mvp-launch-checklist.md` 的"error.tsx 边界"走查项
