/**
 * P2 验证脚本 — business-dna-into-content
 *
 * 隔离 UI / LLM / credits，直接验证：
 *   1) getBusinessDNA(siteId) 能否从真实 SiteOntology 取出三要素
 *   2) StrategyComposer.compose 在有 DNA 时注入 <business_dna> 段（zh / en 各一）
 *   3) 无 DNA 时优雅降级（systemPrompt 不含 <business_dna>）
 *
 * 运行：npx tsx scripts/verify-business-dna.ts [可选 siteId]
 */
import { prisma } from '../src/lib/prisma';
import { getBusinessDNA } from '../src/lib/skills/skills/stellar/business-dna';
import { StrategyComposer } from '../src/lib/skills/skills/stellar/StrategyComposer';
import type { IntelligenceContext } from '../src/lib/skills/skills/stellar/types';

function baseCtx(keywords: string): IntelligenceContext {
    return {
        keywords,
        location: 'United States',
        language: 'en',
        entities: [],
        topics: [],
        competitors: [],
        internalContent: [],
        timestamp: Date.now(),
    };
}

function assert(label: string, cond: boolean) {
    console.log(`  ${cond ? '✅ PASS' : '❌ FAIL'} — ${label}`);
    if (!cond) process.exitCode = 1;
}

async function main() {
    const argSiteId = process.argv[2];

    // 选一个有 ontology 的真实站点（命令行未指定时）
    let siteId = argSiteId;
    if (!siteId) {
        const ont = await prisma.siteOntology.findFirst({
            orderBy: { version: 'desc' },
            select: { siteId: true },
        });
        if (!ont) {
            console.error('❌ 库中没有任何 SiteOntology，请先 onboarding 一个站点，或传入 siteId 参数。');
            process.exit(1);
        }
        siteId = ont.siteId;
    }

    const site = await prisma.site.findUnique({ where: { id: siteId }, select: { domain: true } });
    console.log(`\n=== 测试站点: ${site?.domain ?? '(未知)'} (${siteId}) ===\n`);

    // ── 1. getBusinessDNA ────────────────────────────────────────────────
    console.log('1) getBusinessDNA(siteId)');
    const dna = await getBusinessDNA(siteId);
    if (!dna) {
        console.log('  ⚠️ 该站点无可用 DNA（ontology 缺失或三字段全空）——仅能验证降级路径。');
    } else {
        console.log('  coreOfferings  :', dna.coreOfferings);
        console.log('  targetAudience :', dna.targetAudience);
        console.log('  painPointsSolved:', dna.painPointsSolved);
        assert('DNA 至少含一个非空要素', dna.coreOfferings.length + dna.targetAudience.length + dna.painPointsSolved.length > 0);
    }

    // ── 2. 注入（zh / en） ────────────────────────────────────────────────
    if (dna) {
        console.log('\n2a) compose — 中文关键词（应注入中文 <business_dna>）');
        const zhPrompt = StrategyComposer.compose(baseCtx('企业出海 SEO 优化'), { businessDna: dna }).systemPrompt;
        assert('systemPrompt 含 <business_dna>', zhPrompt.includes('<business_dna>'));
        assert('为中文表述（含「核心服务/产品」）', zhPrompt.includes('核心服务/产品') || zhPrompt.includes('目标受众') || zhPrompt.includes('解决的核心痛点'));
        assert('含强化写作指令（以目标受众为读者对象）', zhPrompt.includes('以「目标受众」为明确读者对象'));
        assert('保留不promo约束', zhPrompt.includes('不得违反客观性约束') || zhPrompt.includes('绝不变成对该企业的推销'));
        console.log('  ----- <business_dna> 段 -----');
        console.log('  ' + (zhPrompt.split('<business_dna>')[1] ?? '').split('</business_dna>')[0].trim().split('\n').join('\n  '));

        console.log('\n2b) compose — 英文关键词（应注入英文 <business_dna>）');
        const enPrompt = StrategyComposer.compose(baseCtx('enterprise SEO for global expansion'), { businessDna: dna }).systemPrompt;
        assert('systemPrompt 含 <business_dna>', enPrompt.includes('<business_dna>'));
        assert('为英文表述（含 "Core offerings"）', /Core offerings|Target audience|Pain points/.test(enPrompt));
    }

    // ── 3. 降级（无 DNA） ─────────────────────────────────────────────────
    console.log('\n3) compose — businessDna=null（应降级，无 <business_dna>）');
    const nullPrompt = StrategyComposer.compose(baseCtx('generic seo topic'), { businessDna: null }).systemPrompt;
    assert('systemPrompt 不含 <business_dna>', !nullPrompt.includes('<business_dna>'));
    assert('降级后仍保留 <personalization>', nullPrompt.includes('<personalization>'));
    assert('降级后仍保留客观性约束（Banned_Words）', nullPrompt.includes('Banned_Words'));

    console.log(`\n=== 完成 ${process.exitCode ? '（有 FAIL）' : '（全部 PASS）'} ===\n`);
    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
