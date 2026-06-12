import { Resend } from 'resend';
import { welcomeEmailHtml } from './email/templates/welcome';
import { creditsWarningEmailHtml } from './email/templates/credits-warning';
import { purchaseSuccessEmailHtml } from './email/templates/purchase-success';
import { auditCompleteEmailHtml } from './email/templates/audit-complete';
import { consultationNotificationHtml } from './email/templates/consultation-notification';
import { consultationConfirmationHtml } from './email/templates/consultation-confirmation';

let resendInstance: Resend | null = null;

function getResend() {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not defined in environment variables');
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  try {
    const resend = getResend();
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'ScaletoTop <noreply@mail.scaletotop.com>',
      to,
      subject,
      html,
      replyTo: process.env.EMAIL_REPLY_TO || 'jack@scaletotop.com',
    });

    if (data.error) {
      console.error('[Email Service] Resend API Error:', data.error);
      return { success: false, error: data.error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[Email Service] Failed to send email:', error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(user: { email: string; name?: string | null; locale?: string }, locale?: string) {
  const activeLocale = locale || user.locale || 'zh';
  return sendEmail({
    to: user.email,
    subject: activeLocale === 'en' ? 'Welcome to ScaletoTop 🎉' : '欢迎加入 ScaletoTop 🎉',
    html: welcomeEmailHtml(user.name || '', activeLocale),
  });
}

export async function sendCreditsWarningEmail(user: { email: string; name?: string | null; locale?: string }, remaining: number, locale?: string) {
  const activeLocale = locale || user.locale || 'zh';
  return sendEmail({
    to: user.email,
    subject: activeLocale === 'en' ? '⚠️ Low Credits Alert — ScaletoTop' : '⚠️ ScaletoTop 积分余量不足提醒',
    html: creditsWarningEmailHtml(user.name || '', remaining, activeLocale),
  });
}

export async function sendPurchaseSuccessEmail(user: { email: string; name?: string | null; locale?: string }, creditsAdded: number, newBalance: number, locale?: string) {
  const activeLocale = locale || user.locale || 'zh';
  return sendEmail({
    to: user.email,
    subject: activeLocale === 'en' ? '✅ Credits Recharged Successfully — ScaletoTop' : '✅ 积分充值成功 — ScaletoTop',
    html: purchaseSuccessEmailHtml(user.name || '', creditsAdded, newBalance, activeLocale),
  });
}

export async function sendConsultationNotification(data: {
  id: string;
  serviceType: string;
  website?: string | null;
  description: string;
  targetMarket?: string | null;
  goals?: string | null;
  budget?: string | null;
  name: string;
  email: string;
  wechat?: string | null;
  createdAt: Date;
  details?: Record<string, unknown> | null;
}) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'jack@scaletotop.com';
  return sendEmail({
    to: adminEmail,
    subject: `[咨询] ${data.name} — ${data.serviceType}`,
    html: consultationNotificationHtml(data),
  });
}

export async function sendConsultationConfirmation(user: { email: string; name: string; locale?: string }, serviceType: string, locale?: string) {
  const activeLocale = locale || user.locale || 'zh';
  return sendEmail({
    to: user.email,
    subject: activeLocale === 'en' ? 'We have received your request — ScaletoTop' : '已收到你的咨询需求 — ScaletoTop',
    html: consultationConfirmationHtml(user.name, serviceType, activeLocale),
  });
}

export async function sendAuditCompleteEmail(
  user: { email: string; name?: string | null; locale?: string },
  siteId: string,
  domain: string,
  techScore: number | null,
  locale?: string
) {
  const activeLocale = locale || user.locale || 'zh';
  return sendEmail({
    to: user.email,
    subject: activeLocale === 'en' ? `Site Audit Completed: ${domain} — ScaletoTop` : `站点审计完成：${domain} — ScaletoTop`,
    html: auditCompleteEmailHtml(user.name || '', domain, siteId, techScore, activeLocale),
  });
}
