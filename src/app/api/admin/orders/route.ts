import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    // 1. Authenticate & Check Admin
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || (session.user as any).role !== 'ADMIN') {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    try {
        // 3. Query PURCHASE transactions
        const whereClause: any = {
            type: "PURCHASE"
        };

        if (email) {
            whereClause.user = {
                email: {
                    contains: email,
                    mode: 'insensitive'
                }
            };
        }

        const [purchases, totalCount] = await Promise.all([
            prisma.creditTransaction.findMany({
                where: whereClause,
                include: {
                    user: {
                        select: {
                            email: true,
                            name: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: limit
            }),
            prisma.creditTransaction.count({
                where: whereClause
            })
        ]);

        // 4. For each purchase, check if it's refunded
        // We'll look for any REFUND transaction that has the checkout ID in its description
        // This is necessary because Creem refund webhook provides a NEW refund ID as its externalId,
        // and only links back via the checkout_id in the payload which we store in the description.
        
        const results = await Promise.all(purchases.map(async (p) => {
            let isRefunded = false;
            
            if (p.externalId) {
                const refundRecord = await prisma.creditTransaction.findFirst({
                    where: {
                        type: "REFUND",
                        description: {
                            contains: p.externalId
                        }
                    }
                });
                isRefunded = !!refundRecord;
            }
            
            return {
                id: p.id,
                userId: p.userId,
                userEmail: p.user?.email,
                userName: p.user?.name,
                amount: p.amount,
                createdAt: p.createdAt,
                externalId: p.externalId,
                description: p.description,
                isRefunded
            };
        }));

        return NextResponse.json({
            orders: results,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        });

    } catch (error: any) {
        console.error("Failed to fetch orders:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
