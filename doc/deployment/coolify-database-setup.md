# Coolify 生产数据库部署指南

> **目标架构**
> - 开发环境：Supabase Cloud（现有项目保持不变）
> - 生产环境：Coolify 自托管 PostgreSQL + PgBouncer
> - 图片存储：Cloudflare R2（替换 Supabase Storage）
> - 备份目标：Cloudflare R2

---

## 前置条件

- Coolify 已安装并可访问管理面板
- 域名 `scaletotop.com` 已接入 Cloudflare
- 有服务器 SSH 访问权限
- 本地已安装 `psql` 客户端（用于验证连接）

---

## 第一阶段：Coolify 部署 PostgreSQL

### 步骤 1：创建 PostgreSQL 服务

1. 登录 Coolify 管理面板
2. 进入目标 **Server** → **Resources** → 点击 **+ New Resource**
3. 选择 **Database** → **PostgreSQL**
4. 填写配置：

   | 字段 | 值 |
   |------|-----|
   | Name | `stp2026-postgres` |
   | PostgreSQL Version | `16`（与 Supabase 保持一致） |
   | Database Name | `stp2026` |
   | Database User | `stp_app`（不要用 postgres 超级用户） |
   | Database Password | 点击"Generate"自动生成（32位随机） |

5. **Network 设置**：
   - 确保 **不勾选** "Make it publicly accessible"
   - 记下生成的内网连接地址，格式类似：`postgresql://stp_app:[password]@[service-name]:5432/stp2026`

6. 点击 **Deploy**，等待容器启动（约 30 秒）

### 步骤 2：记录连接信息

部署完成后，在服务详情页找到并记录以下信息（之后配置 PgBouncer 和应用会用到）：

```
Host（内网）:  stp2026-postgres  （Coolify 内部服务名）
Port:          5432
Database:      stp2026
User:          stp_app
Password:      [Coolify 生成的密码，复制保存到安全位置]
```

> **重要**：密码只在创建时显示完整内容，请立即复制保存到密码管理器（1Password / Bitwarden 等）。

---

## 第二阶段：部署 PgBouncer

Prisma + Next.js 会频繁创建数据库连接，PgBouncer 做连接池是必须的。

### 步骤 3：创建 PgBouncer 服务

1. Coolify → **+ New Resource** → **Docker Compose**（或搜索 PgBouncer）
2. 使用以下 Docker Compose 配置：

```yaml
services:
  pgbouncer:
    image: bitnami/pgbouncer:latest
    environment:
      POSTGRESQL_HOST: stp2026-postgres    # 与 PostgreSQL 服务名一致
      POSTGRESQL_PORT: 5432
      POSTGRESQL_DATABASE: stp2026
      POSTGRESQL_USERNAME: stp_app
      POSTGRESQL_PASSWORD: [your-db-password]
      PGBOUNCER_DATABASE: stp2026
      PGBOUNCER_POOL_MODE: transaction      # Prisma 必须用 transaction mode
      PGBOUNCER_MAX_CLIENT_CONN: 100
      PGBOUNCER_DEFAULT_POOL_SIZE: 20
      PGBOUNCER_AUTH_TYPE: scram-sha-256
    restart: unless-stopped
```

3. **Network 设置**：同样不对外暴露端口，内网 only
4. 点击 **Deploy**

### 步骤 4：验证 PgBouncer 连接

在服务器上通过 SSH 执行（需要 psql）：

```bash
psql "postgresql://stp_app:[password]@pgbouncer-service-name:5432/stp2026" -c "SELECT 1;"
```

返回 `1` 即表示连接正常。

---

## 第三阶段：初始化数据库 Schema

### 步骤 5：运行 Prisma Migrate

在本地终端，**临时**将 `DATABASE_URL_DIRECT` 指向生产库（仅此一次用于初始化），然后执行：

```bash
# 临时设置（仅在本地终端，不要写入任何文件）
export DATABASE_URL_DIRECT="postgresql://stp_app:[password]@[coolify-server-ip]:[exposed-port]/stp2026"

# 部署所有 migrations
npx prisma migrate deploy

# 完成后立即取消
unset DATABASE_URL_DIRECT
```

