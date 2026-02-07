import { auth } from "../src/lib/auth";
import { headers } from "next/headers";

async function testOtp() {
    const email = "jack47.chn@gmail.com";
    console.log(`🚀 Triggering OTP send for: ${email}`);
    
    try {
        // We use the internal API to trigger the send logic defined in auth.ts
        // In Better Auth, this usually happens via client call, but we can simulate the server-side trigger
        const result = await auth.api.sendVerificationCode({
            body: {
                email,
                type: "sign-in"
            }
        });
        
        console.log("✅ Success!", result);
    } catch (error) {
        console.error("❌ Failed:", error);
    }
}

testOtp();
