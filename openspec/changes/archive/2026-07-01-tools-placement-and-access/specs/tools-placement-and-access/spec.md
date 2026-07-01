## ADDED Requirements

### Requirement: 生产工具在仪表盘内运行

geo-writer SHALL 在登录后的仪表盘内(`/dashboard/tools/geo-writer`,DashboardShell 内)运行,使"诊断→写作→存库→衡量"无需跳出 shell。siteId SHALL 从仪表盘站点上下文/选择器获取(用户已登录、已有站点),系统 MUST NOT 再依赖"目标网站域名"文本框或把域名当作 siteId。

#### Scenario: shell 内闭环

- **WHEN** 用户从蓝图/策略板"开始写作"
- **THEN** 在仪表盘内打开 geo-writer(有侧边栏),写完保存就地回到内容库,无 dashboard→公共→dashboard 的跳转

#### Scenario: siteId 来自上下文

- **WHEN** 在仪表盘写作并保存
- **THEN** siteId 来自当前站点上下文(非域名文本框),DNA 注入/内链/闭环连接据此正确

### Requirement: 公共 /tools 为纯营销页(无死链)

公共 `/tools` SHALL 是营销页:介绍各能力(诚实、结果导向),CTA 引导注册/免费审计。它 MUST NOT 内嵌可运行的付费工具,且 MUST NOT 出现指向不存在工具的死链(未实现的标"即将推出"或移除)。

#### Scenario: 营销页无死链

- **WHEN** 访客浏览 /tools
- **THEN** 看到能力介绍 + 注册 CTA;不存在指向 404 的工具链接

### Requirement: 入口迁移与旧链重定向

所有站内指向旧公共 geo-writer 的入口 SHALL 改为仪表盘位置;面向未登录收件人的邮件/营销入口 SHALL 指向营销页或登录。旧 URL `/tools/geo-writer`(含 `/zh/`)SHALL 301 重定向,不产生断链。

#### Scenario: 站内入口正确

- **WHEN** 点击蓝图/策略板/内容库/registry 的写作入口
- **THEN** 进入 `/dashboard/tools/geo-writer`(保留 keyword/pillar/plannedArticleId 参数),不再跳公共页

#### Scenario: 旧链 301

- **WHEN** 访问旧 `/tools/geo-writer` 或 `/zh/tools/geo-writer`
- **THEN** 301 重定向到营销页或登录,不 404

### Requirement: 用户视图清理

内容库编辑的保存操作文案 SHALL 为"保存"(不暴露"入库"等内部黑话)。geo-writer 的"保存为博客草稿"(ADMIN-only)SHALL 仅对 admin 可见,普通用户视图隐藏。

#### Scenario: 普通用户看不到管理员功能

- **WHEN** 普通用户使用 geo-writer
- **THEN** 看不到"保存为博客草稿"按钮(避免点击得到 401)

#### Scenario: 保存文案清晰

- **WHEN** 用户在内容库编辑文章
- **THEN** 保存按钮为"保存",不出现"提交修改并入库"这类内部术语
