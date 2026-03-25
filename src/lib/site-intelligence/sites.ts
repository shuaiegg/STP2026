import { prisma } from "@/lib/prisma";

export async function getInitialSites(userId: string) {
  try {
    const sites = await prisma.site.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        domain: true,
        name: true,
        isCompetitor: true,
        audits: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            techScore: true,
            contentScore: true,
            geoScore: true,
          }
        }
      },
    });
    return sites.map(site => ({
      id: site.id,
      domain: site.domain,
      name: site.name,
      isCompetitor: site.isCompetitor,
      latestHealthScore: site.audits[0] 
        ? Math.round(((site.audits[0].techScore || 0) + (site.audits[0].contentScore || 0) + (site.audits[0].geoScore || 0)) / 3)
        : null
    }));
  } catch (error) {
    console.error("Error fetching initial sites:", error);
    return [];
  }
}

export async function getSiteById(siteId: string, userId: string) {
  try {
    const site = await prisma.site.findUnique({
      where: { id: siteId, userId },
      select: {
        id: true,
        domain: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            gscConnections: true,
            ga4Connections: true,
            competitors: true,
            contentPlans: true,
          }
        },
        audits: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            techScore: true,
            contentScore: true,
            geoScore: true,
            pageCount: true,
          }
        }
      }
    });

    if (!site) return null;

    return {
      id: site.id,
      domain: site.domain,
      name: site.name,
      createdAt: site.createdAt,
      hasGsc: site._count.gscConnections > 0,
      hasGa4: site._count.ga4Connections > 0,
      hasCompetitors: site._count.competitors > 0,
      hasContentPlan: site._count.contentPlans > 0,
      latestAudit: site.audits[0] ? {
        ...site.audits[0],
        overallScore: Math.round(((site.audits[0].techScore || 0) + (site.audits[0].contentScore || 0) + (site.audits[0].geoScore || 0)) / 3)
      } : null
    };
  } catch (error) {
    console.error("Error fetching site by id:", error);
    return null;
  }
}
