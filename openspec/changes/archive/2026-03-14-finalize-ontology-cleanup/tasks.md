## 1. 确认历史数据安全

- [x] 1.1 在数据库执行 `SELECT COUNT(*) FROM "Site" WHERE "businessOntology" IS NOT NULL`，记录影响行数
- [x] 1.2 如影响行数 > 0，运行 `npx tsx scripts/migrate-ontology.ts` 补跑历史数据迁移，确认 SiteOntology / SemanticDebt 表中有对应记录

## 2. 删除废弃 DB 字段

- [x] 2.1 在 `prisma/schema.prisma` 中删除 `Site` 模型的 `businessOntology Json?` 字段（含 `@deprecated` 注释行）
- [x] 2.2 运行 `npx prisma migrate dev --name remove-site-business-ontology-field`
- [x] 2.3 运行 `npx prisma generate` 更新客户端类型

## 3. 修正 semantic-gap API 响应 key

- [x] 3.1 在 `semantic-gap/route.ts` 的缓存命中分支（约第 47 行）将 `businessOntology: latestOntology` 改为 `ontology: latestOntology`
- [x] 3.2 在 `semantic-gap/route.ts` 的正常返回分支（约第 241 行）同样改名

## 4. 更新 OverviewPanel 读取 key

- [x] 4.1 在 `OverviewPanel.tsx` 中将 `semanticData?.businessOntology` 改为 `semanticData?.ontology`（共 3 处：第 185、194、200 行）

## 5. 收尾验证

- [x] 5.1 全局搜索 `businessOntology`，确认 `src/` 目录下无残留引用
- [x] 5.2 运行 `npm run build`，确认无 TypeScript 编译错误
