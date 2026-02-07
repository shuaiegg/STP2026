import { sendEmail } from "../src/lib/email";

async function testEmail() {
    const email = "jack47.chn@gmail.com";
    console.log(`🚀 Sending test STP email to: ${email}`);
    
    const result = await sendEmail({
        to: email,
        subject: "🧞‍♂️ ScaletoTop 验证码测试",
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px; margin: 0 auto;">
                <h1 style="color: #4F46E5;">ScaletoTop</h1>
                <p style="font-size: 16px; color: #374151;">主人，这是阿拉丁为您发送的测试验证码：</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827; padding: 20px; background: #F9FAFB; border-radius: 8px; text-align: center; margin: 20px 0;">
                    888888
                </div>
                <p style="font-size: 14px; color: #6B7280;">如果收到此邮件，说明您的新机 Resend 通道已成功激活！</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #9CA3AF;">发送时间：${new Date().toLocaleString()}</p>
            </div>
        `
    });

    if (result.success) {
        console.log("✅ Email sent successfully!", result.data);
    } else {
        console.error("❌ Failed to send email:", result.error);
    }
}

testEmail();
