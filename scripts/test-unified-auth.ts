import { auth } from "../src/lib/auth";
import { parseArgs } from "node:util";

async function testSignUp() {
    const { values } = parseArgs({
        options: {
            email: { type: "string" },
            name: { type: "string" },
            password: { type: "string", default: "password123" }
        }
    });

    const email = values.email || `test-${Date.now()}@example.com`;
    const name = values.name || "Tester";
    const password = values.password;
    
    console.log(`🚀 [Better Auth] Testing unified flow simulation for: ${email}`);
    
    try {
        // 模拟后端：先尝试发登录码
        console.log("1. Checking if user exists (Attempting sign-in OTP send)...");
        try {
            await auth.api.sendVerificationOtp({
                body: { email, type: "sign-in" }
            });
            console.log("Result: User exists, OTP sent (Sign-in mode)");
        } catch (e: any) {
            if (e.body?.code === "USER_NOT_FOUND") {
                console.log("Result: User NOT found. Switching to sign-up mode...");
                console.log(`2. Sending sign-up OTP for new user: ${name}`);
                await auth.api.sendVerificationOtp({
                    body: { email, type: "sign-up" }
                });
                console.log("✅ Success: Sign-up OTP sent!");
            } else {
                throw e;
            }
        }
    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
}

testSignUp();
