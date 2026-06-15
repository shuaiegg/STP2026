'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath, revalidateTag } from 'next/cache';
import { coachHomeTag } from '@/lib/coach/home';

/** 校验当前用户拥有该站点 */
async function authorizeSite(siteId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { ok: false as const, error: 'Unauthorized' };

    const site = await prisma.site.findUnique({ where: { id: siteId }, select: { userId: true } });
    if (!site) return { ok: false as const, error: 'Not found' };
    if (site.userId !== session.user.id) return { ok: false as const, error: 'Forbidden' };
    return { ok: true as const };
}

/**
 * 招式在渲染时不落库（合成 id = siteId:type），用户操作时才惰性落库一条实例。
 * 同一 (siteId, type) 只保留一条可变实例。
 */
async function upsertMoveStatus(siteId: string, type: string, status: string, resolved: boolean) {
    const authz = await authorizeSite(siteId);
    if (!authz.ok) return { success: false, error: authz.error };

    const existing = await prisma.coachMove.findFirst({
        where: { siteId, type, status: { in: ['suggested', 'in_progress', 'dismissed', 'snoozed'] } },
        select: { id: true },
    });

    if (existing) {
        await prisma.coachMove.update({
            where: { id: existing.id },
            data: { status, ...(resolved ? { resolvedAt: new Date() } : {}) },
        });
    } else {
        await prisma.coachMove.create({
            data: {
                siteId,
                type,
                stage: '0',
                status,
                evidence: {},
                payload: {},
                priority: 0,
                ...(resolved ? { resolvedAt: new Date() } : {}),
            },
        });
    }

    revalidateTag(coachHomeTag(siteId), 'max');
    revalidatePath('/dashboard');
    return { success: true };
}

/** 用户忽略一条建议（暂不重复推荐，直到触发条件消失） */
export async function dismissCoachMove(siteId: string, type: string) {
    return upsertMoveStatus(siteId, type, 'dismissed', true);
}

/** 用户点击开始执行（深链跳转时标记进行中） */
export async function startCoachMove(siteId: string, type: string) {
    return upsertMoveStatus(siteId, type, 'in_progress', false);
}

/** 标记完成 */
export async function completeCoachMove(siteId: string, type: string) {
    return upsertMoveStatus(siteId, type, 'done', true);
}
