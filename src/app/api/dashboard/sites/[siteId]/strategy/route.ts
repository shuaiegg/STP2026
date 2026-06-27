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
                siteId: siteId,
                status: { not: 'ARCHIVED' } // 看板不显示已归档计划（如被新计划替换的旧版）
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

        // 陈旧检测：当前最新业务基因版本 vs 计划生成时所基于的版本。
        // 任一进行中的计划基于旧 DNA（或无来源记录）→ 提示用户刷新。
        const latestOntology = await prisma.siteOntology.findFirst({
            where: { siteId },
            orderBy: { version: 'desc' },
            select: { id: true },
        });
        const activePlans = plans.filter(p => p.status === 'IDEATION' || p.status === 'PLANNED');
        const stale = !!latestOntology && activePlans.length > 0 &&
            activePlans.some(p => p.sourceOntologyId !== latestOntology.id);

        return NextResponse.json({ success: true, data: plans, stale }, {
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
