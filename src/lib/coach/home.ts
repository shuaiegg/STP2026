import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { buildMoveContext, computeMoves, type ResolvedMove, type MoveContext } from './registry';
import type { OnboardingStage } from './lifecycle';

export const coachHomeTag = (siteId: string) => `coach-home-${siteId}`;


export interface PulseStat {
    value: number;
    /** GSC 未连时这类指标不可得，渲染为"连接后显示"而非伪造 */
    available: boolean;
}

export interface CoachInsight {
    /** 一句"懂你的业务 + 一个机会"的啊哈洞察（双语） */
    zh: string;
    en: string;
}

export interface GrowthHomeData {
    stage: OnboardingStage;
    insight: CoachInsight | null;
    moves: ResolvedMove[];
    pulse: {
        publishedThisMonth: PulseStat;
        gapOpportunities: PulseStat;
        impressions30d: PulseStat;
    };
    /**
     * GSC has been connected and property selected, but snapshot data is still
     * backfilling. False once data arrives or the sync window has elapsed.
     */
    syncing: boolean;
}

/**
 * 啊哈时刻：基于本体（懂你）+ 竞品/缺口（懂市场）+ GSC 真实排名合成一句具体洞察。
 * 优先级：真实排名发现 > ontology+gap+comp > ontology+gap > ontology+comp > ontology only
 */
function buildInsight(ctx: MoveContext, nearFirstPage?: { keyword: string; position: number; impressions: number } | null): CoachInsight | null {
    const offering = ctx.ontology?.coreOfferings?.[0]?.trim();
    const comp = ctx.topCompetitor?.domain;
    const gap = ctx.topGap;

    // Real ranking discovery: highest-priority when GSC data exists
    if (nearFirstPage && ctx.impressions30d > 0) {
        const pos = Math.round(nearFirstPage.position);
        if (offering) {
            return {
                zh: `您专注于「${offering}」，已在「${nearFirstPage.keyword}」排名第 ${pos} 位——距第一页仅一步之遥，这是最快的提升机会。`,
                en: `You focus on "${offering}" and rank #${pos} for "${nearFirstPage.keyword}" — one push away from page one.`,
            };
        }
        return {
            zh: `您在「${nearFirstPage.keyword}」排名第 ${pos} 位，距第一页仅一步之遥——这是您最快的提升机会。`,
            en: `You rank #${pos} for "${nearFirstPage.keyword}" — one push away from page one. That's your fastest win.`,
        };
    }

    if (offering && gap && comp) {
        return {
            zh: `您专注于「${offering}」。${comp} 已经在「${gap}」上建立了内容，而您还没有——这是您最快的增量机会。`,
            en: `You focus on "${offering}". ${comp} already ranks for "${gap}" while you don't — that's your fastest opening.`,
        };
    }
    if (offering && gap) {
        return {
            zh: `您专注于「${offering}」。市场上「${gap}」的需求尚未被您覆盖——这是值得抢占的第一个缺口。`,
            en: `You focus on "${offering}". Demand around "${gap}" is uncovered on your site — a gap worth capturing first.`,
        };
    }
    if (offering && comp) {
        return {
            zh: `您专注于「${offering}」。我们已锁定竞品 ${comp}，下一步就能找出他们覆盖、而您缺失的话题。`,
            en: `You focus on "${offering}". We've pinned ${comp} as a competitor — next we surface what they cover and you miss.`,
        };
    }
    if (offering) {
        return {
            zh: `已读懂您的业务核心是「${offering}」。确认本体并添加竞品，即可生成专属增长机会。`,
            en: `We've read your core as "${offering}". Confirm your DNA and add competitors to unlock tailored opportunities.`,
        };
    }
    return null;
}

async function computeGrowthHomeData(siteId: string): Promise<GrowthHomeData> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [ctx, publishedThisMonth, gscConnection, snapshotCount, nearFirstPageKwd] = await Promise.all([
        buildMoveContext(siteId),
        prisma.plannedArticle.count({
            where: { contentPlan: { siteId }, status: 'COMPLETED', updatedAt: { gte: monthStart } },
        }),
        // lastSyncAt is null before first sync completes — used to detect the syncing window
        prisma.gscConnection.findFirst({
            where: { siteId, propertyId: { not: null } },
            select: { lastSyncAt: true },
        }),
        // Check if any snapshots exist yet
        prisma.siteKeywordSnapshot.count({ where: { siteId } }),
        // Keyword closest to first page (positions 11–20) with meaningful impressions
        prisma.siteKeyword.findFirst({
            where: { siteId, position: { gte: 11, lte: 20 }, impressions: { gt: 0 } },
            orderBy: { position: 'asc' },
            select: { keyword: true, position: true, impressions: true },
        }),
    ]);

    // syncing = GSC property selected but initial sync hasn't completed yet (lastSyncAt is still null)
    const syncing = ctx.hasGsc && snapshotCount === 0 && gscConnection?.lastSyncAt === null;

    return {
        stage: ctx.stage,
        insight: buildInsight(ctx, nearFirstPageKwd && nearFirstPageKwd.position !== null && nearFirstPageKwd.impressions !== null
            ? { keyword: nearFirstPageKwd.keyword, position: nearFirstPageKwd.position, impressions: nearFirstPageKwd.impressions }
            : null),
        moves: computeMoves(ctx),
        pulse: {
            publishedThisMonth: { value: publishedThisMonth, available: true },
            gapOpportunities: { value: ctx.gapCount, available: true },
            impressions30d: { value: ctx.impressions30d, available: ctx.hasGsc },
        },
        syncing,
    };
}

/**
 * 增长主页数据源：单次信号采集 → 派生 阶段 / 洞察 / 招式 / 诚实动量。
 * 渲染路径零写入（招式仅在用户操作时惰性落库）。
 * 结果按站点缓存（远程库高延迟下重复访问秒开），coach 动作经 revalidateTag 失效。
 */
export async function getGrowthHomeData(siteId: string): Promise<GrowthHomeData> {
    return unstable_cache(
        () => computeGrowthHomeData(siteId),
        ['coach-home', siteId],
        { revalidate: 300, tags: [coachHomeTag(siteId)] },
    )();
}
