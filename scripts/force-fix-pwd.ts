import { auth } from "../src/lib/auth";
import prisma from "../src/lib/prisma";

async function forceFixPassword() {
    const email = "jack47.chn@gmail.com";
    const newPassword = "jack1234567890";
    
    console.log(`🚀 [Better Auth] Setting password correctly for: ${email}`);
    
    try {
        const user = await prisma.user.findFirst({
            where: { email }
        });

        if (!user) throw new Error("User not found");

        // Use the setPassword API which should handle hashing correctly
        // Note: Better Auth API usually expects a request-like object if called directly,
        // but some methods can be called with just the body.
        
        // Let's try to use the internal hashing utility if setPassword fails
        const result = await (auth.api as any).setPassword({
            body: {
                userId: user.id,
                newPassword: newPassword,
            }
        });
        
        console.log("✅ Success Result:", result);
        console.log("\n✨ Password should now be correct. Algorithm handled by Better Auth.");
    } catch (error) {
        console.error("❌ Failed:", error);
    }
}

forceFixPassword();
