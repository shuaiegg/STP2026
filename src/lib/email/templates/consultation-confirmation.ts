const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://scaletotop.com';

export function consultationConfirmationHtml(name: string, serviceType: string, locale = 'zh'): string {
  if (locale === 'en') {
    const displayName = name || 'Friend';
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
            <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">We've received it, ${displayName}! ✅</h1>
            <p style="margin:0 0 20px;font-size:15px;color:#6b7280;line-height:1.7;">
              Your consultation request has been successfully submitted. We will contact you within <strong style="color:#111827;">1 business day</strong> to provide customized recommendations tailored to your business.
            </p>

            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0;font-size:14px;color:#15803d;line-height:1.6;">
                📌 While you wait, explore what ScaletoTop can do for your SEO & GEO growth.
              </p>
            </div>

            <table cellpadding="0" cellspacing="0"><tr><td>
              <a href="${APP_URL}/tools"
                 style="display:inline-block;padding:12px 28px;background:#00d4ff;color:#000000;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                See platform capabilities →
              </a>
            </td></tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              If you need urgent contact, please reply directly to this email.
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
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid #f3f4f6;">
            <div style="font-size:22px;font-weight:700;background:linear-gradient(135deg,#00ff88,#00d4ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;display:inline-block;">ScaletoTop</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">收到了，${displayName}！✅</h1>
            <p style="margin:0 0 20px;font-size:15px;color:#6b7280;line-height:1.7;">
              你的咨询需求已经提交成功。我们通常会在 <strong style="color:#111827;">1 个工作日内</strong>与你联系，根据你的业务情况提供定制化建议。
            </p>

            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0;font-size:14px;color:#15803d;line-height:1.6;">
                📌 在等待期间，了解 ScaletoTop 能为您的 SEO 与 GEO 增长做什么。
              </p>
            </div>

            <table cellpadding="0" cellspacing="0"><tr><td>
              <a href="${APP_URL}/zh/tools"
                 style="display:inline-block;padding:12px 28px;background:#00d4ff;color:#000000;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                了解平台能力 →
              </a>
            </td></tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              如需紧急联系，请直接回复此邮件或加微信：<strong>jack_scaletotop</strong>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
