import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CREDIT_PRODUCTS } from "@/lib/billing/products";

export async function POST(req: Request) {
    // 1. Authenticate user
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request body
    try {
        const body = await req.json();
        const { productId } = body;

        if (!productId) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
        }

        // 3. Find product
        const product = CREDIT_PRODUCTS.find((p) => p.productId === productId);
        if (!product) {
            return NextResponse.json({ error: "Invalid product" }, { status: 400 });
        }

        // 4. Check API Key
        const apiKey = process.env.CREEM_API_KEY;
        if (!apiKey) {
            console.error("CREEM_API_KEY is not set");
            return NextResponse.json({ error: "Billing configuration error" }, { status: 500 });
        }

        // 5. Call Creem API
        const baseUrl = process.env.CREEM_API_URL ?? "https://api.creem.io";
        const response = await fetch(`${baseUrl}/v1/checkouts`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
            },
            body: JSON.stringify({
                product_id: product.productId,
                metadata: {
                    userId: session.user.id,
                    credits: product.credits.toString(),
                },
                success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=1`,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Creem API error:", data);
            return NextResponse.json({ error: data.message || "Failed to create checkout" }, { status: response.status });
        }

        return NextResponse.json({ checkoutUrl: data.checkout_url });
    } catch (error) {
        console.error("Checkout creation failed:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
