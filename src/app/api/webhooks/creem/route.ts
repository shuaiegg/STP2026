import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

// Rate conversion: $1 (100 cents) = 100 credits
// Adjust this as needed
const CREDIT_CONVERSION_RATE = 1; 

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
    console.log(`Received Creem webhook event: ${event.type}`);

    // 3. Handle checkout.completed
    if (event.type === "checkout.completed") {
        const checkout = event.data;
        const userId = checkout.metadata?.userId;
        const amountPaidCents = checkout.order?.amount_paid || 0;
        const currency = checkout.order?.currency || "USD";

        if (!userId) {
            console.error("No userId found in checkout metadata", checkout.id);
            return NextResponse.json({ error: "User context missing" }, { status: 400 });
        }

        const creditsToGain = Math.floor(amountPaidCents * CREDIT_CONVERSION_RATE / 100);

        if (creditsToGain <= 0) {
            console.warn("Zero credits to gain from transaction", checkout.id);
            return NextResponse.json({ success: true, message: "No credits to add" });
        }

        try {
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
                        description: `Purchase of ${creditsToGain} credits via Creem.io (${currency} ${amountPaidCents/100})`
                    }
                })
            ]);

            console.log(`Successfully credited ${creditsToGain} credits to user ${userId}`);
            return NextResponse.json({ success: true });
        } catch (error) {
            console.error("Failed to process credit update:", error);
            return NextResponse.json({ error: "Database update failed" }, { status: 500 });
        }
    }

    // Return 200 for unhandled event types
    return NextResponse.json({ success: true, message: "Event ignored" });
}
