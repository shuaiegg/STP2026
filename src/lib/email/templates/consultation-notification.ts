const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://scaletotop.com';

const SERVICE_LABELS: Record<string, string> = {
  ai: '🤖 AI 与自动化',
  crawler: '🕷️ 数据爬虫',
  growth: '📈 增长方案',
};

const BUDGET_LABELS: Record<string, string> = {
  '<5k': '< ¥5k/月',
  '5k-20k': '¥5k–20k/月',
  '20k-50k': '¥20k–50k/月',
  '>50k': '> ¥50k/月',
  'project': '项目制（一次性）',
};

const AD_PLATFORM_LABELS: Record<string, string> = {
  google: 'Google Ads',
  meta: 'Meta Ads',
  tiktok: 'TikTok Ads',
  linkedin: 'LinkedIn Ads',
  xiaohongshu: '小红书',
  other: '其他',
};

const AD_STATUS_LABELS: Record<string, string> = {
  none: '未有投放经验',
  poor_roi: 'ROI 不理想',
  active_optimize: '正在投放，想优化',
};

interface ConsultationData {
  id: string;
  createdAt: Date;
  serviceType: string;
  name: string;
  email: string;
  wechat?: string | null;
  budget?: string | null;
  description: string;
  website?: string | null;
  targetMarket?: string | null;
  details?: Record<string, any> | null | undefined;
}

function row(label: string, value: string) {
  if (!value || value === '—') return '';
  return `
    <tr>
      <td style="padding:7px 12px;font-size:13px;font-weight:600;color:#6b7280;white-space:nowrap;vertical-align:top;width:120px;">${label}</td>
      <td style="padding:7px 12px;font-size:13px;color:#111827;line-height:1.6;">${value}</td>
    </tr>`;
}

function section(title: string, rows: string) {
  return `
    <div style="margin-bottom:20px;">
      <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">${title}</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">${rows}</table>
    </div>`;
}

function buildServiceRows(serviceType: string, description: string, details: Record<string, any>): string {
  if (serviceType === 'ai') {
    return section('业务场景', [
      row('业务场景', description),
      row('在用工具', details.tools || '—'),
      row('主要痛点', details.painPoints || '—'),
      row('交付形式', details.deliveryType || '—'),
    ].join(''));
  }

  if (serviceType === 'crawler') {
    return section('数据需求', [
      row('数据来源', description),
      row('数据用途', details.dataUse || '—'),
      row('采集频率', details.frequency || '—'),
      row('交付格式', details.deliveryFormat || '—'),
      row('数据量级', details.dataVolume || '—'),
    ].join(''));
  }

  if (serviceType === 'growth') {
    const platforms = Array.isArray(details.adPlatforms) && details.adPlatforms.length > 0
      ? details.adPlatforms.map((p: string) => AD_PLATFORM_LABELS[p] ?? p).join('、')
      : '无';
    const adStatus = details.adStatus ? (AD_STATUS_LABELS[details.adStatus] ?? details.adStatus) : '—';

    return section('增长需求', [
      row('网站', details.website ? `<a href="${details.website}" style="color:#00d4ff;">${details.website}</a>` : '—'),
      row('竞争对手', description.replace(/\n/g, '<br>')),
      row('目标市场', details.targetMarket || '—'),
      row('当前流量', details.currentTraffic || '—'),
      row('主要目标', details.mainGoal || '—'),
      row('投放平台', platforms),
      row('投放状态', adStatus),
    ].join(''));
  }

  return section('详情', row('描述', description));
}

export function consultationNotificationHtml(data: ConsultationData): string {
  const adminUrl = `${APP_URL}/admin/consultations`;
  const serviceLabel = SERVICE_LABELS[data.serviceType] ?? data.serviceType;
  const budgetLabel = data.budget ? (BUDGET_LABELS[data.budget] ?? data.budget) : '未填写';
  const details = (data.details as Record<string, any>) ?? {};

  const contactRows = section('联系方式', [
    row('姓名', data.name),
    row('邮箱', `<a href="mailto:${data.email}" style="color:#00d4ff;">${data.email}</a>`),
    data.wechat ? row('微信/手机', data.wechat) : '',
    row('预算', budgetLabel),
  ].join(''));

  const serviceRows = buildServiceRows(data.serviceType, data.description, details);

  return `<!DOCTYPE html>
<html lang="zh">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr>
          <td style="padding:24px 32px 20px;background:#111827;border-bottom:3px solid #00d4ff;">
            <div style="font-size:16px;font-weight:700;color:#00d4ff;">ScaletoTop</div>
            <div style="font-size:20px;font-weight:700;color:#ffffff;margin-top:4px;">新咨询 🔔 ${serviceLabel}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            ${contactRows}
            ${serviceRows}
            <a href="${adminUrl}" style="display:inline-block;padding:11px 22px;background:#00d4ff;color:#000000;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">在后台查看 →</a>
            <p style="margin:16px 0 0;font-size:11px;color:#9ca3af;">
              提交时间：${data.createdAt.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} · ID: ${data.id.slice(0, 8)}
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
