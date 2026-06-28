## Why

MVP 上线走查发现:最易失败的两个核心流程——**生成**(`tools/geo-writer`,多步 LLM 流水线)和**审计**(`site-intelligence/instant-audit`,外部 API + LLM)——**没有 `error.tsx` 边界**;公开页 `[locale]/(public)`、dashboard 根、博客也没有;**全站无 `global-error.tsx` 顶层兜底**。

后果:这些路由一旦在渲染期抛错(LLM 超时/429、DataForSEO 失败、数据异常),用户看到的是 Next.js 默认错误页或白屏,而不是品牌化的"出错了 + 重试"。对一个主打"可信、专业"的 SaaS,首发期白屏直接摧毁信任。这是 checklist 里点名的阻塞性走查项("生成/审计/支付/GSC 失败不白屏")。

## What Changes

- 为缺失边界的关键路由新增 `error.tsx`(客户端组件,`reset()` 重试 + `console.error` 记录),复用现有 `dashboard/tools/error.tsx` 的结构。
- 新增 `app/global-error.tsx` 顶层兜底(渲染自带 `<html><body>`,在所有 layout 之外,**不能**用 `useTranslations`/`next-intl` provider,需自包含简洁双语文案)。
- 公开路由的 `error.tsx` 走 `next-intl`(在 `NextIntlClientProvider` 内),文案进 `messages/{en,zh}.json`。
- 新边界一律用 `brand-*` token + `rounded-lg`(不沿用旧 error.tsx 的硬编码 `slate-900`/`rose-50`);旧文件顺带归正为 brand token。
- 文案不泄露技术细节(不显示 stack/digest 给用户),仅"出错了 + 重试 + 可选返回"。

## Capabilities

### New Capabilities
- `error-boundary-coverage`: 关键路由的 React error boundary 覆盖标准 + 顶层 global-error 兜底 + 品牌化降级 UI 的一致性要求。

### Modified Capabilities
<!-- 无 spec 级行为变更 -->

## Impact

- **新增文件**:`app/global-error.tsx`;`[locale]/(public)/error.tsx`、`[locale]/(public)/tools/geo-writer/error.tsx`、`[locale]/(public)/blog/error.tsx`、`(protected)/dashboard/error.tsx`、`(protected)/dashboard/site-intelligence/instant-audit/error.tsx`(按 explore 确认的缺口)。
- **修改文件**:`messages/en.json` + `messages/zh.json`(error 文案 namespace);现有 5 个 error.tsx 的硬编码配色归正为 brand token(顺带,不扩散)。
- **不影响**:业务逻辑、数据层、API 路由——纯展示层降级。
- **风险**:低。error.tsx 是 Next.js 标准机制,纯叠加;global-error 需自测确实捕获(覆盖根 layout 抛错)。
- **关联**:清掉 `openspec/mvp-launch-checklist.md` 的"error.tsx 边界"走查项。
