# STP2026 生产环境上线前置准备手册 (Production Ready Guide)

> **版本**: 1.0  
> **状态**: 待执行 (Pre-flight Checklist)  
> **核心目标**: 实现 i18n 兼容的路径模式、GTM 追踪闭环及环境隔离。

---

## 🛑 第一部分：基础设施配置 (杰克执行)

### 1. 域名通讯 (Resend)
*   **任务**: 在 [Resend Domains](https://resend.com/domains) 添加 `scaletotop.com`。
*   **DNS 配置**: 添加 MX, SPF, DKIM 记录（由 Resend 提供）。
*   **目的**: 确保用户注册邮件、系统通知能 100% 送达。

### 2. 全域追踪 (Google Tag Manager)
*   **任务**: 在 [GTM 官网](https://tagmanager.google.com/) 创建 Web 容器。
*   **获取 ID**: 格式为 `GTM-XXXXXXX`。
*   **配置 GA4**: 在 GTM 内部创建 GA4 配置标签，填入你的 `G-XXXXXX` 测量 ID。
*   **配置 GSC**: 在 GTM 中添加 Custom HTML 标签，填入 Google Search Console 的验证 Meta 标签。

### 3. 三方鉴权 (OAuth)
*   **任务**: 登录 Google Cloud Console / GitHub Developer Settings。
*   **白名单**: 将 `https://scaletotop.com/api/auth/callback` 类地址加入 Authorized Redirect URIs。

---

## 🛠 第二部分：代码与逻辑调整 (阿拉丁准备)

### 1. 多语言 (i18n) 预留
*   **Prisma Schema**: 为 `User`, `Article`, `SiteAudit` 表增加 `locale` 字段。
*   **路由解耦**: 建立 `src/constants/routes.ts`，禁止在业务代码中硬编码 `/dashboard` 等路径。
*   **SEO**: 在 `layout.tsx` 中预留 `hreflang` 和 `canonical` 标签位。

### 2. GTM 注入与数据层协议
*   **组件注入**: 在 `src/app/layout.tsx` 引入 Next.js 官方 `<GoogleTagManager />` 组件。
*   **环境隔离**: 
    *   `NEXT_PUBLIC_GTM_ID`: 生产环境填入，开发环境留空。
    *   **DataLayer**: 定义 `user_language` 和 `auth_status` 初始变量。

### 3. 邮件模板解耦
*   **迁移**: 将 `src/app/actions/auth.ts` 中的硬编码 HTML 提取至 `src/lib/email/templates/`。
*   **结构**: 按 `zh/` 和 `en/` 文件夹管理。

---

## 🔐 第三部分：环境变量清单 (Environment Variables)

你需要在部署平台（如 Coolify/Vercel）配置以下生产变量：

| 变量名 | 推荐值/说明 |
| :--- | :--- |
| `DATABASE_URL` | 生产环境 PostgreSQL 地址 |
| `RESEND_API_KEY` | Resend 生产密钥 (sk_prod_...) |
| `EMAIL_FROM` | `ScaletoTop <auth@scaletotop.com>` |
| `NEXT_PUBLIC_GTM_ID` | `GTM-XXXXXXX` |
| `NEXTAUTH_URL` | `https://scaletotop.com` |
| `NEXTAUTH_SECRET` | 随机长字符串 (`openssl rand -base64 32`) |
| `CRAWLER_PROXY_HOST` | 生产环境爬虫代理 (选填) |

---

## 🚀 部署后核对清单 (Post-Deployment)

1.  [ ] **验证注册流**: 使用真实邮箱注册，检查是否收到 Resend 发出的邮件。
2.  [ ] **验证 GTM**: 开启 GA4 DebugView，检查页面访问和 `user_language` 是否正确上报。
3.  [ ] **验证 SEO**: 检查源代码 `<head>` 是否包含正确的 `canonical` 标签。
4.  [ ] **审计自身**: 运行一次 `CrawlerService` 抓取 `scaletotop.com`，检查 Business DNA 提取是否准确。

---
*Documented by Aladdin. 助力杰克实现 STP2026 业务闭环。*
