import prisma from "../src/lib/prisma";
import { auth } from "../src/lib/auth";

async function verifyAuth() {
    console.log("🔍 [QA] Starting Auth & Database Verification...");

    try {
        // 1. Check Database Connectivity
        const userCount = await prisma.user.count();
        console.log(`✅ [DB] Database connected. Current user count: ${userCount}`);

        // 2. Check Auth Configuration
        if (!auth) {
            throw new Error("Auth object is not initialized.");
        }
        console.log("✅ [Auth] Better Auth initialized successfully.");

        // 3. Verify Trusted Origins
        // @ts-ignore - access internal config for verification
        const origins = auth.options.trustedOrigins;
        console.log("ℹ️ [Config] Trusted Origins:", origins);

        // 4. Test User Lookup (Simulation)
        const testUser = await prisma.user.findFirst({
            where: { email: "jack47.chn@gmail.com" }
        });
        
        if (testUser) {
            console.log(`✅ [User] Test user found: ${testUser.email} (Role: ${testUser.role})`);
        } else {
            console.warn("⚠️ [User] Test user jack47.chn@gmail.com not found. Check if seeded.");
        }

        console.log("\n✨ [QA] Auth Verification PASSED.");
    } catch (error) {
        console.error("\n❌ [QA] Verification FAILED:");
        console.error(error);
        process.exit(1);
    }
}

verifyAuth();
