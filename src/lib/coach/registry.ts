import { prisma } from '@/lib/prisma';
import { collectStageSignals, classifyStage, type OnboardingStage } from './lifecycle';

export type MoveType =
    | 'connect_gsc'
    | 'define_ontology'
    | 'add_competitor'
    | 'write_gap_high_intent'
    | 'internal_link_optimization'
    | 'refresh_decay_content'
    | 'distribute_to_social';

type Localized = { zh: string; en: string };

/** 单条招式的判定上下文（全部真实信号，一次性采集） */
export interface MoveContext {
    siteId: string;
    stage: OnboardingStage;
    hasGsc: boolean;
    hasOntology: boolean;
    competitorCount: number;
    gapCount: number;
    publishedCount: number;
    pageCount: number;
    impressions30d: number;
    /** 用户已忽略/暂缓的招式类型（渲染时跳过） */
    dismissedTypes: Set<string>;
    /** 用户已点击进行中的招式类型 */
    inProgressTypes: Set<string>;
    /** 业务本体（用于啊哈洞察） */
    ontology: { coreOfferings: string[]; targetAudience: string[] } | null;
    /** top 竞品 + 理由（用于啊哈洞察） */
    topCompetitor: { domain: string; reason: string | null } | null;
    /** top 缺口话题（用于啊哈洞察 + write_gap 理由） */
    topGap: string | null;
}

export interface MoveDetection {
    eligible: boolean;
    evidence: Record<string, unknown>;
    priority: number;
}

export interface MoveDefinition {
    type: MoveType;
    /** 地基层（gate 增长层） */
    foundation: boolean;
    stages: OnboardingStage[];
    title: Localized;
    /** 带真实数字的理由（模板 + 真实数字，AI 措辞推迟） */
    reason: (ev: Record<string, unknown>) => Localized;
    humanCTA: Localized;
    deepLink: string;
    detect: (ctx: MoveContext) => MoveDetection;
}

