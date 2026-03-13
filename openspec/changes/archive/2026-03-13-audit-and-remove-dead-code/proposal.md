## Why

随着项目迭代，代码库中积累了大量一次性调试脚本、测试文件和冗余文件，这些文件分散在 `scripts/`、`src/` 内部、项目根目录和 `tmp/` 目录中，增加了维护负担并污染了代码结构。本次清理旨在删除这些无用文件，保持代码库整洁。

## What Changes

- **删除 `src/` 内部的测试文件**：`src/lib/skills/site-intelligence/` 下的 4 个测试/验证脚本（`test-crawler.ts`, `test-core.ts`, `test-crawler-raw.js`, `quick-verify.js`）从生产源码目录中删除
- **删除根目录散落的调试脚本**：项目根目录下的 5 个一次性工具脚本（`add_credits.ts`, `check-db-debug.ts`, `check_users.js`, `get_otp.ts`）删除或移至 `scripts/`
- **删除 `tmp/` 目录**：临时目录中的 2 个测试文件（`test-image-insertion.ts`, `verify-audits.ts`）
- **删除备份文件**：`src/app/favicon.ico.bak`
- **清理 `scripts/` 目录**：删除已明确过时的一次性调试脚本（如 `test-*.ts`, `verify-*.ts`），保留仍有维护价值的工具脚本

## Capabilities

### New Capabilities
<!-- 本次为纯清理变更，无新增能力 -->

### Modified Capabilities
<!-- 本次为纯清理变更，不涉及行为变更 -->

## Impact

- **无功能影响**：所有删除的文件均为开发/调试工具，不参与应用构建
- **影响目录**：`scripts/`、`src/lib/skills/site-intelligence/`、项目根目录、`tmp/`、`src/app/`
- **无 API/数据库变更**