> **注意**：初始化时需要临时暴露 PostgreSQL 端口用于外部访问，操作完成后立即在 Coolify 里关闭公开访问。

**更推荐的方式（无需暴露端口）**：

在 Coolify 的 Next.js 生产应用里，将 Build Command 改为：

```bash
npx prisma generate && npx prisma migrate deploy && next build
```

这样每次部署时，应用容器在同一内网直接执行迁移，不需要对外暴露数据库端口。

### 步骤 6：配置生产环境变量

在 Coolify 的 Next.js 应用服务 → **Environment Variables** 里添加：

```bash
# 数据库连接（走 PgBouncer）
DATABASE_URL=postgresql://stp_app:[password]@pgbouncer-service-name:5432/stp2026?pgbouncer=true&connection_limit=1

# 数据库直连（仅用于 prisma migrate deploy，不走 PgBouncer）
DATABASE_URL_DIRECT=postgresql://stp_app:[password]@stp2026-postgres:5432/stp2026
```

> **关键**：`DATABASE_URL` 末尾的 `?pgbouncer=true&connection_limit=1` 是 Prisma 与 PgBouncer 配合的必要参数，缺少会导致连接错误。

---

## 第四阶段：配置 Cloudflare R2 存储

### 步骤 7：创建 R2 Bucket

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单 → **R2 Object Storage** → **Create bucket**
3. Bucket 名称：`stp2026-media`
4. Location：选择 **Automatic**（Cloudflare 自动选择最优区域）
5. 点击 **Create bucket**

### 步骤 8：绑定自定义域名

1. 进入 `stp2026-media` bucket → **Settings** → **Custom Domains**
2. 点击 **Connect Domain**
3. 输入：`media.scaletotop.com`
4. Cloudflare 会自动在 DNS 创建 CNAME 记录并启用 CDN

完成后，图片将通过 `https://media.scaletotop.com/[path]` 访问。

### 步骤 9：创建 R2 API Token

1. Cloudflare Dashboard → **R2** → **Manage R2 API Tokens**
2. 点击 **Create API Token**
3. 配置：
   - Token Name：`stp2026-production`
   - Permissions：**Object Read & Write**
   - Specify bucket：选择 `stp2026-media`
4. 创建后记录：
   - `Access Key ID`
   - `Secret Access Key`
   - `Endpoint URL`（格式：`https://[account-id].r2.cloudflarestorage.com`）

### 步骤 10：更新 storage.ts

将 `src/lib/storage.ts` 中的 Supabase Storage client 替换为 S3 兼容的 R2 client：

```typescript
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!; // https://media.scaletotop.com

export async function uploadImageFromUrl(
  imageUrl: string,
  options: { notionBlockId?: string } = {}
): Promise<{ mediaId: string; storageUrl: string; storagePath: string }> {
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || 'image/jpeg';

  const ext = contentType.split('/')[1] || 'jpg';
  const fileName = options.notionBlockId
    ? `notion/${options.notionBlockId}.${ext}`
    : `uploads/${Date.now()}.${ext}`;

  await r2Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: Buffer.from(buffer),
    ContentType: contentType,
  }));

  const storageUrl = `${PUBLIC_URL}/${fileName}`;

  return {
    mediaId: options.notionBlockId || fileName,
    storageUrl,
    storagePath: fileName,
  };
}
```

安装依赖：

```bash
npm install @aws-sdk/client-s3
```

### 步骤 11：添加 R2 环境变量

在 Coolify 生产应用的环境变量中添加：

```bash
R2_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=[your-access-key-id]
R2_SECRET_ACCESS_KEY=[your-secret-access-key]
R2_BUCKET_NAME=stp2026-media
R2_PUBLIC_URL=https://media.scaletotop.com
```

本地 `.env.local` 继续保留 Supabase Storage 相关变量，开发时走 Supabase，生产走 R2。

---

## 第五阶段：配置自动备份

