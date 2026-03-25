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
      },
    });
    return sites;
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
        audits: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            techScore: true,
            pageCount: true,
          }
        }
      }
    });

    if (!site) return null;

    return {
      ...site,
      latestAudit: site.audits[0] || null
    };
  } catch (error) {
    console.error("Error fetching site by id:", error);
    return null;
  }
}
