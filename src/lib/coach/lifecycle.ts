import { prisma } from '@/lib/prisma';

/**
 * Lifecycle stages (2D matrix: maturity × measurability).
 * - "0"         冷启动：新站，靠本体 + 竞品驱动
 * - "unmeasured" 未被衡量：有内容规模但没接 GSC，强推连接 + 审计/竞品
 * - "1"         成长期：有真实展示，开始抢缺口
 * - "2"         规模期：稳定展示，扩量 + 衡量
 * - "2_scale"   规模化：大站，批量诊断/去重/救衰减
 */
export type OnboardingStage = '0' | 'unmeasured' | '1' | '2' | '2_scale';

/**
 * 阈值集中放这里——真实数据会推翻拍脑袋值，先给默认、可调。
 */
export const STAGE_THRESHOLDS = {
    /** !hasGSC：审计页数 ≥ 此值 → "unmeasured"（老站未被衡量），否则 "0" */
    coldPageCount: 30,
    /** hasGSC：近 30 天展示量分档 */
    impressionsStage1: 100,
    impressionsStage2: 5000,
    /** "2" 且页数超过此值 → "2_scale" */
    scalePageCount: 300,
    /** 展示量统计窗口（天） */
    windowDays: 30,
} as const;

export interface StageSignals {
    hasGsc: boolean;
    impressions30d: number;
    pageCount: number;
}

/**
 * 收集判定所需的真实信号。
 */
export async function collectStageSignals(siteId: string): Promise<StageSignals> {
    const since = new Date(Date.now() - STAGE_THRESHOLDS.windowDays * 24 * 60 * 60 * 1000);

    const [gsc, latestAudit, snapshotAgg, keywordAgg] = await Promise.all([
        prisma.gscConnection.findFirst({
            where: { siteId, propertyId: { not: null } },
            select: { id: true },
        }),
        prisma.siteAudit.findFirst({
            where: { siteId },
            orderBy: { createdAt: 'desc' },
            select: { pageCount: true },
        }),
        // 优先用时间序列快照（近 30 天 query 维度展示量）
        prisma.siteKeywordSnapshot.aggregate({
            where: { siteId, dimensionType: 'query', snapshotDate: { gte: since } },
            _sum: { impressions: true },
        }),
        // 退化：无快照时用当前关键词表的展示量
        prisma.siteKeyword.aggregate({
            where: { siteId },
            _sum: { impressions: true },
        }),
    ]);

    const impressions30d =
        snapshotAgg._sum.impressions ?? keywordAgg._sum.impressions ?? 0;

    return {
        hasGsc: !!gsc,
        impressions30d: impressions30d || 0,
        pageCount: latestAudit?.pageCount ?? 0,
    };
}

/**
 * 2D 矩阵判定。纯函数，便于测试。
 */
export function classifyStage(signals: StageSignals): OnboardingStage {
    const { hasGsc, impressions30d, pageCount } = signals;
    const T = STAGE_THRESHOLDS;

    if (!hasGsc) {
        return pageCount >= T.coldPageCount ? 'unmeasured' : '0';
    }

    if (impressions30d < T.impressionsStage1) return '0';
    if (impressions30d < T.impressionsStage2) return '1';

    return pageCount > T.scalePageCount ? '2_scale' : '2';
}

export async function determineSiteStage(siteId: string): Promise<OnboardingStage> {
    const signals = await collectStageSignals(siteId);
    return classifyStage(signals);
}

/**
 * 重算阶段并写回 Site；若发生跃迁则记录一个庆祝用的 CoachMove 事件（type: 'stage_transition'）。
 * 返回 { stage, transitioned }。
 */
export async function syncSiteStage(siteId: string): Promise<{ stage: OnboardingStage; transitioned: boolean }> {
    const [site, newStage] = await Promise.all([
        prisma.site.findUnique({ where: { id: siteId }, select: { onboardingStage: true } }),
        determineSiteStage(siteId),
    ]);

    const prevStage = site?.onboardingStage ?? '0';
    const transitioned = prevStage !== newStage;

    if (transitioned) {
        await prisma.site.update({
            where: { id: siteId },
            data: { onboardingStage: newStage },
        });
        // 记录跃迁事件（用于"🎉 进入成长期"庆祝 + 留存分析）
        await prisma.coachMove.create({
            data: {
                siteId,
                type: 'stage_transition',
                stage: newStage,
                status: 'done',
                evidence: { from: prevStage, to: newStage, at: new Date().toISOString() },
                payload: {},
                priority: 0,
                resolvedAt: new Date(),
            },
        }).catch(() => { /* 跃迁记录失败不阻断主流程 */ });
    }

    return { stage: newStage, transitioned };
}
