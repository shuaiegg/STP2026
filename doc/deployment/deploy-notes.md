这是一个值得深入聊的话题。结合你们的具体栈（Next.js 16 + Prisma + better-auth +
Supabase Storage），我来系统梳理。

一、数据库迁移：从 Supabase 孟买 → 本地 PostgreSQL
这是阶段二最关键的一步，也是最有风险的操作。

现在: 应用(美西) ──220ms──▶ Supabase PostgreSQL(孟买)

目标: 应用(美西) │ └──<1ms──▶ PostgreSQL(同一台服务器) 迁移流程最佳实践：

1. 安装 PostgreSQL（推荐 PG 16，与 Supabase 版本匹配）
2. pg_dump 从 Supabase 导出完整数据
3. 在本地恢复数据
4. 修改 DATABASE_URL 指向本地
5. 运行 prisma migrate deploy 验证 schema 对齐
6. 切流量（改环境变量，重启应用）
7. 观察 24-48 小时后，确认无问题再断开 Supabase 注意：Supabase
   Storage（媒体文件）和 PostgreSQL 是两个独立服务。如果只迁移数据库，图片仍然在
   Supabase Storage，这完全没问题，可以继续用。

二、进程管理：必须用 PM2 或 Docker Next.js npm start 直接跑在终端里，SSH
断开就死了。

推荐方案对比：

┌──────────────────┬──────────────────┬──────────────────┐ │ │ PM2 │ Docker │
├──────────────────┼──────────────────┼──────────────────┤ │ 复杂度 │ 低 │ 中 │
│ 自动重启 │ ✓ │ ✓ (restart:always)│ │ 开机自启 │ ✓ (pm2 startup) │ ✓ │ │
日志管理 │ ✓ 内置 │ 需要配置 │ │ 多实例/集群 │ ✓ cluster mode │ 需要 compose │ │
零停机部署 │ ✓ reload │ 需要 rolling │ │ 环境隔离 │ ✗ │ ✓ │
└──────────────────┴──────────────────┴──────────────────┘
我的建议：单台服务器用 PM2，简单可靠。如果未来要多台机器横向扩展，再迁到
Docker。

关键 PM2 配置：

// ecosystem.config.js module.exports = { apps: [{ name: 'stp2026', script:
'npm', args: 'start', instances: 'max', // 利用所有 CPU 核心 exec_mode:
'cluster', // 多进程负载均衡 max_memory_restart: '1G', env_production: {
NODE_ENV: 'production', PORT: 3000 } }] } 三、反向代理：Nginx 或 Caddy 不能把
Next.js 直接暴露在 80/443 端口。

用户 ──HTTPS──▶ Nginx/Caddy(443) ──▶ Next.js(:3000)
Caddy（强烈推荐）：自动申请和续签 HTTPS 证书，配置极简：

# Caddyfile

scaletotop.com { reverse_proxy localhost:3000 } 就这几行，HTTPS 自动搞定。Nginx
功能更强但配置复杂，对于单应用没必要。

四、CI/CD：零停机部署流程 每次发布的最佳实践：

本地 git push │ ▼ GitHub Actions / 手动 SSH │ ├── git pull ├── npm ci
--production ├── npx prisma generate ├── npx prisma migrate deploy ←
先跑迁移（向后兼容） ├── npm run build └── pm2 reload stp2026 ←
零停机热重载（不是 restart） 关键原则：migrate deploy 必须在 build 之前，且每次
schema 变更必须向后兼容（先加字段，后删旧字段）。

五、Cron Job 的注意事项 你们目前有 /api/cron/verify
这个路由。自部署后需要自己管理 cron：

# crontab -e

# 每小时触发一次

0 * * * * curl -s -H "Authorization: Bearer $CRON_SECRET"\
https://scaletotop.com/api/cron/verify >> /var/log/cron.log 2>&1 注意：Vercel
上的 cron 是自动管理的，迁移后要手动配置，容易遗漏。

六、必须要做的维护事项

┌────────────────────────────────────────────────────────┐ │ 频率 任务 │
├────────────────────────────────────────────────────────┤ │ 每天自动 PostgreSQL
数据库备份 (pg_dump) │ │ 备份文件上传到异地（S3/Cloudflare R2） │
├────────────────────────────────────────────────────────┤ │ 每天自动 日志轮转
(logrotate) │ │ PM2 日志不设轮转会撑爆磁盘 │
├────────────────────────────────────────────────────────┤ │ 每月 系统安全更新
(apt upgrade) │ │ Node.js LTS 版本检查 │
├────────────────────────────────────────────────────────┤ │ 每季度 SSL
证书检查（Caddy 自动，Nginx 需手动） │ │ 磁盘使用率检查 │ │ 依赖安全审计 (npm
audit) │ └────────────────────────────────────────────────────────┘
七、容易忽略的安全问题

1. 防火墙：只开放 22(SSH)、80、443，其余全关 ufw allow 22 && ufw allow 80 && ufw
   allow 443 && ufw enable

2. PostgreSQL 不绑定公网： listen_addresses = 'localhost' # pg
   配置，只允许本机连接

3. SSH 禁用密码登录，只用密钥： PasswordAuthentication no

4. 环境变量不放在代码里： 用 .env.production.local 或系统环境变量，gitignore
   覆盖

5. better-auth 的 BETTER_AUTH_SECRET 必须足够强： openssl rand -base64 32
   八、监控：至少做基础的 没有监控等于瞎开车。最轻量的方案：

Uptime Robot（免费）：每 5 分钟 ping 你的域名，宕机发邮件/微信 PM2 监控：pm2
monit 查看实时内存/CPU 磁盘告警：简单 cron 脚本，磁盘使用超 80% 发邮件
最需要注意的 3 件事 数据库备份是生命线：自部署 PostgreSQL
意味着你自己负责数据安全，Supabase
现在帮你做了，迁移后必须自己建备份脚本，且备份要存到另一台机器/服务

pm2 reload 不是 pm2 restart：reload 是零停机热重载（逐个子进程替换），restart
会有短暂中断，生产环境永远用 reload

数据库 schema 迁移顺序：必须先 prisma migrate
deploy，再重启应用。顺序反了，新代码访问旧 schema，会报错
