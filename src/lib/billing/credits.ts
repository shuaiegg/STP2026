import prisma from "@/lib/prisma";
import { TOOL_COSTS } from "@/lib/config/credit-costs";
import { revalidateTag } from "next/cache";

export type ChargeResult =
    | { success: true; remainingCredits: number; transactionId?: string }
    | { success: false; error: string; required: number; current: number };

/**
 * Charge a user for tool usage.
 * Performs an atomic transaction: checks balance -> deducts credits -> records transaction.
 * 
 * @param userId - The ID of the user to charge
 * @param amount - The amount of credits to deduct
 * @param reason - Description for the transaction log (e.g. "GEO Writer Generation")
 */

/**
 * Charge a user for tool usage.
 * Fetches the current cost from SkillConfig to ensure dynamic pricing.
 * 
 * @param userId - The ID of the user to charge
 * @param skillName - The unique name of the skill (e.g. "GEO_WRITER_FULL")
 * @param description - Description for the transaction log
 */
export async function chargeUser(
    userId: string,
    skillName: string,
    description: string
): Promise<ChargeResult> {
    try {
        // 6.1 Check user role for exemption
        const userWithRole = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, credits: true }
        });

        if (!userWithRole) {
            return { success: false, error: "User not found", required: 0, current: 0 };
        }

        // 6.2 ADMIN exemption: Skip deduction and transaction record
        if (userWithRole.role === 'ADMIN') {
            return {
                success: true,
                remainingCredits: userWithRole.credits,
            };
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Get Skill Cost & Status
            const skill = await tx.skillConfig.findUnique({
                where: { name: skillName }
            });

            if (!skill) {
                return { success: false, error: `Skill '${skillName}' configuration not found`, required: 0, current: 0 };
            }

            if (!skill.isActive) {
                return { success: false, error: "This tool is currently disabled by admin", required: 0, current: 0 };
            }

            const cost = skill.cost;

            // 2. Get current user balance
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { credits: true }
            });

            if (!user) {
                return { success: false, error: "User not found", required: cost, current: 0 };
            }

            // 3. Check balance
            if (user.credits < cost) {
                return {
                    success: false,
                    error: "Insufficient credits",
                    required: cost,
                    current: user.credits
                };
            }

            // 4. Deduct credits
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    credits: { decrement: cost }
                },
                select: { credits: true }
            });

            // 5. Record transaction
            const transaction = await tx.creditTransaction.create({
                data: {
                    userId,
                    amount: cost,
                    type: 'CONSUMPTION',
                    description: `${description} (${cost} credits)`
                }
            });

            return {
                success: true,
                remainingCredits: updatedUser.credits,
                transactionId: transaction.id
            } as const;
        }, {
            maxWait: 10000,
            timeout: 15000,
        }) as ChargeResult;

        if (result.success) {
            // Revalidate user cache
            revalidateTag(`user-${userId}`, "max");
        }

        return result;
    } catch (error: any) {

        console.error("Credit charge failed:", error);
        return {
            success: false,
            error: "Transaction failed: " + error.message,
            required: 0,
            current: 0
        };
    }
}

/**
 * Refund a user for tool failure.
 */
export async function refundUser(
    userId: string,
    skillName: string,
    description: string
): Promise<{ success: true; remainingCredits: number } | { success: false; error: string }> {
    try {
        // 1. Get Skill Cost
        const skill = await prisma.skillConfig.findUnique({
            where: { name: skillName }
        });

        if (!skill) {
            return { success: false, error: `Skill '${skillName}' not found` };
        }

        const amount = skill.cost;

        const result = await (prisma.$transaction(async (tx) => {
            // 2. Increment credits
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    credits: { increment: amount }
                },
                select: { credits: true }
            });

            // 3. Record transaction
            await tx.creditTransaction.create({
                data: {
                    userId,
                    amount,
                    type: 'REFUND',
                    description: `${description} (+${amount} credits)`
                }
            });

            return {
                success: true,
                remainingCredits: updatedUser.credits
            } as const;
        }) as Promise<{ success: true; remainingCredits: number } | { success: false; error: string }>);

        if (result.success) {
            // Revalidate user cache
            revalidateTag(`user-${userId}`, "max");
        }

        return result;
    } catch (error: any) {
        console.error("Credit refund failed:", error);
        return { success: false, error: error.message };
    }
}
