## Context

- geo-writer = 1983 行单体客户端组件;3 步向导(研究/策略/生成)+ 5 结果 tab。
- 债(实测):150 slate + 43 硬编码色 + 10 brutalist;66 硬编码中文,仅 15 t()。
- 容器拥挤已就近修(`isDashboard` 去双层 padding + 收 gap)。
- bundle:图表已 dynamic;但 ReactMarkdown/EditableSection/export-helpers/version-manager 静态导入。
- **设计真源**:`globals.css`(`--secondary:#10b981` 翡翠、brand-* token 全定义)+ `rules/design.md`(色表/rounded-lg/间距/按钮/卡片规范)。CLAUDE.md 已修正 secondary=翡翠。
- 相邻 `geo-methodology-upgrade` 会改**同文件**的 prompt/评分 → 不可并行。

## Goals / Non-Goals

**Goals:**
- geo-writer 视觉与 dashboard 一致(brand token + rounded-lg + Stripe 密度)。
- EN 用户看到英文(66 串 i18n)。
- 首访更快(懒加载重依赖)。
- 归正到 **token 类名**(色值正交,未来切色只动 globals.css)。

**Non-Goals:**
- 不改生成/流式/编辑逻辑。
- 不改 GEO 评分/方法论(`geo-methodology-upgrade`)、向导流程(`geo-writer-flow`)。
- 不做组件拆分(deferred,更大 refactor)。
- 不归正其它遗留页(library/edit、public tools 等,单独排)。

## Decisions

1. **token 归正映射**(slate/硬编码 → brand token,按 design.md):
   - `slate-50/100` 面 → `brand-surface`;`slate-200/border` → `brand-border`;`slate-400/500/muted` → `brand-text-muted`;`slate-700/900` → `brand-text-primary/secondary`。
   - 交互主色 → `brand-secondary`(翡翠 #10b981);次强调 amber → `brand-accent`;错误 red → `brand-error`;成功 emerald → `brand-success`。
   - brutalist:`border-b-4 border-black` + `shadow-[8px_8px_0_0_rgba(0,0,0,1)]` → Stripe 式(`border border-brand-border rounded-lg hover:shadow-md transition-shadow`)。
   - 圆角统一 `rounded-lg`(卡片/输入/按钮)。
2. **i18n**:抽 66 串到 `messages.geoWriter`(en/zh);中文用「您」;英文按 voice-en。占位/label/toast/step 名/tab 名全覆盖。dashboard 已按 User.locale 注入 provider(isDashboard),公共页按 URL locale——两处都走 `useTranslations`。
3. **密度**:step 指示器(`mb-12`→`mb-6/8`)、tab 栏(`px-8 py-2.5`→更紧)、卡片间距对齐 dashboard 节奏;保持 `isDashboard` 分支(公共页可略松)。
4. **bundle 懒加载**:ReactMarkdown(preview/article tab)、EditableSection(编辑)、export-helpers(导出)、version-manager(历史)→ `dynamic()` 或按交互动态 import;研究步不载。保留现有图表 dynamic。
5. **硬编码 hex 收尾**:`global-error.tsx` 的内联 `#00d4ff` → 翡翠真值或(该文件是 CSS-var 不可用的例外)对齐真值;确保 geo-writer 归正后无残留硬编码 hex。
6. **不与 methodology 并行**:两者改同文件。顺序建议 **polish 先(展示/i18n,机械)→ methodology 后(prompt/评分,逻辑)**;或反之,但**串行**。

## Risks / Trade-offs

- **量大易误伤**:~200 配色 + 66 文案逐处改,风险是碰到 className 里嵌的交互逻辑/条件。策略:纯类名替换 + 每步 tsc + 视觉抽查;不动 JSX 结构/handler。
- **懒加载回归**:重依赖改 dynamic 后要确保 preview/编辑/导出/历史功能不坏(带 loading 态)。
- **i18n 遗漏**:66 串易漏;用 grep 复扫中文残留 + i18n-auditor。
- **文件重叠**:与 methodology 同文件 → 必须串行,否则合并地狱。
- **色值正交**:归正到 token 类,不写死 hex → 未来若切品牌色(翡翠↔青)只改 globals.css 一行。

## Implementation Notes (for Gemini / Antigravity)

**已知遗留冲突:**
- 交互主色真值是 **翡翠 `#10b981`**(globals.css/design.md);`#00d4ff` 已弃用(仅 logo 渐变尾色)。归正一律用 **token 类 `brand-secondary`**,**不要**写死任何 hex。
- `global-error.tsx` 运行在 CSS 变量加载前,是硬编码色的**文档化例外**——把它的 `#00d4ff` 对齐真值(翡翠),但保留"内联色"这一例外形态。
- 本 change 与 `geo-methodology-upgrade` 改**同一文件**,**不可并行**,须串行(建议 polish 先)。

**禁止触碰范围:**
- 不改生成/流式(useCompletion)/编辑(EditableSection/OutlineEditor)/导出/版本 的**逻辑**,只改其**样式类 + 文案 + 导入方式**。
- 不改 GEO 评分/prompt(methodology 的活)、向导流程(flow 的活)、模型路由、积分。
- 不做组件拆分。

**本 change 边界(只允许改动):**
- `src/app/[locale]/(public)/tools/geo-writer/page.tsx`(token + i18n + 密度 + 懒加载)。
- `messages/{en,zh}.json`(`geoWriter` namespace)。
- `src/app/global-error.tsx`(硬编码 hex 对齐真值)。

**其他注意事项:**
- 参照 `rules/design.md`(色表/rounded/间距/按钮/卡片)+ `globals.css`(token)+ `rules/voice-en.md`(EN)。
- 逐步 `npx tsc --noEmit`(保持仅 1 预存 auth.ts);grep 复扫 `slate-`/`#[0-9a-f]{6}`/中文残留;跑 i18n-auditor + design-checker。
- 验证:dashboard 内视觉与 shell 一致、EN 无中文、首访更快(懒加载生效)、功能(生成/编辑/导出/历史)不回归。
