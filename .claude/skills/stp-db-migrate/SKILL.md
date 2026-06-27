---
name: stp-db-migrate
description: 执行 STP2026 Prisma 数据库迁移完整工作流。在修改 prisma/schema.prisma 后调用，确保不遗漏步骤。
disable-model-invocation: true
---

执行 Prisma 数据库迁移工作流。变更描述：$ARGUMENTS

## 步骤

1. **确认变更范围**
   运行 `git diff prisma/schema.prisma` 查看 schema 改动

2. **确认环境**
   向用户明确询问：
   - 开发环境（本地） → 使用 `npx prisma db push`（快速，无 migration 文件）
   - 生产/准生产 → 使用 `npx prisma migrate dev`（生成 migration 文件，可版本控制）
   
   ⚠️ 不经确认不得自行运行迁移命令

3. **执行迁移**（用户确认后）
   - dev: `npx prisma db push`
   - prod: `npx prisma migrate dev --name <描述性名称>`

4. **重新生成 Prisma Client**
   ```bash
   npx prisma generate
   ```

5. **提示重启 dev server**
   Prisma Client 更新后需重启才能生效：
   > 请手动重启 dev server（Ctrl+C → `npm run dev`）或确认已在生产构建中

6. **验证新字段可访问**
   在相关的 Server Action 或 API route 中快速验证新字段：
   - 用 Prisma Studio（`npx prisma studio`）直接检查数据
   - 或在 action 中临时 console.log 确认字段存在

## 注意事项

- `db push` 可能在有数据的列上发出 warning，遇到 warning 必须告知用户
- 生产环境的 `migrate dev` 需要 `DATABASE_URL_DIRECT`（直连，非 pool），确认 .env 已配置
- 不要跳过 `prisma generate`，否则代码里访问新字段会有 TypeScript 类型错误
