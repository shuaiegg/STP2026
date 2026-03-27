现在有了完整的上下文，给你一个清晰的整合方案。

与现有工作流的整合 核心逻辑 你们现有工作流的 UI 质量门控只有一个点（最后的
/web-design-guidelines）。Impeccable
的价值在于把这个单点变成贯穿全流程的多个检查点：

opsx:propose → opsx:apply (建) → opsx:archive ↑ 现在只有这里有
/web-design-guidelines 整合后变成：

opsx:propose → opsx:apply (建) → opsx:archive ↓ ↓ ↓ /critique (方向验证) /audit
(发现问题) /polish (最终收尾) + 专项命令修复 + /web-design-guidelines (/typeset
/arrange 等) 第一步：先跑一次 /teach-impeccable（只需做一次） 它会读取你们的
rules/design.md、CLAUDE.md、CSS 变量，然后生成
.impeccable.md。之后所有命令都基于这份上下文工作，不用每次重新描述项目。

具体整合点

1. opsx:propose 阶段 — 加入 /critique

在 proposal 设计好 UI 方向后，跑 /critique [功能名] 做 UX
预审。在动手写代码之前发现方向性问题，成本最低。

2. opsx:apply 建设阶段 — 按需使用专项命令

做 UI 任务时不用等到最后才检查，遇到问题直接调对应命令：

问题现象	用哪个命令 间距/排布乱	/arrange 字体层级不对	/typeset
颜色太单调	/colorize 设计太平淡	/bolder 视觉太复杂	/quieter 动效缺失	/animate
文案不清楚	/clarify 3. UI 任务完成前 — 替换现有 Final Gate

当前 CLAUDE.md 的 Final Gate 是：

运行 /web-design-guidelines，修复所有问题 建议改为三步：

1. /audit [功能] ← 找出所有问题，生成 P0-P3 评分报告
2. 修复 P0/P1 问题 ← 按 audit 推荐的命令执行
3. /polish [功能] ← 最终对齐细节
4. /web-design-guidelines ← 保留原有合规检查
5. opsx:archive 前 — 加入 /audit 回归

归档前对整个 change 跑一次 /audit，确认分数达到 14+/20 再归档，作为 change
的质量记录。

CLAUDE.md 的 Final Gate 改动建议 把 CLAUDE.md 里的这段：

- [ ] Run `/web-design-guidelines` skill on the modified file(s)... 改为：

- [ ] Run `/audit [feature]` — review P0/P1 issues and fix with recommended
      commands
- [ ] Run `/polish [feature]` — final detail pass
- [ ] Run `/web-design-guidelines` — compliance check (existing gate)
