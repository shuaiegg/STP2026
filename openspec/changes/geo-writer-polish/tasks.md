> ⚠️ 与 `geo-methodology-upgrade` 改同一文件,**不可并行**。建议本 polish(展示/i18n)先做或串行,避免合并冲突。

## 1. 视觉归正(token)

- [ ] 1.1 `slate-*` → brand token(surface/border/text-muted/text-primary 按 design.md 映射)
- [ ] 1.2 硬编码色 → token:交互 `brand-secondary`(翡翠)、amber→`brand-accent`、red→`brand-error`、emerald→`brand-success`
- [ ] 1.3 brutalist(`border-black`/`shadow-[…]`/`bg-amber-500`)→ Stripe 式(`border-brand-border rounded-lg hover:shadow-md`)
- [ ] 1.4 圆角统一 `rounded-lg`;**不写死任何 hex**(全用 token 类)
- [ ] 1.5 grep 复扫 `slate-` / `#[0-9a-fA-F]{6}` 无残留

## 2. i18n(EN 进 MVP,必做)

- [ ] 2.1 抽 66 处硬编码中文 → `messages.geoWriter`(en/zh);中文用「您」,英文按 voice-en
- [ ] 2.2 覆盖:label/占位/toast/step 名/tab 名/按钮/空状态
- [ ] 2.3 grep 复扫中文残留;i18n-auditor 过

## 3. 密度

- [ ] 3.1 step 指示器/tab 栏/卡片间距对齐 dashboard 节奏(承接已修容器);保留 `isDashboard` 分支

## 4. bundle 懒加载

- [ ] 4.1 ReactMarkdown / EditableSection / export-helpers / version-manager → dynamic/按需 import(带 loading 态)
- [ ] 4.2 研究步不载入上述;验证 preview/编辑/导出/历史功能不回归

## 5. 硬编码 hex 收尾

- [ ] 5.1 `global-error.tsx` 内联 `#00d4ff` → 对齐真值(翡翠;保留"内联色"例外形态)

## 6. 验证

- [ ] 6.1 `npx tsc --noEmit` 仅剩 1 预存 auth.ts 错误,零新增
- [ ] 6.2 dashboard 内视觉与 shell 一致(design-checker 过);无 slate/brutalist/硬编码 hex
- [ ] 6.3 EN 用户界面全英文(无中文残留);i18n-auditor 过
- [ ] 6.4 首访更快(懒加载生效);完整流程(研究→生成→编辑→导出→保存)功能零回归
- [ ] 6.5 更新 backlog:勾「geo-writer 全文件 i18n + token 归正」;保留 deferred(组件拆分/其它遗留页)
