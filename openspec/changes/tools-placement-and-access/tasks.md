## 1. geo-writer 搬进 dashboard

- [ ] 1.1 抽 geo-writer 为共享组件;`(protected)/dashboard/tools/geo-writer/page.tsx` 在 DashboardShell 内挂载
- [ ] 1.2 siteId 从仪表盘站点上下文/选择器取;**删除"目标网站域名"文本框 + form.siteId**(keyword/pillar/plannedArticleId 仍可经 query)
- [ ] 1.3 locale 跟 User.locale;dashboard 版 Link 用 next/link;保留已修的 DNA 注入/内链/闭环逻辑(siteId 改上下文来源)
- [ ] 1.4 "保存为博客草稿"按钮仅 admin 可见

## 2. /tools 营销页

- [ ] 2.1 `(public)/tools/page.tsx` 改为营销页(用 copywriting 技能 + product-marketing 上下文):各能力一段、诚实、CTA→注册/免费审计
- [ ] 2.2 移除/标注未实现工具(无死链);文案进 messages(en/zh,用「您」)

## 3. 入口迁移 + 重定向

- [ ] 3.1 站内改链(蓝图×3、策略板、library、registry、dashboard/tools)→ `/dashboard/tools/geo-writer?...`(保留参数)
- [ ] 3.2 邮件模板×2 + 咨询表单 → 营销页或登录(未登录收件人友好)
- [ ] 3.3 `middleware.ts`:`/tools/geo-writer`(+ /zh)301 → /tools 或 /login
- [ ] 3.4 全量 `grep tools/geo-writer` 确认无残留旧链

## 4. 用户视图清理

- [ ] 4.1 内容库编辑保存文案 "提交修改并入库" → "保存"(messages)

## 5. 验证

- [ ] 5.1 `npx tsc --noEmit` 仅剩 1 预存 auth.ts 错误,零新增
- [ ] 5.2 各入口冒烟:蓝图/策略板/library/onboarding 首跑 → 仪表盘内打开 geo-writer,闭环不跳出
- [ ] 5.3 siteId 上下文化后:DNA 注入/内链/加冕连接仍正确(回归)
- [ ] 5.4 /tools 营销页无死链;旧 /tools/geo-writer 301 不 404
- [ ] 5.5 普通用户看不到博客草稿按钮;库保存文案为"保存"
- [ ] 5.6 i18n-auditor(营销页/dashboard geo-writer)+ design-checker
- [ ] 5.7 更新 backlog:勾本期项;保留 deferred(订阅闸/其它工具实现/邮件落地细化)
