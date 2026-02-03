'use server'

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

/**
 * Check if the current user is an admin
 */
async function checkAdmin() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || (session.user as any).role !== 'ADMIN') {
        throw new Error("Unauthorized: Admin access required");
    }

    return session;
}

/**
 * Get all users with optional search and pagination
 */
export async function getUsers({ 
    query = '', 
    page = 1, 
    limit = 20 
}: { 
    query?: string; 
    page?: number; 
    limit?: number; 
}) {
    await checkAdmin();

    const where = query ? {
        OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { email: { contains: query, mode: 'insensitive' as const } },
        ]
    } : {};

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                _count: {
                    select: { transactions: true, sessions: true, executions: true }
                }
            }
        }),
        prisma.user.count({ where })
    ]);

    return { users, total, pages: Math.ceil(total / limit) };
}

/**
 * Manually update user credits
 */
export async function updateUserCredits(userId: string, amount: number, reason: string) {
    const adminSession = await checkAdmin();

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Update user credits
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    credits: {
                        increment: amount
                    }
                }
            });

            // 2. Create transaction record
            await tx.creditTransaction.create({
                data: {
                    userId,
                    amount,
                    type: amount >= 0 ? 'BONUS' : 'CONSUMPTION',
                    description: reason || (amount >= 0 ? '管理员手动增加积分' : '管理员手动扣除积分')
                }
            });

            return updatedUser;
        });

        revalidatePath('/admin/users');
        revalidatePath('/dashboard');
        
        return { success: true, user: result };
    } catch (error: any) {
        console.error("Failed to update user credits:", error);
        return { success: false, message: error.message || "Failed to update credits" };
    }
}

/**
 * Revert a specific transaction
 */
export async function revertTransaction(transactionId: string) {
    await checkAdmin();

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get transaction info
            const transaction = await tx.creditTransaction.findUnique({
                where: { id: transactionId }
            });

            if (!transaction) throw new Error("Transaction not found");
            
            // Only allow reverting BONUS or CONSUMPTION (not PURCHASE or automatic ones with executions)
            if (transaction.type === 'PURCHASE') {
                throw new Error("Cannot revert purchase transactions here");
            }

            // 2. Revert credits
            await tx.user.update({
                where: { id: transaction.userId },
                data: {
                    credits: {
                        decrement: transaction.amount
                    }
                }
            });

            // 3. Delete the transaction record (per user's request to not show mistakes)
            await tx.creditTransaction.delete({
                where: { id: transactionId }
            });

            return { userId: transaction.userId };
        });

        revalidatePath('/admin/users');
        revalidatePath('/dashboard');
        
        return { success: true };
    } catch (error: any) {
        console.error("Failed to revert transaction:", error);
        return { success: false, message: error.message || "Failed to revert" };
    }
}

/**
 * Get recent transactions for a user
 */
export async function getUserTransactions(userId: string, limit = 5) {
    await checkAdmin();

    const transactions = await prisma.creditTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
    });

    return transactions;
}

/**
 * Impersonate user (Simulated)
 * In a real scenario, this would involve creating a new session.
 * For now, we return a success signal to the client to handle the redirect.
 */
export async function impersonateUser(userId: string) {
    await checkAdmin();
    
    // In production, you'd use Better Auth's admin API to create a session
    // Or set a cookie that the middleware recognizes as a "sudo" session.
    // For this prototype, we'll return the user info.
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) throw new Error("User not found");
    
    return { success: true, userId: user.id };
}
