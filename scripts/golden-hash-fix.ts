import { auth } from "../src/lib/auth";
import prisma from "../src/lib/prisma";

async function goldenHashFix() {
    const dummyEmail = "temp-golden-hash@example.com";
    const jackEmail = "jack47.chn@gmail.com";
    const targetPassword = "jack1234567890";
    
    console.log(`🚀 Starting Golden Hash Fix...`);
    
    try {
        // 1. Create dummy user with library-correct hash
        console.log(`1. Creating dummy user: ${dummyEmail}`);
        const signup = await auth.api.signUpEmail({
            body: {
                email: dummyEmail,
                password: targetPassword,
                name: "Hash Fixer"
            }
        });
        
        if (!signup || !signup.user) throw new Error("Dummy signup failed");
        
        // 2. Fetch the hash
        const dummyAccount = await prisma.account.findFirst({
            where: { userId: signup.user.id, providerId: "credential" }
        });
        
        if (!dummyAccount || !dummyAccount.password) throw new Error("Could not find dummy hash");
        const goldenHash = dummyAccount.password;
        console.log("✅ Extracted Golden Hash:", goldenHash.substring(0, 15) + "...");
        
        // 3. Apply to Jack
        const jack = await prisma.user.findUnique({
            where: { email: jackEmail },
            include: { accounts: true }
        });
        
        if (!jack) throw new Error("Jack not found");
        
        const jackAccount = jack.accounts.find(a => a.providerId === "credential");
        if (jackAccount) {
            await prisma.account.update({
                where: { id: jackAccount.id },
                data: { password: goldenHash }
            });
            console.log("✅ Jack's account updated with correct hash.");
        } else {
            console.log("ℹ️ Jack had no credential account, creating one...");
            await prisma.account.create({
                data: {
                    userId: jack.id,
                    providerId: "credential",
                    accountId: jack.email,
                    password: goldenHash
                }
            });
            console.log("✅ Created new credential account for Jack.");
        }
        
        // 4. Cleanup
        console.log("4. Cleaning up dummy user...");
        await prisma.user.delete({ where: { id: signup.user.id } });
        console.log("✨ Done! Try logging in with jack1234567890");
        
    } catch (error) {
        console.error("❌ Fix failed:", error);
    }
}

goldenHashFix();
