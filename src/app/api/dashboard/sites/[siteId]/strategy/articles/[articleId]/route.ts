import { NextResponse } from "next/server";
import { withSiteContext } from "@/lib/api-utils";
import prisma from "@/lib/prisma";
import { captureServerEvent } from "@/lib/analytics/posthog-server";

async function handler(
    req: Request,
    { params, site, session }: { params: { siteId: string, articleId: string }; site: any; session: any }
) {
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

        // 4. Activation funnel: action completed (article published)
        if (status === 'COMPLETED' && existingArticle.status !== 'COMPLETED') {
            const userId = (session.user as any).id;
            captureServerEvent(userId, 'first_action_completed', {
                action: 'article_published',
                siteId: siteId,
                articleId: articleId,
                title: existingArticle.title
            });
        }

        return NextResponse.json({ success: true, article: updatedArticle });

    } catch (error: any) {
        console.error("Failed to update Kanban article:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}

export const PATCH = withSiteContext<{ siteId: string, articleId: string }>(handler);
