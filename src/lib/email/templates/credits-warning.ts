const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://scaletotop.com';

export function creditsWarningEmailHtml(name: string, remaining: number): string {
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
            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin-bottom:24px;display:flex;align-items:center;">
              <span style="font-size:20px;margin-right:12px;">⚠️</span>
              <span style="font-size:14px;color:#9a3412;font-weight:500;">积分余量不足提醒</span>
            </div>
            <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">Hi ${displayName}，你的积分快用完了</h1>
            <p style="margin:0 0 24px;font-size:16px;color:#6b7280;line-height:1.6;">
              你当前剩余 <strong style="color:#ef4444;font-size:20px;">${remaining}</strong> 积分，建议及时充值以保证 AI 功能持续可用。
            </p>
            <table cellpadding="0" cellspacing="0"><tr><td>
              <a href="${APP_URL}/dashboard/billing"
                 style="display:inline-block;padding:12px 28px;background:#00d4ff;color:#000000;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                立即充值积分 →
              </a>
            </td></tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              积分用于驱动站点审计、内容生成等 AI 功能。此提醒每 24 小时最多发送一次。
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
