import { auth } from "../src/lib/auth";

async function testSignUp() {
    const email = "temp-tester@example.com";
    const password = "password123";
    
    console.log(`🚀 [Better Auth] Attempting sign-up for: ${email}`);
    
    try {
        const result = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name: "Tester"
            }
        });
        
        console.log("✅ Success Result:", result);
    } catch (error) {
        console.error("❌ Failed:", error);
    }
}

testSignUp();
