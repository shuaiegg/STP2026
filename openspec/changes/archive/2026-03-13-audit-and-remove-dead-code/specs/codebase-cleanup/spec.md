## ADDED Requirements

### Requirement: src 目录不含测试或调试文件
生产源码目录 `src/` 中 SHALL NOT 包含任何测试脚本、调试脚本或一次性验证文件。测试文件须位于 `__tests__/` 目录下并使用 Vitest 框架。

#### Scenario: src 内无散落测试文件
- **WHEN** 检查 `src/` 目录（不含 `__tests__/` 子目录）
- **THEN** 不存在以 `test-`、`quick-`、`verify-` 开头的 `.ts`/`.js` 文件

### Requirement: 项目根目录无散落脚本
项目根目录 SHALL NOT 包含任何 `.ts` 或 `.js` 脚本文件（`vitest.config.ts` 除外，属于工具配置）。所有开发工具脚本须集中在 `scripts/` 目录中。

#### Scenario: 根目录无 ts/js 脚本
- **WHEN** 列出项目根目录中的 `.ts` 和 `.js` 文件
- **THEN** 仅存在配置文件（`next.config.ts`、`vitest.config.ts`、`tailwind.config.ts` 等），不存在 `add_credits.ts`、`check-db-debug.ts`、`check_users.js`、`get_otp.ts` 等

### Requirement: 无 tmp 目录
`tmp/` 目录 SHALL NOT 存在于项目根目录中。

#### Scenario: tmp 目录已删除
- **WHEN** 检查项目根目录
- **THEN** 不存在 `tmp/` 目录

### Requirement: 无备份文件
`src/` 目录中 SHALL NOT 包含以 `.bak` 结尾的备份文件。

#### Scenario: 备份文件已删除
- **WHEN** 在 `src/` 目录中搜索 `*.bak` 文件
- **THEN** 未找到任何 `.bak` 文件
