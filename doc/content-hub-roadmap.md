# STP Content Asset Hub - 实施路径与演进路线图 (2026)

本文件定义了将 ScaletoTop 从单纯的生成工具升级为 **“内容资产管理中枢”** 的完整计划。

---

## 📅 阶段一：资产持久化 (Database & Storage Layer)
**目标**：确保用户生成的每一篇文章都有据可查，不再随网页刷新而消失。

### 🛠 实施任务：
1.  **数据库建模**：在 `schema.prisma` 中新增 `UserArticle` 模型。
    *   字段：`id`, `userId`, `title`, `slug`, `contentMd`, `seoMetadata` (JSON), `scores` (JSON), `status` (DRAFT/FINAL), `createdAt`, `updatedAt`。
2.  **生成逻辑对接**：修改 `/api/skills/execute` 逻辑。
    *   在 AI 生成成功后，自动在 `UserArticle` 表中创建记录。
3.  **引用追踪关联**：将现有的 `TrackedArticle` 与 `UserArticle` 进行逻辑关联。

### 🚩 检查点 (Checkpoints)：
*   [ ] 执行一次 StellarWriter，在数据库控制台确认 `UserArticle` 表中出现了对应记录。
*   [ ] 验证原子性：如果文章保存失败，积分是否会自动回退（或不扣除）。

---

## 🎨 阶段二：指挥中心 2.0 (New Command Center UI)
**目标**：打造专业的 SaaS 级仪表盘，提供流畅的内容管理体验。

### 🛠 实施任务：
1.  **全局侧边栏导航**：
    *   `Dashboard` (概览)
    *   `My Articles` (我的文章库)
    *   `Tools` (工具箱入口)
    *   `Billing` (积分账单)
    *   `Settings` (账号设置)
2.  **文章库管理页 (`/dashboard/articles`)**：
    *   实现列表展示，支持按关键词搜索、按日期排序。
    *   实现“删除”功能（逻辑删除 + 确认弹窗）。
3.  **沉浸式编辑器 (`/dashboard/articles/[id]`)**：
    *   支持对已生成的文章进行二次修改并手动保存。
    *   集成历史快照恢复功能。

### 🚩 检查点 (Checkpoints)：
*   [ ] 用户登录后能看到自己过去生成的文章列表。
*   [ ] 点击列表项能进入详情页查看并进行文字编辑。
*   [ ] 删除文章后，列表同步刷新，数据库记录移除。

---

## 🔗 阶段三：个性化营销注入 (Marketing Customization)
**目标**：让 AI 真正为用户的业务服务，自动埋入转化链接。

### 🛠 实施任务：
1.  **全局链接管理器**：
    *   在设置页面允许用户预设“常用推广链接”（如：官网、落地页、CTA 链接）。
2.  **Prompt 动态注入**：
    *   修改 AI 提示词引擎，将用户的预设链接作为“上下文”提供给 AI。
    *   AI 自动根据内容逻辑，将链接以 Markdown 格式自然地嵌入段落。
3.  **工具输入项增强**：
    *   在 StellarWriter 启动前，增加“是否包含推广链接”的勾选项。

### 🚩 检查点 (Checkpoints)：
*   [ ] 用户在设置中保存一个链接。
*   [ ] 生成文章后，正文中出现了该链接且锚文本（Anchor Text）自然合理。

---

## 🕸 阶段四：生态分发与 API (Distribution Layer)
**目标**：打破 STP 与第三方平台的壁垒，实现自动化发布。

### 🛠 实施任务：
1.  **API Key 体系**：
    *   允许用户在后台生成 `STP-API-KEY`。
2.  **对外开放接口**：
    *   开发 `/api/v1/articles` 只读接口，支持根据 API Key 获取内容。
3.  **CMS 桥接方案 (Wordpress/Notion)**：
    *   编写一个通用的 Webhook 逻辑，或者提供一个简单的同步脚本说明。

### 🚩 检查点 (Checkpoints)：
*   [ ] 使用 cURL 或 Postman 能通过 API Key 调取到该用户的文章内容。
*   [ ] 实现一个“复制到 WordPress”或“一键发布”按钮原型。

---

## 📊 阶段五：多维情报看板 (Intelligence Hub)
**目标**：将 Dashboard 升级为营销决策中心。

### 🛠 实施任务：
1.  **聚合数据可视化**：
    *   展示“已生成总字数”、“平均 SEO 评分”、“积分消耗趋势图”。
2.  **多工具数据汇总**：
    *   如果未来上线了“社交媒体生成”工具，数据一并汇总至此。

### 🚩 检查点 (Checkpoints)：
*   [ ] Dashboard 首页显示直观的统计卡片。

---

**阿拉丁注**：该计划遵循“先存后管，先用后发”的逻辑。每一阶段的开发都应建立在上一阶段稳定的基础上。
