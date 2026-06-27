# Prisma / DB — 局部约定

> ⚠️ `DATABASE_URL` 指向**生产** PostgreSQL（自托管 VPS `154.12.243.94:54320`），不是本地库。所有迁移都直接打到生产，务必先确认。

## 破坏性操作必须先确认（PreToolUse hook 会拦截）

`prisma migrate` / `prisma db push` / `DROP` / `TRUNCATE` 被 Bash hook `exit 2` 拦截。先向用户确认 dev/prod，再手动运行。

## 迁移纪律：用 migrate，别用 db push

历史上 `db push` 造成过 schema 漂移，需用 shadow Postgres + `migrate resolve --applied` 补基线。今后：
- 改 schema → `prisma migrate dev`（生成迁移文件）→ `prisma generate`
- 生产 → `prisma migrate deploy`
- **不要**再用 `db push` 改生产

## CLI 只读 `.env`

Prisma CLI 不读 `.env.local`。迁移前确保 `DATABASE_URL_DIRECT` 在 `.env` 里（直连，非连接池）。

## 改完 schema 的完整链路

1. 改 `schema.prisma`
2. `prisma migrate dev`（确认后）
3. `prisma generate`
4. 更新对应 server action / admin 表单
5. 重启 dev server

> 复杂工作流可用 `/stp-db-migrate` 技能（已设 `disable-model-invocation`，需手动触发）。
