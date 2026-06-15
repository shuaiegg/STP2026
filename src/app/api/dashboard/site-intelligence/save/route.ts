import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { revalidateSiteCache } from '@/lib/site-intelligence/sites';
import { sendAuditCompleteEmail } from '@/lib/email';
import { addContact, getContactByEmail, addTagToContactByName } from '@/lib/email/systeme';
import { getTriggerTagName } from '@/lib/integrations/config';
import { getSemanticGap } from '@/lib/site-intelligence/semantic-gap-service';
import { syncSiteStage } from '@/lib/coach/lifecycle';
import { coachHomeTag } from '@/lib/coach/home';
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
        return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { domain, graphData, techScore, businessDna, issueReport, competitors, isCompetitor = false } = body;

        if (!domain || !graphData) {
            return NextResponse.json({ error: '缺失必要字段 (域名或图表数据)' }, { status: 400 });
        }

        let site = await prisma.site.findFirst({
            where: { userId: session.user.id, domain },
        });

        if (!site) {
            site = await prisma.site.create({
                data: {
                    userId: session.user.id,
                    domain,
                    name: domain,
                    isCompetitor: !!isCompetitor,
                },
            });
        }

        // Save Inferred Competitors
        if (competitors && Array.isArray(competitors)) {
            for (const comp of competitors) {
                try {
                    await prisma.competitor.upsert({
                        where: {
                            siteId_domain: {
                                siteId: site.id,
                                domain: comp.domain.toLowerCase()
                            }
                        },
                        update: { reason: comp.reason },
                        create: {
                            siteId: site.id,
                            domain: comp.domain.toLowerCase(),
                            reason: comp.reason
                        }
                    });
                } catch (e) {
                    console.error(`[SiteIntelligence Save] Failed to save competitor ${comp.domain}:`, e);
                }
            }
        }

        if (businessDna) {
            // Find latest version to increment
            const lastOntology = await prisma.siteOntology.findFirst({
                where: { siteId: site.id },
                orderBy: { version: 'desc' }
            });
            const nextVersion = (lastOntology?.version || 0) + 1;

            await prisma.siteOntology.create({
                data: {
                    siteId: site.id,
                    version: nextVersion,
                    coreOfferings: businessDna.coreOfferings || [],
                    targetAudience: businessDna.targetAudience || [],
                    painPointsSolved: businessDna.painPoints || [],
                    logicChains: businessDna.logicChains || [],
                    idealTopicMap: businessDna.idealTopicMap || [],
                }
            });
        }

        const pageCount = graphData?.nodes?.length ?? 0;

        const audit = await prisma.siteAudit.create({
            data: {
                siteId: site.id,
                status: 'done',
                techScore: techScore ?? null,
                pageCount,
                report: {
                    graphData,
                    techScore,
                    issueReport
                } as any,
            },
        });

        // Revalidate cache
        revalidateSiteCache(site.id);
        revalidateTag(coachHomeTag(site.id), 'max');

        // Post-save notifications (non-blocking, only for user's own sites)
        if (!isCompetitor) {
            const auditUser = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { email: true, name: true, locale: true },
            });

            // Trigger Semantic Gap Analysis asynchronously (cold start)
            getSemanticGap(site.id, true, auditUser?.locale || 'en').then(async () => {
                // After gap analysis, sync stage as it might have moved to Stage 1
                await syncSiteStage(site.id);
                // Bust coach home cache so the fresh gaps/stage surface on next load
                revalidateTag(coachHomeTag(site.id), 'max');
            }).catch((err) => {
                console.error('[SiteIntelligence Save] Failed to trigger initial semantic gap analysis:', err);
            });

            if (auditUser) {
                sendAuditCompleteEmail(auditUser, site.id, domain, techScore ?? null).catch((err) => {
                    console.error('[SiteIntelligence] Failed to send audit complete email:', err);
                });

                // Onboarding complete: tag in systeme.io if this is the user's first site
                const siteCount = await prisma.site.count({
                    where: { userId: session.user.id, isCompetitor: false },
                });
                if (siteCount === 1) {
                    getTriggerTagName('SYSTEME_TAG_ON_ONBOARDING', auditUser.locale).then(async (tagName) => {
                        if (!tagName) return;
                        const contactResult = await getContactByEmail(auditUser.email, auditUser.locale);
                        if (contactResult.ok) {
                            return addTagToContactByName(contactResult.contact.id, tagName, auditUser.locale);
                        }
                        return addContact(auditUser.email, auditUser.name || '', [tagName], auditUser.locale);
                    }).catch((err) => {
                        console.error('[SiteIntelligence] Failed to sync systeme.io onboarding tag:', err);
                    });
                }
            }
        }

        return NextResponse.json({
            success: true,
            siteId: site.id,
            auditId: audit.id
        });

    } catch (error: any) {
        console.error('[SiteIntelligence Save] Error:', error);
        return NextResponse.json({ error: error.message || '保存审计记录时发生错误' }, { status: 500 });
    }
}
