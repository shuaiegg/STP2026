# Dashboard 英文化 — 提案

## Why

`homepage-plg-repositioning` 的 hero 动线是"英文访客输入域名 → 注册 → 直接看审计报告"——**报告页就是 dashboard**。英文访客的第一个产品体验发生在登录墙内，dashboard 不英文化，英文 PLG 漏斗在最后一步断崖。

代码现状量化（2026-06-12）：

- `(protected)` 含中文文件 55 个，其中 admin 23 个（保持中文）→ 用户侧 ~32 个文件、约 600 处中文字符串
- 共享组件（`src/components/`）含中文 23 个文件
- **冰山在 AI 输出层**：`src/lib/skills/site-intelligence/`（audit-analyzer / graph-generator / constants 等）与 Stellar pipeline（StellarEnricher 等）含中文 prompt 与标签——审计报告、策略建议、语义分析的 **AI 产出本身是中文的**。英文 UI + 中文报告 = 体验照样断崖

好消息：dashboard 在 `(protected)` 路由组，不进 `[locale]` URL 段——locale 直接从 `User.locale` 读取，**零路由改造**，复用 `site-i18n-bilingual` 的 next-intl 基建与 messages 体系。

## What Changes

**Phase 1（英文漏斗关键路径，与 homepage-plg 同期上线）**
1. locale 供给：`(protected)` layout 从 session 的 `User.locale` 加载 messages（非 URL）
2. 关键路径 UI 英文化：注册后流程 / onboarding / instant-audit 报告页 / site-intelligence 站点列表与详情核心视图 / 顶部导航与通用组件
3. 关键路径 AI 输出英文化：instant-audit 与站点审计的分析产出接受 locale 参数（prompt 层），报告标签/枚举文案进 messages

**Phase 2（全量补完，可后置）**
4. 其余 dashboard 页面：library / tools / billing / settings
5. 其余 AI 输出：策略看板生成、语义分析、geo-writer 界面（其产出语言已由用户选择控制，界面仍需英文化）
6. 共享组件清扫 + 中文残留扫描门禁

## Capabilities

### 新增

- `dashboard-locale-provider`: `(protected)` layout 按 `User.locale` 提供 messages，设置页可切换并即时生效
- `dashboard-critical-path-en`: onboarding + instant-audit 报告 + site-intelligence 核心视图英文化（UI + AI 输出）
- `skill-output-locale`: skill 执行链路传递 `outputLocale`（默认 = `User.locale`），相关 prompt 模板双语化
- `dashboard-full-en`(Phase 2): 其余页面与组件全量英文化 + CJK 残留扫描脚本

### 修改

- `src/app/(protected)/dashboard/layout.tsx`: 注入 NextIntlClientProvider（locale 来自 session）
- `src/lib/skills/site-intelligence/audit-analyzer.ts` 等: 分析 prompt 接受 locale，输出语言跟随
- `src/lib/skills/base-skill.ts` / `types.ts`: 执行上下文增加 `outputLocale`
- 用户侧 dashboard 页面与共享组件: 文案迁移 messages（`dashboard.*` 命名空间）

### 不变

- admin 区（`/dashboard/admin/*`）保持中文——内部工具，用户是创始人本人
- URL 结构不变（dashboard 无 locale 前缀）
- AI 输出的**数据**（分数、指标）不变，只有语言层变化
- geo-writer 产出内容的语言逻辑不变（已由 content-flywheel/site-i18n 处理）

## Non-Goals

- admin 后台英文化
- 历史已生成报告的翻译回填（存量审计报告保持生成时语言，重新跑审计即得新语言）
- 邮件模板（属 `site-i18n-bilingual` Sprint 3）
- dashboard 的 UI 重设计（纯语言层，不动布局）
