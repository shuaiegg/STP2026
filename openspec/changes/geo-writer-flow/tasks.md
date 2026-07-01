> ⚠️ 与 `geo-writer-polish`、`geo-methodology-upgrade` 改同一文件,**不可并行,建议最后做**(polish→methodology→flow)。loop 模式作独立分支,尽量不动手动模式路径。

## 1. 断层① loop 快捷道(免重复研究)

- [ ] 1.1 入口判定:有 siteId(+pillar/plannedArticleId)→ loop 模式;无 → 手动完整流程
- [ ] 1.2 loop 模式:读站点已存诊断智能(Competitor/SemanticDebt/DNA/(可选)缓存 SERP,复用已有 API)→ 组装 research 结果 + 初始大纲
- [ ] 1.3 跳过或**折叠** step1(折叠更安全:可展开查看/改),落在 step2
- [ ] 1.4 "重新研究"逃生口(用户可强制跑完整 step1)
- [ ] 1.5 降级:诊断缺失/失败 → 回退正常 step1,不阻断
- [ ] 1.6 **不重复调 DataForSEO** 重跑已有数据

## 2. 断层② 集群感知

- [ ] 2.1 写作界面集群侧栏:所属支柱 + 兄弟真实内链 + 集群缺口(去写)——复用双模内链 + fan-out/集群数据,不新建管道

## 3. 断层③ 闭环交接

- [ ] 3.1 保存成功 → 明确 CTA "发布并连接(回填 URL)"(链到内容库回填/closed-content-loop 入口),替代仅 toast

## 4. 验证

- [ ] 4.1 `npx tsc --noEmit` 仅剩 1 预存 auth.ts 错误,零新增
- [ ] 4.2 三入口回归:蓝图"开始写作"、策略板 plannedArticle、手动打开 —— 各自流程正确
- [ ] 4.3 loop 进入免重复研究(复用诊断智能);诊断缺失优雅降级
- [ ] 4.4 集群侧栏显示兄弟/缺口;保存后有"发布并连接"交接
- [ ] 4.5 手动模式完整 3 步不回归;streaming/编辑/导出/版本 功能正常
- [ ] 4.6 i18n-auditor + design-checker
- [ ] 4.7 更新 backlog:勾本期;保留 deferred(5 tab 精简/组件拆分/整簇批量生产)
