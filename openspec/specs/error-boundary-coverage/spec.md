# error-boundary-coverage Specification

## Purpose
TBD - created by archiving change error-boundary-coverage. Update Purpose after archive.
## Requirements
### Requirement: 关键路由 Error Boundary 覆盖

系统 SHALL 为以下关键路由提供段级 `error.tsx` 边界,使渲染期错误被捕获并显示品牌化降级 UI,而非 Next.js 默认错误页或白屏:生成流程(`tools/geo-writer`)、审计流程(`site-intelligence/instant-audit`)、公开根(`[locale]/(public)`)、博客(`blog`)、dashboard 根。

#### Scenario: 生成流程渲染期抛错

- **WHEN** 用户在 `tools/geo-writer` 使用过程中,页面渲染期抛出未捕获错误
- **THEN** 显示该段的 `error.tsx` 降级 UI(标题 + 安抚描述 + 重试按钮),不白屏,不暴露 `error.message`/`digest`

#### Scenario: 审计流程渲染期抛错

- **WHEN** `site-intelligence/instant-audit` 渲染期因数据或上游异常抛错
- **THEN** 显示品牌化"出错 + 重试"边界,用户可点击重试触发 `reset()`

#### Scenario: 重试恢复

- **WHEN** 用户在任一 error 边界点击重试按钮
- **THEN** 调用 `reset()` 重新渲染该段;若错误已恢复则正常显示内容

### Requirement: 顶层 Global Error 兜底

系统 SHALL 提供 `app/global-error.tsx`,捕获根 layout 级别的渲染错误。该组件 SHALL 自带 `<html>`/`<body>`,且 MUST NOT 依赖 `NextIntlClientProvider`、主题 CSS 变量或其它运行时 provider(因其运行在所有 provider 之外)。

#### Scenario: 根 layout 抛错

- **WHEN** 根 layout 或其上下文在渲染期抛出未被任何段级边界捕获的错误
- **THEN** `global-error.tsx` 渲染自包含的兜底页面(含安全内联样式与简洁文案 + 重试),不出现完全白屏

#### Scenario: global-error 不依赖 provider

- **WHEN** `global-error.tsx` 渲染
- **THEN** 其不调用 `useTranslations` 等需要 provider 的 API,使用自包含双语/英文文案,避免二次崩溃

### Requirement: 降级 UI 一致性与品牌合规

所有新增 error 边界 SHALL 使用 `brand-*` 设计 token 与 `rounded-lg`,文案 SHALL 走 i18n(公开页用 `public.errors` namespace,en/zh 同步,中文用「您」),且 MUST NOT 向用户展示技术细节(stack/digest)。`global-error.tsx` 因运行在 CSS 变量加载之前 SHALL 作为 brand-token 规则的文档化例外,使用安全内联色。

#### Scenario: 公开页错误文案本地化

- **WHEN** 英文用户在公开页触发 error 边界
- **THEN** 显示英文错误文案(来自 `public.errors`);中文用户显示中文文案(用「您」)

#### Scenario: 不泄露技术细节

- **WHEN** 任一 error 边界被触发
- **THEN** 用户可见文案不含 `error.message`/`error.digest`/stack;`digest` 仅通过 `console.error` 记录

