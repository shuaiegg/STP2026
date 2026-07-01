## Why

geo-writer 是核心生产界面,现已搬进 dashboard,但全文件积累了大量设计/i18n 债,和干净的 Stripe 式 dashboard 冲突,且 EN 用户看到中文:

- **视觉债**:150 处 `slate-*` + 43 处硬编码色(amber/red/emerald 数字)+ 10 处 brutalist(`border-black`、`shadow-[8px…]`、`bg-amber-500`)——违反设计系统(brand token + rounded-lg + Stripe 密度),在 dashboard 内尤其刺眼。
- **i18n 债**:66 处硬编码中文、仅 15 处 `t()` → **EN 用户(已进 MVP)在写手里看到中文标签**,是功能性 bug。
- **密度**:为全宽公共页设计(容器已就近修,但 step 指示器/tab 等仍偏松散)。
- **bundle/慢**:ReactMarkdown / EditableSection / export-helpers / version-manager 静态导入,首屏(研究步)也载入,dashboard 首访偏慢。
- **文档漂移(顺带修)**:CLAUDE.md 曾把 `brand-secondary` 写成 `#00d4ff`;真值是 `#10b981` 翡翠(globals.css/design.md)。CLAUDE.md 已改;`global-error.tsx` 里硬编码的 `#00d4ff` 也应改为 token。

目标设计**明确**(design.md + globals.css 真源:交互主色 = 翡翠 `#10b981`、brand-* token、`rounded-lg`、`py` 间距、Stripe 密度)。归正到 **token 类名**(与色值正交,未来切色只动 globals.css 一行)。

## What Changes

1. **JOB 1 视觉归正**:`slate-*` / 硬编码色 / brutalist → design.md/globals.css 的 `brand-*` token + `rounded-lg`;去掉 `border-black`/`shadow-[…]`/`bg-amber-500` 等 brutalist,换 Stripe 式(`hover:shadow-md`、`border-brand-border`)。
2. **JOB 2 i18n**:66 处硬编码中文 → `messages/{en,zh}.json`(新 geo-writer namespace);中文用「您」;英文引 `rules/voice-en.md`。EN 用户不再见中文。
3. **JOB 3 密度**:dashboard 原生间距(step 指示器/tab/卡片补齐,承接已修的容器)。
4. **JOB 4 bundle**:把只在 step2/3/result 用的重依赖(ReactMarkdown、EditableSection、export-helpers、version-manager)改**懒加载**(dynamic/按需),研究步轻载 → 首访更快。
5. **文档/硬编码收尾**:`global-error.tsx` 的硬编码 `#00d4ff` → token(或对齐真值);确保无新增硬编码 hex。

## Capabilities

### New Capabilities
- `geo-writer-polish`: geo-writer 的设计系统归正(brand token/rounded-lg/Stripe 密度)、双语 i18n、bundle 懒加载 —— 使其在 dashboard 内原生、EN 就绪、更快。

### Modified Capabilities
<!-- 纯展示层/i18n/性能;不改生成逻辑、GEO 评分(那是 geo-methodology-upgrade)、流程(geo-writer-flow) -->

## Impact

- **修改**:`src/app/[locale]/(public)/tools/geo-writer/page.tsx`(主体:token + i18n + 密度 + 懒加载)、`messages/{en,zh}.json`(geo-writer namespace)、`src/app/global-error.tsx`(硬编码 hex→token)。
- **参考**:`rules/design.md` + `globals.css`(token 真源)、`rules/voice-en.md`(EN voice)。
- **不影响**:生成/流式/编辑逻辑、GEO 评分/方法论(属 `geo-methodology-upgrade`)、向导流程(属 `geo-writer-flow`)、模型路由、积分。
- **风险**:中。~200 处配色逐处归正 + 66 处文案抽取(量大、机械,但要小心别动交互逻辑);懒加载要确保功能不回归。
- **依赖**:无硬依赖;与 `geo-methodology-upgrade`(改同文件的 prompt/评分)有**文件重叠**——建议**先做 polish(纯展示/i18n)再做 methodology(逻辑)**,或反之,避免同时改冲突;二者不要并行。
- **关联**:落地 backlog「geo-writer 全文件 i18n + token 归正」;承接工具搬进 dashboard 后的视觉一致性。
- **Deferred(backlog)**:组件拆分(`<ResearchStep>/<StrategyStep>/…`,更大重构,可作后续 refactor)、`library/edit` 残留 slate 归正、公共 /tools 等其它遗留页归正。
