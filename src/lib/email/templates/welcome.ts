const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://scaletotop.com';

export function welcomeEmailHtml(name: string, locale = 'zh'): string {
  if (locale === 'en') {
    const displayName = name || 'Friend';
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid #f3f4f6;">
            <div style="font-size:22px;font-weight:700;background:linear-gradient(135deg,#00ff88,#00d4ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;display:inline-block;">ScaletoTop</div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;">
            <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Welcome aboard, ${displayName}!</h1>
            <p style="margin:0 0 24px;font-size:16px;color:#6b7280;line-height:1.6;">
              Your account has been successfully created. We have gifted you <strong style="color:#111827;">10 credits</strong> to explore all our features.
            </p>
            <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#374151;">Quick Start:</p>
              <ol style="margin:0;padding-left:20px;color:#6b7280;font-size:14px;line-height:2;">
                <li>Add your website domain name</li>
                <li>Run your first site audit to check technical scores</li>
                <li>Connect Google Search Console for keyword data</li>
                <li>Generate AI content plans</li>
              </ol>
            </div>
            <table cellpadding="0" cellspacing="0"><tr><td>
              <a href="${APP_URL}/dashboard/site-intelligence"
                 style="display:inline-block;padding:12px 28px;background:#00d4ff;color:#000000;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                Go to Dashboard →
              </a>
            </td></tr></table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              You received this email because you just registered an account at ScaletoTop. If you have any questions, please reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  const displayName = name || '朋友';
  return `<!DOCTYPE html>
<html lang="zh">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid #f3f4f6;">
            <div style="font-size:22px;font-weight:700;background:linear-gradient(135deg,#00ff88,#00d4ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;display:inline-block;">ScaletoTop</div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;">
            <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">欢迎加入，${displayName}！</h1>
            <p style="margin:0 0 24px;font-size:16px;color:#6b7280;line-height:1.6;">
              你的账户已成功创建，我们已赠送 <strong style="color:#111827;">10 积分</strong>供你体验各项功能。
            </p>
            <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#374151;">快速开始：</p>
              <ol style="margin:0;padding-left:20px;color:#6b7280;font-size:14px;line-height:2;">
                <li>添加你的网站域名</li>
                <li>运行首次站点审计，查看技术得分</li>
                <li>连接 Google Search Console 获取关键词数据</li>
                <li>生成 AI 内容计划</li>
              </ol>
            </div>
            <table cellpadding="0" cellspacing="0"><tr><td>
              <a href="${APP_URL}/dashboard/site-intelligence"
                 style="display:inline-block;padding:12px 28px;background:#00d4ff;color:#000000;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                进入控制台 →
              </a>
            </td></tr></table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              你收到此邮件是因为刚刚在 ScaletoTop 创建了账户。如有疑问，请回复此邮件。
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
