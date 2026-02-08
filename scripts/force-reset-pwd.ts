import prisma from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function forceResetPassword() {
    const email = "jack47.chn@gmail.com";
    const newPassword = "jack1234567890";
    
    console.log(`🚀 [Admin] Force resetting password for: ${email}`);
    
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Find the account record associated with this user
        const user = await prisma.user.findUnique({
            where: { email },
            include: { accounts: true }
        });
        
        if (!user) {
            throw new Error(`User ${email} not found.`);
        }
        
        // Better Auth stores password in the Account table for credential provider
        const credentialAccount = user.accounts.find(a => a.providerId === "credential");
        
        if (credentialAccount) {
            await prisma.account.update({
                where: { id: credentialAccount.id },
                data: { password: hashedPassword }
            });
            console.log("✅ Password updated in existing credential account.");
        } else {
            // If no credential account, create one (unlikely but possible if only used OTP before)
            await prisma.account.create({
                data: {
                    userId: user.id,
                    providerId: "credential",
                    accountId: user.email,
                    password: hashedPassword
                }
            });
            console.log("✅ Created new credential account with the specified password.");
        }
        
        console.log("\n✨ Password reset successful. You can now login with: " + newPassword);
    } catch (error) {
        console.error("❌ Reset failed:", error);
    }
}

forceResetPassword();
