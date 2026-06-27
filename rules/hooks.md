# Hooks System

> 真实状态（2026-06-27 校准）。本项目的 hooks 定义在 **`.claude/settings.local.json`** 的 `hooks` 字段（不是 `~/.claude/settings.json`）。下表与该文件一一对应。

## Hook Types

- **PreToolUse**：工具执行前（拦截/校验，exit 2 阻断）
- **PostToolUse**：工具执行后（自动检查/格式化）
- **Stop**：会话结束时（最终验证、提醒）

## Current Hooks（`.claude/settings.local.json`）

### PreToolUse
- **DB 破坏性操作拦截**（matcher `Bash`）：命令含 `prisma migrate` / `prisma db push` / `DROP TABLE` / `TRUNCATE` 时 `exit 2` 阻断，提示先确认 dev/prod 环境再手动运行。对应 CLAUDE.md「Destructive Operations — Always Confirm First」。

### PostToolUse
- **中文「你 → 您」检查**（matcher `Edit|Write`）：编辑 `.tsx` 后 grep `你`，命中则打印提醒（B2B 中文必须用「您」）。非阻断。

### Stop
- **TypeScript 类型检查**：若本次有 `.ts` 变更，自动 `npx tsc --noEmit` 并回显末尾 20 行。
- **UI 改动提醒**：若有 `.tsx` 变更，提醒运行 `/audit` 和 `/web-design-guidelines`。
- **记忆/文档反思提醒**：若有源码/记忆变更，提醒考虑是否有值得写入 `memory/` 的非显而易见决策、或需更新 CLAUDE.md 的坑点（对应文章「Stop hook 反思」最佳实践）。非阻断。
- **图谱重建提醒**：本次 `.ts/.tsx` 改动 > 3 个文件时，提醒若动了符号结构（函数签名/新增删除文件/挪动模块）则手动跑 `index_repository` 同步 codebase-memory 图谱（图谱不自动更新，见 `rules/coding-style.md` 代码发现协议）。非阻断。

## 维护约定

- 改 hooks 后用 `python3 -c "import json; json.load(open('.claude/settings.local.json'))"` 验证 JSON 合法。
- hooks 命令尾部统一 `|| true`（非阻断类）或 `exit 2`（阻断类），避免误杀正常流程。

## ⚠️ 安全提醒

`.claude/settings.local.json` 当前**被 git 跟踪**，且 `permissions.allow` 里残留旧机器路径（`/Users/apple/...`）与**明文密钥**（Coolify token、MinIO/DB 凭据）。建议：`git rm --cached .claude/settings.local.json` + 加入 `.gitignore` + 轮换已暴露的密钥。详见本次审查结论。

## Auto-Accept Permissions

- 仅对可信、定义明确的计划开启
- 探索性工作关闭
- 永不使用 `--dangerously-skip-permissions`
