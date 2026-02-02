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
                    description: `Admin manual adjustment: ${reason} (by ${adminSession.user.email})`
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
