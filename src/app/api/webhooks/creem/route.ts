import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
    const payload = await req.text();
    const signature = req.headers.get("creem-signature");
    const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error("CREEM_WEBHOOK_SECRET is not set");
        return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    // 1. Verify signature
    if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const computedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(payload)
        .digest("hex");

    if (computedSignature !== signature) {
        console.error("Invalid signature matched");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. Parse payload
    const event = JSON.parse(payload);
    // Creem uses eventType field
    const eventType = event.eventType;
    console.log(`Received Creem webhook event: ${eventType}`);

    // 3. Handle checkout.completed
    if (eventType === "checkout.completed") {
        const checkout = event.data;
        const userId = checkout.metadata?.userId;
        const creditsStr = checkout.metadata?.credits;

        if (!userId) {
            console.error("No userId found in checkout metadata", checkout.id);
            return NextResponse.json({ error: "User context missing" }, { status: 400 });
        }

        const creditsToGain = creditsStr ? parseInt(creditsStr, 10) : 0;

        if (!creditsToGain || isNaN(creditsToGain) || creditsToGain <= 0) {
            console.error("Zero credits or missing metadata.credits from transaction", checkout.id);
            return NextResponse.json({ error: "Invalid credits metadata" }, { status: 400 });
        }

        try {
            // Check for idempotency: if this transaction was already processed
            const existingPurchase = await prisma.creditTransaction.findFirst({
                where: {
                    externalId: checkout.id,
                    type: "PURCHASE"
                }
            });

            if (existingPurchase) {
                console.log(`Checkout ${checkout.id} already processed. Skipping.`);
                return NextResponse.json({ success: true, message: "Already processed" });
            }

            // Update user and record transaction in a single database transaction
            await prisma.$transaction([
                prisma.user.update({
                    where: { id: userId },
                    data: {
                        credits: {
                            increment: creditsToGain
                        }
                    }
                }),
                prisma.creditTransaction.create({
                    data: {
                        userId,
                        amount: creditsToGain,
                        type: "PURCHASE",
                        externalId: checkout.id,
                        description: `购买积分套餐: ${creditsToGain} 积分`
                    }
                })
            ]);

            // Revalidate user cache
            revalidateTag(`user-${userId}`, "max");

            console.log(`Successfully credited ${creditsToGain} credits to user ${userId}`);
            return NextResponse.json({ success: true });
        } catch (error) {
            console.error("Failed to process credit update:", error);
            return NextResponse.json({ error: "Database update failed" }, { status: 500 });
        }
    }

    // 4. Handle refund.created
    if (eventType === "refund.created") {
        const refund = event.data;
        const checkoutId = refund.checkout_id;
        const refundId = refund.id;

        try {
            // Find the original purchase transaction
            const purchaseTx = await prisma.creditTransaction.findFirst({
                where: {
                    externalId: checkoutId,
                    type: "PURCHASE"
                },
                include: {
                    user: true
                }
            });

            if (!purchaseTx || !purchaseTx.user) {
                console.warn(`Refund received for unknown checkout: ${checkoutId}`);
                return NextResponse.json({ success: true, message: "No matching purchase found" });
            }

            // Check if refund already processed (idempotency)
            const existingRefund = await prisma.creditTransaction.findFirst({
                where: {
                    externalId: refundId,
                    type: "REFUND"
                }
            });

            if (existingRefund) {
                return NextResponse.json({ success: true, message: "Refund already processed" });
            }

            const amountToDeduct = purchaseTx.amount;
            const currentCredits = purchaseTx.user.credits;
            // Ensure credits don't go below 0
            const actualDeduction = Math.min(amountToDeduct, currentCredits);

            await prisma.$transaction([
                prisma.user.update({
                    where: { id: purchaseTx.userId },
                    data: {
                        credits: {
                            decrement: actualDeduction
                        }
                    }
                }),
                prisma.creditTransaction.create({
                    data: {
                        userId: purchaseTx.userId,
                        amount: -amountToDeduct, // Record the full refund amount even if deduction was capped
                        type: "REFUND",
                        externalId: refundId,
                        description: `订单退款扣除: ${amountToDeduct} 积分 (关联订单: ${checkoutId})`
                    }
                })
            ]);

            // Revalidate user cache
            revalidateTag(`user-${purchaseTx.userId}`, "max");

            console.log(`Processed refund ${refundId} for user ${purchaseTx.userId}, deducted ${actualDeduction} credits`);
            return NextResponse.json({ success: true });
        } catch (error) {
            console.error("Failed to process refund:", error);
            return NextResponse.json({ error: "Refund processing failed" }, { status: 500 });
        }
    }

    // Return 200 for unhandled event types
    return NextResponse.json({ success: true, message: "Event ignored" });
}
