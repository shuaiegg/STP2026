## 1. Schema + 迁移(先确认环境)

- [x] 1.1 `prisma/schema.prisma`:`TrackedArticle += siteId String?`(@@index)+ `sourcePillar String?`
- [x] 1.2 迁移 `20260628120000_tracked_article_site_pillar` 已 `migrate deploy` 应用到生产库(用户确认后);`prisma generate` 完成;运行时按 siteId 查询验证通过

## 2. 关联:草稿 ↔ 支柱 ↔ 站点

- [x] 2.1 `saveTrackedArticle` 入参 + 写入 `siteId` / `sourcePillar`(可空,旧调用兼容)
- [x] 2.2 蓝图"开始写作"link 透传 siteId(已带 keyword=topic);geo-writer 读取并在保存时回传
- [x] 2.3 匹配工具:支柱"已起草" ⇔ 该 site 存在 TrackedArticle(优先 sourcePillar 精确,回退 keywords/title 归一化包含)

## 3. A · 草稿感知加冕

- [x] 3.1 `home.ts` 蓝图:为每支柱计算状态(未覆盖 / 已起草 / 待验证 / 已验证),`crownedTopic` 仅从"未覆盖且无草稿"中选
- [x] 3.2 保证"无草稿时"加冕与现状一致(回归)
- [x] 3.3 `ContentAssetBlueprint.tsx`:三态徽章 + 已起草支柱显示"去发布并回填 URL"CTA

## 4. C · URL 回填 + 验证

- [x] 4.1 新 action `backfillArticleUrl(articleId, url)`:校验归属 + URL 合法 → 写 `url`,status 保持 PENDING
- [x] 4.2 入口:草稿生成成功后提示 + library 文章行 + 蓝图已起草支柱 CTA
- [x] 4.3 文案诚实:"发布后回填 URL → 验证 Google 搜索收录/排名";不提"AI 引用/实时 AI 监测"
- [x] 4.4 library 显示验证状态(PENDING/CHECKING/已收录排名/未收录),复用 citation-honesty 后的状态文案
- [x] 4.5 确认 cron `/api/cron/verify` 对回填 url 正常工作(无需改算法)

## 5. #2 · 计划语言

- [x] 5.1 `strategy/generate`:`localeDirective(latestOntology.sourceLocale ?? session.user.locale)`
- [x] 5.2 文章 `language: art.language || latestOntology.sourceLocale || session.user.locale || 'en'`(去 zh 偏置)

## 6. i18n + 文案

- [x] 6.1 新增/调整文案进 messages(en/zh,中文用「您」,诚实措辞)

## 7. 验证

- [x] 7.1 `npx tsc --noEmit`(仅允许既有 auth.ts 已知 TS 错误),零新增
- [ ] 7.2 加冕推进:加冕支柱 → 写草稿 → 加冕换到下一个;无草稿站点加冕不变(回归)
- [ ] 7.3 回填:草稿 → 回填 URL → library 显示"验证中" → (cron/手动触发)状态更新
- [ ] 7.4 三态正确:已起草 ≠ 已验证(不出现虚假"已覆盖")
- [ ] 7.5 #2:英文站(sourceLocale=en)中文 UI 用户一键生成 → 计划为英文
- [ ] 7.6 i18n-auditor(蓝图/library/公开文案)+ design-checker(三态徽章/回填 UI)
- [x] 7.7 更新 BACKLOG.md(已闭项 + future items)映射原语(用户回填)」;远期项(GSC 自动匹配 / 直连 CMS / 真 GEO)保留
