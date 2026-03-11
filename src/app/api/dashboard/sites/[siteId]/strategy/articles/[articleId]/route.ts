import { NextRequest, NextResponse } from "next/server";
import { withSiteContext } from "@/lib/api-utils";
import prisma from "@/lib/prisma";

async function handler(
    req: NextRequest,
    { params }: { params: { siteId: string, articleId: string } },
    site: any
) {
    if (req.method !== 'PATCH') {
        return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const { siteId, articleId } = params;
        const body = await req.json();

        // Allowed fields to update via drag & drop
        const { status, kanbanOrder, contentPlanId } = body;

        // 1. Verify the article belongs to a plan under this site
        const existingArticle = await prisma.plannedArticle.findFirst({
            where: {
                id: articleId,
                contentPlan: {
                    siteId: siteId
                }
            }
        });

        if (!existingArticle) {
            return NextResponse.json({ error: "Article not found or access denied." }, { status: 404 });
        }

        // 2. Prepare update data
        const updateData: any = {};
        if (status) updateData.status = status;
        if (typeof kanbanOrder === 'number') updateData.kanbanOrder = kanbanOrder;

        // If moving to a different pillar (column)
        if (contentPlanId && contentPlanId !== existingArticle.contentPlanId) {
            // Verify new plan belongs to the site
            const targetPlan = await prisma.contentPlan.findFirst({
                where: { id: contentPlanId, siteId: siteId }
            });
            if (!targetPlan) {
                return NextResponse.json({ error: "Target plan not found." }, { status: 400 });
            }
            updateData.contentPlanId = contentPlanId;
        }

        // 3. Execute update
        const updatedArticle = await prisma.plannedArticle.update({
            where: { id: articleId },
            data: updateData
        });

        // 4. (Optional but recommended) If kanbanOrder changed, you might need 
        // a transaction to shift other articles' orders down. For MVP drag&drop libraries 
        // like @hello-pangea/dnd, they often send exact index updates, so simply updating 
        // the single card's index is usually handled by the frontend sorting logic.

        return NextResponse.json({ success: true, article: updatedArticle });

    } catch (error: any) {
        console.error("Failed to update Kanban article:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}

export const PATCH = withSiteContext(handler);
