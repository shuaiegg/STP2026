import { Resend } from 'resend';

// 采用延时初始化，确保在调用时环境变量已加载
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
