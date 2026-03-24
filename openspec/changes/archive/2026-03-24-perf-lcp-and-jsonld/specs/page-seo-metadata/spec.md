## ADDED Requirements

### Requirement: seoMeta.schemaJson 在博客文章页渲染输出
博客文章页 SHALL 读取 `post.seoMeta.schemaJson` 并在 HTML 中输出为 `<script type="application/ld+json">`，使管理员在 admin 界面配置的自定义 schema 生效。

#### Scenario: 已配置 schemaJson 的文章
- **WHEN** 爬虫抓取一篇 `seoMeta.schemaJson` 非空的博客文章
- **THEN** HTML 源码 SHALL 包含 `<script type="application/ld+json">` 标签
- **THEN** 标签内容 SHALL 为 `seoMeta.schemaJson` 字段的原始 JSON 字符串

#### Scenario: 未配置 schemaJson 的文章有自动生成的 schema
- **WHEN** 爬虫抓取一篇 `seoMeta.schemaJson` 为空的博客文章
- **THEN** HTML 源码 SHALL 包含自动生成的 `BlogPosting` schema
- **THEN** `headline` SHALL 为文章标题，`datePublished` SHALL 为 ISO 8601 格式
