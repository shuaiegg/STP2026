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
                // 仪表盘私有数据：实时性优先，避免生成计划后浏览器返回缓存的空响应
                'Cache-Control': 'no-store'
            }
        });

    } catch (error: any) {
        console.error("Failed to fetch Strategy Kanban data:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}

export const GET = withSiteContext<{ siteId: string }>(handler);
