## Why

写作工具(geo-writer)现在是**公共页**(`[locale]/(public)/tools/geo-writer`),带来一串问题(explore 收敛):

- **闭环割裂**:从仪表盘"开始写作"→ 跳出 shell 到公共页 → 写完存库又要跳回(dashboard→公共→dashboard),无侧边栏、多次上下文切换。
- **与订阅模型冲突**:工具是付费价值,放公共全功能 = LLM/积分被白嫖、蚕食订阅。
- **/tools 公共页挂死链**:列了 geo-writer/maps-scraper/site-audit,但只有 geo-writer 真实存在 → 另两个链接 404(营销页可信度受损)。
- **重复**:`/tools`(公共)与 `dashboard/tools` 各有一份工具列表,都指向同一个公共 geo-writer。
- **历史 bug 根源**:公共页用"目标网站域名"文本框 + `form.siteId`(域名)而非站点 UUID → 之前 DNA 注入/内链/闭环连接一连串 bug 都源于"靠 URL 传参 + 域名/UUID 混淆"。

标准 SaaS 拆分应是:**公共=营销 + 免费引流;App(仪表盘)=产品(工具,订阅价值,闭环一体)。** 现状是工具泄漏到了公共侧(历史产物)。

## What Changes

1. **geo-writer 整体搬进 dashboard**(`/dashboard/tools/geo-writer`,复用组件,shell 内闭环):
   - siteId 走**仪表盘上下文/站点选择器**(全程已登录)→ 移除"域名文本框 + form.siteId"混淆,DNA 注入/内链/闭环连接自然正确。
   - locale 跟 `User.locale`(非 URL);用 next/link(dashboard 非 locale 路由)。
2. **/tools → 纯营销页**:详述各能力(GEO写作/审计/竞品/策略板/收录排名追踪/教练),诚实(无 vaporware、不过度宣称),CTA→注册;移除未实现工具的死链(或标"即将推出")。
3. **全量改链**(10+ 处 + 2 封邮件):蓝图×3、策略板、library、registry、dashboard/tools、咨询表单 → 站内指向 `/dashboard/tools/geo-writer`;邮件/营销指向营销页或登录。
4. **301 重定向** `/tools/geo-writer`(+ `/zh/...`)→ /tools(或登录)。
5. **库编辑文案清理**:"提交修改并入库"→"保存";用户视图**隐藏"保存为博客草稿"**(ADMIN-only,普通用户点了 401)。

## Capabilities

### New Capabilities
- `tools-placement-and-access`: 生产工具归位到仪表盘(订阅价值 + 闭环一体)、公共 /tools 营销化、链接/重定向迁移、上下文取 siteId。

### Modified Capabilities
<!-- 不改工具内部生成逻辑;仅迁移位置/入口/取参方式 -->

## Impact

- **新增**:`(protected)/dashboard/tools/geo-writer/page.tsx`(挂载/复用 geo-writer 组件)。
- **修改**:
  - geo-writer 组件:siteId 从上下文/选择器取(去掉域名框);locale/Link 适配 dashboard。
  - `[locale]/(public)/tools/page.tsx` → 营销页(文案用 copywriting 技能);移除死链。
  - 10+ 处链接 + 2 封邮件模板 → 新位置。
  - `src/middleware.ts`:`/tools/geo-writer` 301。
  - library 编辑文案、博客草稿按钮可见性(admin-only)。
- **不影响**:geo-writer 的生成/审计/内链逻辑本身、模型路由、积分。
- **风险**:中高。组件从公共搬到 dashboard(layout/locale/auth 适配)+ 大面积改链 + 重定向;需回归各入口与首跑 onboarding。
- **依赖**:`copywriting` 技能 + `.agents/product-marketing.md`(营销页文案)。
- **关联**:与 `plg-homepage-and-free-audit` 相邻(那个偏获客/首页,这个偏产品归位/工具)。承接已修的 DNA 注入/内链/闭环。
- **Deferred(backlog)**:订阅分层闸(工具按 tier 解锁)、邮件模板落地策略细化、其余工具(maps-scraper 等)真正实现、公共 geo-writer 限量 demo(已决:不做 demo,纯营销→注册)。
