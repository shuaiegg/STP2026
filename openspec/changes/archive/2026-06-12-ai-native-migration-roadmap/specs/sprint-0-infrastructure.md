# Sprint 0 — 基础设施迁移规格

## 目标架构

```
Coolify 管理的 Docker 服务：

scaletotop (Next.js)
    ↓ DATABASE_URL (内网)
postgres (pgvector/pgvector:pg17)
    port 5432，仅内网

scaletotop (Next.js)
    ↓ MINIO_ENDPOINT (内网 or 自定义域名)
minio
    port 9000 (S3 API) — 内网 + 可选公网
    port 9001 (Console) — 仅内网

已有服务（不变）：
n8n, CLIProxyAPI, Traefik
```

## 环境变量变化

**新增**：
```bash
MINIO_ENDPOINT=http://minio:9000          # 内网地址（容器名）
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET=media
MINIO_PUBLIC_URL=https://media.scaletotop.com  # 公开访问 URL（配置 Traefik）
```

**删除**：
```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

**修改**：
```bash
DATABASE_URL=postgresql://user:pass@postgres:5432/scaletotop
DATABASE_URL_DIRECT=postgresql://user:pass@postgres:5432/scaletotop
```

## storage.ts 新实现要点

```typescript
// src/lib/storage.ts — 关键改动点
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: 'us-east-1',           // MinIO 忽略 region，但 SDK 要求填写
  forcePathStyle: true,           // MinIO 必须：用路径而非子域名
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
});

// 公开 URL 用 MINIO_PUBLIC_URL 拼接（不用 SDK getSignedUrl）
const publicUrl = `${process.env.MINIO_PUBLIC_URL}/${bucket}/${storagePath}`;
```

## contentMd URL 替换 SQL

```sql
-- 先确认受影响行数
SELECT COUNT(*) FROM "Content"
WHERE "contentMd" LIKE '%supabase.co%';

-- 执行替换（先在测试环境验证）
UPDATE "Content"
SET "contentMd" = REPLACE(
  "contentMd",
  'https://[project-ref].supabase.co/storage/v1/object/public/media',
  'https://media.scaletotop.com/media'
)
WHERE "contentMd" LIKE '%supabase.co%';

-- 同步替换 Media 表
UPDATE "Media"
SET "storageUrl" = REPLACE(
  "storageUrl",
  'https://[project-ref].supabase.co/storage/v1/object/public/media',
  'https://media.scaletotop.com/media'
);
```

## MinIO 公开 URL 方案

MinIO `media` bucket 设置为公开读后，有两种 URL 方案：

**方案 A（推荐）**：通过 Traefik 配置子域名 `media.scaletotop.com` 反代到 MinIO，公开 URL 格式为 `https://media.scaletotop.com/media/uploads/...`

**方案 B（简单）**：MinIO 直接暴露端口 9000，公开 URL 为 `https://yourserver.com:9000/media/uploads/...`（不美观，不推荐生产使用）

建议选 A，与 Traefik 集成更好，URL 更干净。
