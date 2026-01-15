# STP2026 (ScaletoTop) 部署与接入指南

本指南详细介绍了如何从零开始部署 STP2026 项目，并完成 Notion CMS 的闭环接入。

## 1. 环境变量配置 (.env)

在本地开发或生产环境（如 Vercel）中，需配置以下核心环境变量：

### 数据库 (Supabase PostgreSQL)
*   `DATABASE_URL`: 连接池地址（通常用于服务端运行）。
*   `DATABASE_URL_DIRECT`: 直连地址（用于 Prisma 迁移 `prisma migrate`）。

### Supabase 存储与 API
*   `NEXT_PUBLIC_SUPABASE_URL`: Supabase 项目 URL。
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 客户端匿名访问 Key。
*   `SUPABASE_SERVICE_ROLE_KEY`: 服务端管理员 Key（用于绕过 RLS 上传 Notion 图片）。

### Notion CMS
*   `NOTION_API_KEY`: Notion 机器人集成 Token。
*   `NOTION_DATABASE_ID`: 用于存储文章的 Notion 数据库 ID。

---

## 2. Notion 数据库设置

为了使同步引擎正常工作，你的 Notion 数据库必须包含以下属性（注意大小写）：

| 属性名称 | 类型 | 说明 |
| :--- | :--- | :--- |
| **Title** | Title | 文章主标题 |
| **Slug** | Text | URL 路径名（如 `my-first-post`）。**必填** |
| **Status** | Select | 必须包含 `Ready` 选项。只有 `Ready` 状态的文章会被同步。 |
| **Category** | Select | 对应项目中的分类名称（如 `SEO 增长`）。 |
| **Summary** | Text | 文章摘要（用于列表页展示）。 |
| **Cover** | Files & media | （可选）文章封面图。若为空，同步引擎会尝试抓取 Notion 页面本身的 Cover。 |

**重要操作：**
1. 在 Notion 中创建一个 Integration (机器人)。
2. 将该机器人添加到你的数据库页面中（Connect to）。
3. 复制数据库 ID：URL 中 `notion.so/` 之后到 `?v=` 之前的那串字符。

---

## 3. Supabase 配置

### 数据库初始化
运行以下命令以在 Supabase 中创建表结构：
```bash
npx prisma db push
```

### 存储桶 (Storage Bucket)
1. 在 Supabase Dashboard 中创建一个名为 `media` 的 **Public** 存储桶。
2. 为该存储桶添加以下 RLS 策略（或者在开发阶段设为完全公开）：
    *   允许管理员或对应的 Service Role Key 进行 `INSERT` 和 `SELECT` 操作。

---

## 4. 部署流程 (Vercel)

1.  **关联仓库**：在 Vercel 中导入你的 STP2026 GitHub 仓库。
2.  **配置变量**：将上述 `.env` 中的所有变量填入 Vercel 的 Environment Variables 选项卡。
3.  **构建命令**：
    *   Build Command: `npx prisma generate && next build`
    *   Install Command: `npm install`
4.  **重要提示**：当前项目使用 Prisma **v5.22.0** 以确保在 Next.js Turbopack 环境下的稳定性。

---

## 5. 内容同步触发

本项目支持两种同步内容的方式：

### A. 手动全量同步 (Server Action)
在代码中可以调用 `syncAllContent()`。你可以创建一个管理工具页面，添加一个按钮来触发：
```typescript
import { syncAllContent } from '@/app/actions/sync';

// 在 Client Component 中调用
const handleSync = async () => {
  const result = await syncAllContent();
  alert(result.message);
};
```

### B. 定时任务 (Cron Jobs)
如果你部署在 Vercel，可以在 `vercel.json` 中配置 Cron 任务，定期请求一个触发同步的 API 路由：
```json
{
  "crons": [
    {
      "path": "/api/sync/all",
      "schedule": "0 * * * *" 
    }
  ]
}
```

---

## 6. 常见问题 (FAQ)

*   **同步失败：图片无法同步**：请检查 `SUPABASE_SERVICE_ROLE_KEY` 是否正确，以及 `media` 存储桶是否存在且为 Public。
*   **同步后页面不更新**：同步完成后，系统会自动调用 `revalidatePath('/blog')`。如果仍不刷新，请检查 Edge Cache 或 CDN 配置。
*   **分类无法匹配**：分类是预先定义的，同步时会查找名称匹配的已有分类，不会自动创建新分类。
