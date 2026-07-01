## ADDED Requirements

### Requirement: geo-writer 归正到设计系统

geo-writer SHALL 使用 `brand-*` token(交互主色 `brand-secondary` = 翡翠 #10b981)与 `rounded-lg`,移除所有 `slate-*`、硬编码色与 brutalist 样式(`border-black`、`shadow-[…]`、`bg-amber-500` 等),改用 Stripe 式(`hover:shadow-md`、`border-brand-border`)。归正 SHALL 使用 token 类名,MUST NOT 写死 hex(色值与归正正交)。

#### Scenario: dashboard 内视觉一致

- **WHEN** 在 dashboard 打开 geo-writer
- **THEN** 配色/圆角/阴影与 dashboard 其它页一致,无 brutalist/slate 冲突

#### Scenario: 无硬编码色

- **WHEN** 检查 geo-writer 样式
- **THEN** 无 `slate-*`/硬编码 hex,交互色走 `brand-secondary` token

### Requirement: geo-writer 双语 i18n

geo-writer 所有用户可见文案 SHALL 走 `useTranslations`(`messages/{en,zh}.json`),不含硬编码中文;中文用「您」。EN 用户 SHALL 看到英文界面。

#### Scenario: EN 用户看英文

- **WHEN** locale=en 的用户使用 geo-writer
- **THEN** 标签/占位/提示/步骤名/tab 名均为英文(无中文残留)

### Requirement: 首访性能(懒加载重依赖)

只在策略/生成/结果阶段用到的重依赖(Markdown 渲染、段落编辑、导出、版本历史)SHALL 懒加载,使研究步首屏不载入它们。懒加载 MUST NOT 破坏对应功能(带 loading 态)。

#### Scenario: 研究步轻载

- **WHEN** 首次进入 geo-writer(研究步)
- **THEN** 不加载 Markdown/编辑/导出/版本 等重依赖,首访更快;进入后续步骤时按需加载,功能正常

### Requirement: 不改逻辑,仅展示/文案/导入

本次归正 MUST NOT 改动生成、流式、编辑、导出、版本的**逻辑**,只改样式类、文案与导入方式。GEO 评分/prompt、向导流程不在本次范围。

#### Scenario: 功能零回归

- **WHEN** polish 后走完整写作流程(研究→策略→生成→编辑→导出→保存)
- **THEN** 各功能与 polish 前一致,仅外观/语言/加载方式改善
