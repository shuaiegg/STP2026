import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';

// Load env from the project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResend() {
    console.log("🚀 Testing Resend with Key:", process.env.RESEND_API_KEY?.substring(0, 10) + "...");
    try {
        const data = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'jack47.chn@gmail.com',
            subject: 'Aladdin Test',
            html: '<strong>It works!</strong>',
        });
        console.log("✅ Success:", data);
    } catch (error) {
        console.error("❌ Failed:", error);
    }
}

testResend();
