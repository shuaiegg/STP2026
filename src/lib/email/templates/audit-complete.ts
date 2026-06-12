const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://scaletotop.com';

export function auditCompleteEmailHtml(name: string, domain: string, siteId: string, techScore: number | null, locale = 'zh'): string {
  if (locale === 'en') {
    const displayName = name || 'User';
    const scoreDisplay = techScore !== null ? `${techScore} / 100` : 'Analysis Completed';
    const reportUrl = `${APP_URL}/dashboard/site-intelligence/${siteId}`;
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
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Site Audit Completed</h1>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">${domain}</p>
            <p style="margin:0 0 24px;font-size:16px;color:#6b7280;line-height:1.6;">
              Hi ${displayName}, your website audit has been completed. Technical health score:
            </p>
            <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
              <div style="font-size:48px;font-weight:800;color:#00d4ff;">${scoreDisplay}</div>
              <div style="font-size:13px;color:#9ca3af;margin-top:4px;">Technical Health Index</div>
            </div>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
              The report includes the page structure mapping, technical issue checklist, and recommendations for improvement. Click below to view the full report.
            </p>
            <table cellpadding="0" cellspacing="0"><tr><td>
              <a href="${reportUrl}"
                 style="display:inline-block;padding:12px 28px;background:#00d4ff;color:#000000;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                View Full Report →
              </a>
            </td></tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              ScaletoTop — Professional Global SEO & Content Intelligence Platform
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
  const scoreDisplay = techScore !== null ? `${techScore}分` : '分析完成';
  const reportUrl = `${APP_URL}/dashboard/site-intelligence/${siteId}`;
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
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">站点审计完成</h1>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">${domain}</p>
            <p style="margin:0 0 24px;font-size:16px;color:#6b7280;line-height:1.6;">
              Hi ${displayName}，你的站点审计已完成，技术健康得分：
            </p>
            <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
              <div style="font-size:48px;font-weight:800;color:#00d4ff;">${scoreDisplay}</div>
              <div style="font-size:13px;color:#9ca3af;margin-top:4px;">技术健康指数</div>
            </div>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
              报告包含页面结构图谱、技术问题清单和改进建议，点击下方查看完整报告。
            </p>
            <table cellpadding="0" cellspacing="0"><tr><td>
              <a href="${reportUrl}"
                 style="display:inline-block;padding:12px 28px;background:#00d4ff;color:#000000;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                查看完整报告 →
              </a>
            </td></tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              ScaletoTop — 专业的出海 SEO 与内容智能平台
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
