## Context

Next.js App Router 的 `error.tsx` 必须是 `'use client'` 组件,捕获**同段及子段**渲染期错误并提供 `reset()`。它无法捕获:自身同级 `layout.tsx`/`template.tsx` 的错误(由上层边界捕获)、event handler/异步代码的错误(那些由组件自行 try/catch)。根 layout 的错误只能由 `app/global-error.tsx` 捕获——它替换整个 `<html>`,**运行在所有 provider 之外**(无 `NextIntlClientProvider`、无主题、无字体变量)。

现有 5 个 `error.tsx`(billing/library/onboarding/site-intelligence[siteId]/tools)结构统一:`role="alert"` + 图标 + 标题/描述(`useTranslations('dashboard.errors')`)+ `reset()` 重试按钮。但配色硬编码 `slate-900`/`rose-50`,违反 brand token 规则。

缺口(explore 已确认):geo-writer(生成)、instant-audit(审计)、`[locale]/(public)`、blog、dashboard 根、global-error 顶层。

## Goals / Non-Goals

**Goals:**
- 关键路由渲染期抛错时显示品牌化"出错+重试",不白屏、不暴露技术细节。
- 顶层 `global-error.tsx` 兜底根 layout 级错误。
- 公开页错误 UI 走 i18n(en/zh);新边界用 `brand-*` token + `rounded-lg`。
- 复用现有 error.tsx 结构,保持一致。

**Non-Goals:**
- 不改业务逻辑/数据层/API 错误处理(那是组件内 try/catch 的事,本 change 只补渲染期边界)。
- 不做错误上报到外部(Sentry 等)——Post-MVP;现阶段 `console.error` 即可。
- 不重写现有 5 个 error.tsx 的结构(仅顺带把硬编码配色归正为 brand token)。
- 不为每个叶子路由都加边界——只覆盖"易失败 + 高价值"的关键路由 + 顶层兜底。

## Decisions

1. **分两类实现**:
   - **段级 `error.tsx`**(在 provider 内):`'use client'` + `useTranslations`,复用 tools/error.tsx 结构。公开页用新 namespace(见下),dashboard 根复用 `dashboard.errors`。
   - **`app/global-error.tsx`**(provider 外):自带 `<html lang><body>`,**不**用 next-intl(会因无 provider 崩),文案用自包含的极简双语(中英并列或仅英文兜底),内联样式或最简 Tailwind(注意 global-error 下主题 CSS 变量可能不可用,用安全的内联 fallback 颜色)。

2. **i18n namespace**:公开页错误文案新增 `public.errors`(`title`/`description`/`retry`/`backHome`);沿用现有 `dashboard.errors` 给 dashboard 根。en/zh 同步,中文用「您」。

3. **token 归正**:新边界用 `text-brand-text-primary`/`text-brand-text-secondary`/`bg-brand-*`/`brand-secondary`(主按钮)、`rounded-lg`。顺带把现有 5 个 error.tsx 的 `slate-900`/`rose-50`/`slate-500` 换成对应 brand token(小范围,不扩散到其它文件)。

4. **降级 UX**:标题"出错了"、描述给非技术性安抚 + 建议、主操作 `reset()` 重试、公开页额外给"返回首页"次操作。绝不渲染 `error.message`/`error.digest` 给用户;`digest` 仅 `console.error`。

5. **geo-writer / instant-audit 重点**:这两个是多步异步流程。`error.tsx` 只兜渲染期错误;流程内的 LLM/API 失败仍应由页面自身的 try/catch + 用户提示处理(已部分存在)。本 change 不动那部分,只加渲染期兜底网。

## Risks / Trade-offs

- **global-error 自测**:它只在生产构建 + 根 layout 真抛错时触发,dev 下不易复现;需用临时 throw 验证一次再撤。
- **global-error 无主题变量**:CSS 自定义属性可能未加载,故用内联安全色(非 brand token),这是该文件的合理例外(在文件内注释说明,避免被 design-checker 误判)。
- **i18n 在 error.tsx**:段级 error.tsx 在 public/dashboard 都处于 provider 内,`useTranslations` 安全;唯独 global-error 不可用——已隔离处理。
- 整体风险低:纯叠加的展示层降级,无数据/逻辑改动。

## Implementation Notes (for Gemini / Antigravity)

**已知遗留冲突:**
- 现有 5 个 error.tsx 用硬编码 `slate-900`/`rose-50`/`slate-500`,违反 brand token 规则。归正它们时**只改配色 className**,不动结构/i18n key。
- `global-error.tsx` 是 brand-token 规则的合理例外(运行在 CSS 变量加载之前),用内联安全色并在文件顶部注释说明,**勿**让 design-checker 的"无硬编码配色"规则误伤——这是文档化的例外。

**禁止触碰范围:**
- 不改任何 API 路由、server action、数据层、business 逻辑。
- 不改 geo-writer / instant-audit 的流程内 try/catch 与现有用户提示。
- 不动现有 error.tsx 的 i18n key 名与 `dashboard.errors` 结构(只新增 `public.errors`)。

**本 change 边界(只允许改动):**
- 新增:`src/app/global-error.tsx`、`src/app/[locale]/(public)/error.tsx`、`src/app/[locale]/(public)/tools/geo-writer/error.tsx`、`src/app/[locale]/(public)/blog/error.tsx`、`src/app/(protected)/dashboard/error.tsx`、`src/app/(protected)/dashboard/site-intelligence/instant-audit/error.tsx`。
- 修改:`messages/en.json`、`messages/zh.json`(新增 `public.errors` namespace);现有 5 个 error.tsx 仅配色归正。
- 收尾:勾选 `openspec/mvp-launch-checklist.md` 对应项。

**其他注意事项:**
- 所有新建 error.tsx 必须 `'use client'`,导出 default `function Error({error, reset})`,`useEffect` 里 `console.error(error)`。
- 公开页 error.tsx 文案进 `public.errors`,中文用「您」;global-error 文案自包含(英文为主,可加一行中文)。
- 改完跑 i18n-auditor + design-checker;`npx tsc --noEmit` 保持仅 1 个预存 auth.ts 错误。