export const COACH_MOVES_REGISTRY: MoveDefinition[] = [
    {
        type: 'connect_gsc',
        foundation: true,
        stages: ['0', 'unmeasured', '1', '2', '2_scale'],
        title: { zh: '连接 Google Search Console', en: 'Connect Google Search Console' },
        reason: (ev) => ({
            zh: `已审计 ${ev.pageCount ?? 0} 个页面，但还没有真实排名数据——连接 GSC 才能衡量增长。`,
            en: `Audited ${ev.pageCount ?? 0} pages, but no real ranking data yet — connect GSC to measure growth.`,
        }),
        humanCTA: { zh: '立即连接', en: 'Connect now' },
        deepLink: '/dashboard/site-intelligence/[siteId]#integrations',
        detect: (ctx) => ({
            eligible: !ctx.hasGsc,
            evidence: { pageCount: ctx.pageCount },
            priority: ctx.stage === 'unmeasured' ? 120 : 100,
        }),
    },
    {
        type: 'define_ontology',
        foundation: true,
        stages: ['0', 'unmeasured'],
        title: { zh: '确认业务本体', en: 'Confirm business DNA' },
        reason: () => ({
            zh: 'AI 已初步提取业务本体，确认后所有策略与缺口分析都会更精准。',
            en: 'AI has drafted your business DNA — confirm it so every strategy is grounded in who you are.',
        }),
        humanCTA: { zh: '去确认', en: 'Review DNA' },
        deepLink: '/dashboard/site-intelligence/[siteId]#overview',
        detect: (ctx) => ({ eligible: !ctx.hasOntology, evidence: {}, priority: 90 }),
    },
    {
        type: 'add_competitor',
        foundation: true,
        stages: ['0', 'unmeasured', '1'],
        title: { zh: '完善竞争对手列表', en: 'Add more competitors' },
        reason: (ev) => ({
            zh: `已识别 ${ev.competitorCount ?? 0} 个竞品——再添加几个，AI 能发现更深的语义缺口。`,
            en: `${ev.competitorCount ?? 0} competitors identified — add more to surface deeper gaps.`,
        }),
        humanCTA: { zh: '添加域名', en: 'Add domains' },
        deepLink: '/dashboard/site-intelligence/[siteId]#competitors',
        detect: (ctx) => ({
            eligible: ctx.competitorCount < 3,
            evidence: { competitorCount: ctx.competitorCount },
            priority: 80,
        }),
    },
    {
        type: 'write_gap_high_intent',
        foundation: false,
        stages: ['0', 'unmeasured', '1', '2', '2_scale'],
        title: { zh: '抢占高意向流量缺口', en: 'Capture high-intent gaps' },
        reason: (ev) => ({
            zh: ev.topGap
                ? `竞品已覆盖「${ev.topGap}」等 ${ev.gapCount ?? 0} 个高转化话题，您还没有——这是最快的增量。`
                : `发现 ${ev.gapCount ?? 0} 个对手已覆盖、您尚未触达的高转化话题。`,
            en: ev.topGap
                ? `Competitors rank for "${ev.topGap}" and ${ev.gapCount ?? 0} other high-intent topics you don't.`
                : `Found ${ev.gapCount ?? 0} high-converting topics your competitors rank for but you don't.`,
        }),
        humanCTA: { zh: '开始写作', en: 'Start writing' },
        deepLink: '/dashboard/site-intelligence/[siteId]#strategy',
        detect: (ctx) => ({
            eligible: ctx.gapCount > 0,
            evidence: { gapCount: ctx.gapCount, topGap: ctx.topGap },
            priority: 95,
        }),
    },
    {
        type: 'internal_link_optimization',
        foundation: false,
        stages: ['1', '2', '2_scale'],
        title: { zh: '优化内链结构', en: 'Optimize internal links' },
        reason: (ev) => ({
            zh: `${ev.publishedCount ?? 0} 篇已发布内容之间的权重传递可以更强——优化内链提升核心页排名。`,
            en: `Strengthen authority flow across your ${ev.publishedCount ?? 0} published pieces.`,
        }),
        humanCTA: { zh: '查看建议', en: 'View links' },
        deepLink: '/dashboard/site-intelligence/[siteId]#audit',
        detect: (ctx) => ({
            eligible: ctx.publishedCount >= 3,
            evidence: { publishedCount: ctx.publishedCount },
            priority: 70,
        }),
    },
    {
        type: 'refresh_decay_content',
        foundation: false,
        stages: ['2', '2_scale'],
        title: { zh: '重构衰减内容', en: 'Refresh decaying content' },
        reason: (ev) => ({
            zh: `已积累 ${ev.publishedCount ?? 0} 篇内容，规模期建议定期翻新流量下滑的核心页。`,
            en: `With ${ev.publishedCount ?? 0} pieces live, refresh the ones losing traffic.`,
        }),
        humanCTA: { zh: '立即重构', en: 'Refresh now' },
        deepLink: '/dashboard/library',
        detect: (ctx) => ({
            eligible: ctx.publishedCount >= 5,
            evidence: { publishedCount: ctx.publishedCount },
            priority: 65,
        }),
    },
    {
        type: 'distribute_to_social',
        foundation: false,
        stages: ['2', '2_scale'],
        title: { zh: '多渠道分发', en: 'Distribute to social' },
        reason: (ev) => ({
            zh: `把 ${ev.publishedCount ?? 0} 篇优质文章一键转换为 LinkedIn / Twitter 帖文，放大每篇内容。`,
            en: `Turn your ${ev.publishedCount ?? 0} best articles into LinkedIn / Twitter posts.`,
        }),
        humanCTA: { zh: '去分发', en: 'Distribute' },
        deepLink: '/dashboard/tools/geo-writer',
        detect: (ctx) => ({
            eligible: ctx.publishedCount >= 3,
            evidence: { publishedCount: ctx.publishedCount },
            priority: 60,
        }),
    },
];

export interface ResolvedMove {
    /** 合成 id：siteId:type（招式渲染时不落库，只在用户操作时惰性落库） */
    id: string;
    siteId: string;
    type: MoveType;
    foundation: boolean;
    status: 'suggested' | 'in_progress';
    title: Localized;
    reason: Localized;
    humanCTA: Localized;
    deepLink: string;
    priority: number;
    evidence: Record<string, unknown>;
}

