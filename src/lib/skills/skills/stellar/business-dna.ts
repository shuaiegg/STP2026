import prisma from '@/lib/prisma';

export interface BusinessDNA {
    coreOfferings: string[];
    targetAudience: string[];
    painPointsSolved: string[];
    positioning: string[];
    brandTone: string | null;
}

/** 取站点最新 SiteOntology，提取写作所需字段。无记录或字段全空返回 null。 */
export async function getBusinessDNA(siteId: string): Promise<BusinessDNA | null> {
    try {
        const ontology = await prisma.siteOntology.findFirst({
            where: { siteId },
            orderBy: { version: 'desc' },
            select: {
                coreOfferings: true,
                targetAudience: true,
                painPointsSolved: true,
                positioning: true,
                brandTone: true,
            },
        });

        if (!ontology) return null;

        const { coreOfferings, targetAudience, painPointsSolved } = ontology;
        if (coreOfferings.length === 0 && targetAudience.length === 0 && painPointsSolved.length === 0) {
            return null;
        }

        return {
            coreOfferings,
            targetAudience,
            painPointsSolved,
            positioning: ontology.positioning ?? [],
            brandTone: ontology.brandTone ?? null,
        };
    } catch {
        return null;
    }
}
