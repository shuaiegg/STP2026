# Agent Orchestration

> 真实状态（2026-06-27 校准）。本项目的子代理定义在 `.claude/agents/`，均为**只读审查**代理（Read/Grep/Glob），符合「探索与编辑分离」原则：代理产出报告，主代理负责修复。

## Project Agents（`.claude/agents/`）

| Agent | Model | 用途 | 何时触发 |
|-------|-------|------|---------|
| `design-checker` | haiku | 按 CLAUDE.md 前端设计清单逐项审查 UI 代码（颜色 token、圆角、间距、a11y、Next.js 最佳实践） | 改动任何 page/component/UI 后，标记完成前 |
| `i18n-auditor` | haiku | 审查 i18n 6 条硬约束（useLocale 滥用、公开查询漏 locale、硬编码文案、next/link 误用、你 vs 您、localeCookie） | 改动 `[locale]/` 页面或 i18n 配置后 |
| `content-quality-reviewer` | sonnet | 按 `rules/content-scorecard.md` 5 维度 /100 评分内容质量 | 生成/发布文章内容前 |

机械、规则明确的检查用 **haiku**（便宜快）；需要质量判断的用 **sonnet**。

## Built-in Agents（Claude Code 内置，无需定义）

- **Explore** — 只读广度搜索，跨多文件/命名约定找代码，只要结论不要文件转储
- **Plan** — 设计实现方案，返回步骤化计划与关键文件
- **general-purpose** — 多步骤研究/搜索的兜底

## When to Use a Subagent

1. **大范围只读探索**（"这个能力散落在哪些文件"）→ Explore，避免污染主上下文
2. **改完 UI** → design-checker（+ 改了 i18n 再加 i18n-auditor），可并行
3. **写完文章内容** → content-quality-reviewer
4. **复杂功能前的方案设计** → Plan

> 注意：本仓库的代码探索**首选 codebase-memory-mcp**（search_graph / trace_path / get_code_snippet），见 `rules/coding-style.md` 与 SessionStart hook。子代理用于审查与并行，不替代图谱查询。

## Parallel Execution

独立的审查互不依赖 → 同一轮并行触发（如 design-checker + i18n-auditor 同时跑两个不同文件）。有依赖（探索结论喂给修复）才串行。

## Multi-Perspective Analysis

复杂问题可让 general-purpose 代理分角色审视：事实核查 / 资深工程 / 安全 / 一致性 / 冗余。仅在确有必要时使用，单人项目多数情况主代理直接处理更快。