const ACTIVE_FOR_RENDER = ['dismissed', 'snoozed', 'in_progress'];

/**
 * 一次性采集全部判定信号（单个 Promise.all，全部并行）。
 * 关键：collectStageSignals 只调用一次，避免重复往返远程库。
 */
export async function buildMoveContext(siteId: string): Promise<MoveContext> {
    const [site, signals, competitorCount, gapCount, publishedCount, topComp, topDebt, userMoves] =
        await Promise.all([
            prisma.site.findUnique({
                where: { id: siteId },
                select: {
                    onboardingStage: true,
                    ontologies: {
                        take: 1,
                        orderBy: { version: 'desc' },
                        select: { coreOfferings: true, targetAudience: true },
                    },
                },
            }),
            collectStageSignals(siteId),
            prisma.competitor.count({ where: { siteId } }),
            prisma.semanticDebt.count({ where: { siteId } }),
            prisma.plannedArticle.count({ where: { contentPlan: { siteId }, status: 'COMPLETED' } }),
            prisma.competitor.findFirst({ where: { siteId }, select: { domain: true, reason: true } }),
            prisma.semanticDebt.findFirst({
                where: { siteId },
                orderBy: { coverageScore: 'asc' },
                select: { topic: true },
            }),
            prisma.coachMove.findMany({
                where: { siteId, status: { in: ACTIVE_FOR_RENDER } },
                select: { type: true, status: true },
            }),
        ]);

    const ontology = site?.ontologies?.[0]
        ? {
              coreOfferings: site.ontologies[0].coreOfferings ?? [],
              targetAudience: site.ontologies[0].targetAudience ?? [],
          }
        : null;

    return {
        siteId,
        // Compute stage live from real signals (not from stale DB value).
        // syncSiteStage() only runs on explicit events, so DB value can lag.
        stage: classifyStage(signals),
        hasGsc: signals.hasGsc,
        hasOntology: !!ontology,
        competitorCount,
        gapCount,
        publishedCount,
        pageCount: signals.pageCount,
        impressions30d: signals.impressions30d,
        dismissedTypes: new Set(
            userMoves.filter((m) => m.status === 'dismissed' || m.status === 'snoozed').map((m) => m.type),
        ),
        inProgressTypes: new Set(userMoves.filter((m) => m.status === 'in_progress').map((m) => m.type)),
        ontology,
        topCompetitor: topComp ? { domain: topComp.domain, reason: topComp.reason } : null,
        topGap: topDebt?.topic ?? null,
    };
}

/**
 * 纯内存计算 top 3 招式（无 DB 写入）。
 * 准备度门禁：地基层未完成时压低增长层。
 */
export function computeMoves(ctx: MoveContext): ResolvedMove[] {
    const eligible = COACH_MOVES_REGISTRY
        .filter((def) => def.stages.includes(ctx.stage))
        .map((def) => ({ def, detection: def.detect(ctx) }))
        .filter((e) => e.detection.eligible && !ctx.dismissedTypes.has(e.def.type));

    const foundationPending = eligible.some((e) => e.def.foundation);

    return eligible
        .map((e) => {
            const priority = foundationPending && !e.def.foundation
                ? e.detection.priority - 50
                : e.detection.priority;
            return {
                id: `${ctx.siteId}:${e.def.type}`,
                siteId: ctx.siteId,
                type: e.def.type,
                foundation: e.def.foundation,
                status: ctx.inProgressTypes.has(e.def.type) ? ('in_progress' as const) : ('suggested' as const),
                title: e.def.title,
                reason: e.def.reason(e.detection.evidence),
                humanCTA: e.def.humanCTA,
                deepLink: e.def.deepLink,
                priority,
                evidence: e.detection.evidence,
            } satisfies ResolvedMove;
        })
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3);
}

/** 便捷：采集 + 计算（渲染路径，零写入） */
export async function getActiveMoves(siteId: string): Promise<ResolvedMove[]> {
    const ctx = await buildMoveContext(siteId);
    return computeMoves(ctx);
}
