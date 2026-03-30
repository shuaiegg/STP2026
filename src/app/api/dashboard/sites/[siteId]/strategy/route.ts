import { NextResponse } from "next/server";
import { withSiteContext } from "@/lib/api-utils";
import prisma from "@/lib/prisma";

async function handler(
    req: Request,
    { params }: { params: { siteId: string }; site: any; session: any }
) {
    try {
        const { siteId } = params;

        // Fetch all ContentPlans for the current site, including their articles.
        // Order plans by priority (column order)
        // Order articles by kanbanOrder (vertical order within the column)
        const plans = await prisma.contentPlan.findMany({
            where: {
                siteId: siteId
            },
            orderBy: {
                priority: 'asc'
            },
            include: {
                articles: {
                    orderBy: {
                        kanbanOrder: 'asc'
                    }
                }
            }
        });

        return NextResponse.json({ success: true, data: plans }, {
            headers: {
                'Cache-Control': 'private, max-age=60, stale-while-revalidate=120'
            }
        });

    } catch (error: any) {
        console.error("Failed to fetch Strategy Kanban data:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}

export const GET = withSiteContext<{ siteId: string }>(handler);
