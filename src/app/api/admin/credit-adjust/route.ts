import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    // 1. Authenticate & Check Admin
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || (session.user as any).role !== 'ADMIN') {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // 2. Parse request body
    try {
        const body = await req.json();
        const { userId, amount, type, note } = body;

        if (!userId || !amount || !type || !note) {
            return NextResponse.json({ error: "Missing required fields (userId, amount, type, note)" }, { status: 400 });
        }

        if (!['REFUND', 'CONSUMPTION', 'BONUS'].includes(type)) {
            return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 });
        }

        // 3. Execute Adjustment in Transaction
        const result = await prisma.$transaction(async (tx) => {
            // Get current user to check balance
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { credits: true }
            });

            if (!user) throw new Error("User not found");

            // Prevent negative credits
            if (user.credits + amount < 0) {
                throw new Error(`Insufficient balance: User has ${user.credits} credits, cannot deduct ${Math.abs(amount)}`);
            }

            // Update user
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    credits: {
                        increment: amount
                    }
                }
            });

            // Create transaction record
            const transaction = await tx.creditTransaction.create({
                data: {
                    userId,
                    amount,
                    type,
                    description: note
                }
            });

            return { updatedUser, transaction };
        });

        return NextResponse.json({ 
            success: true, 
            newBalance: result.updatedUser.credits,
            transactionId: result.transaction.id 
        });

    } catch (error: any) {
        console.error("Credit adjustment failed:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 400 });
    }
}
