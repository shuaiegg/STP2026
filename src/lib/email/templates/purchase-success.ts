const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://scaletotop.com';

export function purchaseSuccessEmailHtml(name: string, creditsAdded: number, newBalance: number, locale = 'zh'): string {
  if (locale === 'en') {
    const displayName = name || 'User';
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid #f3f4f6;">
            <div style="font-size:22px;font-weight:700;background:linear-gradient(135deg,#00ff88,#00d4ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;display:inline-block;">ScaletoTop</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="font-size:48px;margin-bottom:8px;">✅</div>
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#111827;">Purchase Successful!</h1>
            </div>
            <p style="margin:0 0 24px;font-size:16px;color:#6b7280;line-height:1.6;text-align:center;">
              Hi ${displayName}, thank you for your support! Your credits have been credited to your account.
            </p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin-bottom:24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:14px;color:#6b7280;">Credits Purchased</td>
                  <td align="right" style="font-size:20px;font-weight:700;color:#16a34a;">+${creditsAdded}</td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#6b7280;padding-top:8px;">New Total Balance</td>
                  <td align="right" style="font-size:16px;font-weight:600;color:#111827;padding-top:8px;">${newBalance} credits</td>
                </tr>
              </table>
            </div>
            <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
              <a href="${APP_URL}/dashboard"
                 style="display:inline-block;padding:12px 28px;background:#00d4ff;color:#000000;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                Start Using →
              </a>
            </td></tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              If you have any questions regarding your billing, please reply to this email to contact us.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  const displayName = name || '用户';
  return `<!DOCTYPE html>
<html lang="zh">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid #f3f4f6;">
            <div style="font-size:22px;font-weight:700;background:linear-gradient(135deg,#00ff88,#00d4ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;display:inline-block;">ScaletoTop</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="font-size:48px;margin-bottom:8px;">✅</div>
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#111827;">购买成功！</h1>
            </div>
            <p style="margin:0 0 24px;font-size:16px;color:#6b7280;line-height:1.6;text-align:center;">
              Hi ${displayName}，感谢你的支持！积分已到账。
            </p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin-bottom:24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:14px;color:#6b7280;">本次充值积分</td>
                  <td align="right" style="font-size:20px;font-weight:700;color:#16a34a;">+${creditsAdded}</td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#6b7280;padding-top:8px;">当前总余额</td>
                  <td align="right" style="font-size:16px;font-weight:600;color:#111827;padding-top:8px;">${newBalance} 积分</td>
                </tr>
              </table>
            </div>
            <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
              <a href="${APP_URL}/dashboard"
                 style="display:inline-block;padding:12px 28px;background:#00d4ff;color:#000000;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                开始使用 →
              </a>
            </td></tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              如有账单疑问，请回复此邮件联系我们。
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
