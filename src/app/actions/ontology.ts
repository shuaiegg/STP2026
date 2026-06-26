'use server';

import { revalidateTag } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { coachHomeTag } from '@/lib/coach/home';
import { getSemanticGap } from '@/lib/site-intelligence/semantic-gap-service';

interface TopicEntry {
    topic: string;
    subtopics: string[];
}

interface SaveOntologyEditsInput {
    siteId: string;
    coreOfferings: string[];
    targetAudience: string[];
    painPointsSolved: string[];
    idealTopicMap: TopicEntry[];
}

export async function saveOntologyEdits(input: SaveOntologyEditsInput) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
        return { success: false, message: '未登录' };
    }

    const { siteId, coreOfferings, targetAudience, painPointsSolved, idealTopicMap } = input;

    const site = await prisma.site.findUnique({
        where: { id: siteId, userId: session.user.id },
    });
    if (!site) {
        return { success: false, message: '站点不存在或无权限' };
    }

    const lastOntology = await prisma.siteOntology.findFirst({
        where: { siteId },
        orderBy: { version: 'desc' },
    });

    const topicMapChanged = JSON.stringify(idealTopicMap) !== JSON.stringify(lastOntology?.idealTopicMap ?? []);

    const newOntology = await prisma.siteOntology.create({
        data: {
            siteId,
            version: (lastOntology?.version ?? 0) + 1,
            coreOfferings,
            targetAudience,
            painPointsSolved,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            idealTopicMap: idealTopicMap as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            logicChains: (lastOntology?.logicChains ?? []) as any,
            confirmedAt: new Date(),
        },
    });

    revalidateTag(coachHomeTag(siteId), 'max');

    if (topicMapChanged) {
        // 异步触发缺口重算，不阻塞响应。完成后再次失效缓存，
        // 否则新缺口要等 5 分钟 TTL 才出现在主页/蓝图。
        // 关键：传 locale，否则缺口 topic 与 idealTopicMap 语言不一致 → 蓝图 join 失败。
        const locale = (session.user as { locale?: string }).locale;
        getSemanticGap(siteId, true, locale)
            .then(() => revalidateTag(coachHomeTag(siteId), 'max'))
            .catch((e) =>
                console.error('[saveOntologyEdits] semantic gap refresh failed:', e),
            );
    }

    return {
        success: true,
        message: '业务基因已保存',
        data: { ontologyId: newOntology.id, version: newOntology.version },
    };
}
