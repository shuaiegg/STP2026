## Context

项目根目录和 `scripts/` 目录在开发过程中积累了 50+ 个调试、验证和测试脚本。此外，`src/lib/skills/site-intelligence/` 内部存在 4 个测试文件（混入生产代码），根目录有 5 个散落的一次性脚本，`tmp/` 目录有临时文件，`src/app/` 有备份文件。这些文件不参与应用构建，但污染了代码结构。

## Goals / Non-Goals

**Goals:**
- 删除 `src/` 内部的测试/调试文件（不属于生产代码）
- 删除项目根目录的散落调试脚本
- 删除 `tmp/` 目录及其内容
- 删除 `favicon.ico.bak` 备份文件
- 清理 `scripts/` 中已明确过时的一次性脚本（test-*、verify-* 系列）

**Non-Goals:**
- 不修改任何生产代码逻辑
- 不删除仍有维护价值的 `scripts/` 工具脚本（如 `add_credits.ts`、`check-users.ts` 等数据维护脚本）
- 不删除唯一的真实测试文件（`src/lib/utils/__tests__/markdown-sections.test.ts`）
- 不重构代码结构

## Decisions

**决策 1：直接删除，不归档**
- 选择：直接删除文件，不移动到归档目录
- 理由：这些文件已在 Git 历史中存在，需要时可通过 `git log` 恢复；维护归档目录增加复杂度无实际价值

**决策 2：`scripts/` 中保留数据维护脚本**
- 保留：`add_credits.ts`、`check-users.ts`、`force-fix-pwd.ts`、`force-reset-pwd.ts`、`sync-costs.ts`、`backup-jack.ts`、`create-mock-article.ts` 等有实际数据库操作价值的脚本
- 删除：所有 `test-*.ts`、`verify-*.ts`、`perf-test.ts`、`pressure-test-*.ts`、`list-*.ts`、`baseline-*.ts`、`reproduce-*.ts`、`peek-otp.ts`、`debug_*.ts`、`golden-hash-fix.ts`、`check-skills.ts`、`test-serp-direct.sh`

**决策 3：根目录脚本的处理**
- `add_credits.ts`（根目录）：与 `scripts/add_credits.ts` 重复，直接删除根目录版本
- `check-db-debug.ts`、`check_users.js`、`get_otp.ts`：一次性调试工具，直接删除

## Risks / Trade-offs

- [风险] 某个被删除的脚本实际上还在被其他开发者使用 → 缓解：所有文件在 Git 历史中保留，可随时恢复；仅删除明显一次性的 test-/verify- 前缀文件
- [风险] `scripts/` 中某些脚本被 `package.json` 的 npm scripts 引用 → 缓解：删除前检查 `package.json` 引用
