# Public Localized Routes — 局部约定

> 本目录补充根 CLAUDE.md 的「Internationalization」。这是**唯一**做 i18n 路由的区域（英文根路径、中文 `/zh` 前缀）。`dashboard/` 与 `admin/` 不在此列、单语中文。

## 改完此目录的文件 → 跑 i18n-auditor

`.claude/agents/i18n-auditor`（haiku）逐条查下面 6 条硬约束。改了 UI 再加 design-checker。

## 6 条硬约束（违反过都导致生产 500 或数据泄漏）

1. **`useLocale()` 不进根 layout 的客户端组件** —— SSR 会 500。locale 用 props 从 server 传。
2. **公开内容查询必须显式传 `locale`** —— `getPublishedContent*` 不默认 `zh`，漏传会泄漏错误语言内容。
3. **内部公开链接用 `@/i18n/navigation` 的 `Link`**，不用 `next/link`（否则丢 locale 前缀）。`next/link` 仅限 `/dashboard/*`。
4. **中文用「您」不用「你」**（PostToolUse hook 会对 .tsx 报警）。
5. **`routing.ts` 保持 `localeCookie: false`** —— 否则压制语言建议横幅。
6. **不按 IP/Accept-Language 自动重定向** —— URL 决定语言，Accept-Language 只驱动可关闭的建议横幅。

## 文案

用户可见字符串提取到 `const COPY={...}` 或 `messages/{en,zh}.json`，en/zh 同步。诚实化原则：不宣称未实现的能力（参见 citation-tracking-honesty change）。

## 页面可见性

`src/lib/i18n/page-availability.ts` 的 `PAGE_LOCALES` 白名单；不可用 locale → `notFound()`。