### 步骤 12：创建备份专用 R2 Bucket

1. R2 → **Create bucket** → 名称：`stp2026-backups`
2. 这个 bucket **不需要**绑定自定义域名（不对外公开访问）
3. 使用同一个 API Token 即可（已有 Object Read & Write 权限）

### 步骤 13：配置 Coolify 数据库备份

1. 进入 `stp2026-postgres` 服务 → **Backups**
2. 启用自动备份，配置：

   | 字段 | 值 |
   |------|-----|
   | S3 Endpoint | `https://[account-id].r2.cloudflarestorage.com` |
   | S3 Bucket | `stp2026-backups` |
   | S3 Access Key | [R2 Access Key ID] |
   | S3 Secret Key | [R2 Secret Access Key] |
   | Frequency | `0 3 * * *`（每天凌晨 3 点，UTC） |
   | Retention | `7`（保留 7 天） |

3. 点击 **Save** 后，手动触发一次备份验证配置是否正确

---

## 第六阶段：验收与切流量

### 步骤 14：端到端验收清单

在正式切换之前，逐项确认：

- [ ] PostgreSQL 容器状态为 **Running**
- [ ] PgBouncer 容器状态为 **Running**
- [ ] `prisma migrate deploy` 执行成功，所有 migrations 已应用
- [ ] Next.js 生产应用能正常启动（查看 Coolify 日志无数据库连接报错）
- [ ] 登录功能正常（better-auth 能写入 session）
- [ ] 进入 `/admin/sync` 触发一次 Notion Sync，确认内容同步成功
- [ ] 同步后图片能通过 `https://media.scaletotop.com/...` 正常访问
- [ ] 手动触发一次 R2 备份，在 Cloudflare 控制台确认备份文件存在

### 步骤 15：移除 Supabase 依赖（迁移完成后）

确认生产环境稳定运行 **7 天**后，执行清理：

1. 从 Coolify 生产环境变量中删除：
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ```

2. 从 `package.json` 移除（如果 `@supabase/supabase-js` 已无其他用途）：
   ```bash
   npm uninstall @supabase/supabase-js
   ```

3. 全局搜索确认无残留引用：
   ```bash
   grep -r "supabase" src/ --include="*.ts" --include="*.tsx"
   ```

4. Supabase Cloud 项目**保留**用于开发环境，不要删除。

---

## 日常运维参考

### 数据库维护窗口操作

```bash
# 查看当前连接数（通过 Coolify 终端或 SSH 执行）
psql $DATABASE_URL_DIRECT -c "SELECT count(*) FROM pg_stat_activity;"

# 查看慢查询
psql $DATABASE_URL_DIRECT -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# 手动触发备份（Coolify 面板操作）
# stp2026-postgres → Backups → Run Now
```

### Schema 变更标准流程

```bash
# 1. 本地开发（操作 Supabase dev 库）
npx prisma migrate dev --name describe_your_change

# 2. 提交 migration 文件到 git
git add prisma/migrations/
git commit -m "feat: add [field] to [model]"

# 3. 推送到生产（Coolify 自动 build，执行 prisma migrate deploy）
git push origin main
```

### 磁盘使用监控

```bash
# SSH 到服务器查看磁盘使用
df -h

# 查看 Docker 占用
docker system df

# 清理未使用的 Docker 镜像（谨慎执行）
docker image prune -f
```

---

## 关键配置汇总

| 配置项 | 开发环境 | 生产环境 |
|--------|---------|---------|
| 数据库 | Supabase Cloud | Coolify PostgreSQL 16 |
| 连接池 | Supabase 内置 | PgBouncer (transaction mode) |
| 图片存储 | Supabase Storage | Cloudflare R2 |
| 图片域名 | Supabase CDN URL | `media.scaletotop.com` |
| 备份 | Supabase 自动备份 | Coolify → R2（每日 3 点） |
| Schema 变更 | `prisma migrate dev` | `prisma migrate deploy`（自动） |
| 环境变量文件 | `.env.local`（不提交 git） | Coolify 面板配置 |
