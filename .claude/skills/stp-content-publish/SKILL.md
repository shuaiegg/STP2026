---
name: stp-content-publish
description: 验证内容发布工作流是否正确执行。传入 slug 和 locale（如 "my-article en" 或 "my-article zh"），逐项检查缓存失效、路径可访问和 sitemap 更新。
disable-model-invocation: true
---

验证内容发布工作流。参数（slug + locale）：$ARGUMENTS

## 检查步骤

1. **DB 状态验证**
   确认 Content 记录的字段：
   - `visibility` = `PUBLIC`
   - `publishedAt` 不为 null
   - `status` = `PUBLISHED`
   
   如有问题，检查 `src/app/actions/content.ts` 中 `updateContentMetadata` 的发布逻辑

2. **缓存失效验证**
   确认 `revalidateContentPaths()` 已在发布流程中被调用：
   - 检查 `src/lib/cache.ts` 或 `src/app/actions/content.ts` 中 `revalidateContentPaths` 的调用点
   - 确认 `revalidateTag('public-content')` 已执行（这是数据层缓存的 bust key）

3. **路径可访问验证**
   本地验证（需 dev server 运行）：
   - 英文：`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/blog/<slug>`
   - 中文：`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/zh/blog/<slug>`
   预期返回 200。如返回 404，排查原因（slug 拼写、locale 参数、visibility 状态）

4. **Sitemap 验证**
   `curl -s http://localhost:3000/sitemap.xml | grep <slug>`
   确认 slug 出现在 sitemap 中

5. **双语版本验证**（如有 translationGroupId）
   如果文章有关联的另一语言版本，验证两个版本均可访问且 hreflang 正确

6. **GEO 追踪确认**
   发布触发 `upsertTrackedArticleFromContent`，创建 TrackedArticle（status=PENDING）
   确认该记录已创建（可查 DB 或日志）

## 常见问题

- **文章 404**：确认 `revalidatePath` 和 `revalidateTag('public-content')` 都执行了
- **旧内容仍显示**：ISR 缓存（homepage 1h，blog index 30min）可能未失效，手动触发 revalidate
- **sitemap 没更新**：sitemap 是动态生成的，应该即时反映，如有问题检查 `src/app/sitemap.ts`
