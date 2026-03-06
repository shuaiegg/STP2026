
import { StellarEnricher } from '@/lib/skills/skills/stellar/StellarEnricher';
import { StellarAuditor } from '@/lib/skills/skills/stellar/StellarAuditor';
import { StellarEditor } from '@/lib/skills/skills/stellar/StellarEditor';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { content, title, description, keyword, entities, relatedTopics, autoVisuals } = await req.json();

        if (!content) {
            return NextResponse.json({ error: 'Missing content' }, { status: 400 });
        }

        const enrichArgs: [string, string, string, string, string[], string[], string, boolean] = [
            content,
            title || 'Untitled',
            description || '',
            keyword || '',
            entities || [],
            relatedTopics || [],
            'ScaleToTop',
            autoVisuals !== undefined ? autoVisuals : true,
        ];

        // Step 1: Initial enrichment (SEO Score + Schema + Links + Images)
        let enrichment = await StellarEnricher.enrich(...enrichArgs);

        // Step 2: Auditor — evaluate content against SEO/GEO heuristics (synchronous, fast)
        const intelligenceCtx = {
            keywords: keyword || '',
            location: '',
            entities: entities || [],
            topics: relatedTopics || [],
            serpAnalysis: {},
            competitors: [],
            language: 'en',
            timestamp: Date.now(),
            internalContent: [],
        };

        const auditReport = StellarAuditor.evaluate(
            enrichment.content,
            title || 'Untitled',
            description || '',
            intelligenceCtx as any
        );

        console.log(`🔍 [generate-enrich] Audit: needsRevision=${auditReport.needsRevision}, SEO=${auditReport.scores.seo}, GEO=${auditReport.scores.geo}`);

        // Step 3: Editor — only if audit says content needs improvement (adds 15-30s)
        if (auditReport.needsRevision && auditReport.weaknesses.length > 0) {
            console.log(`✏️ [generate-enrich] Triggering Editor for ${auditReport.weaknesses.length} weakness(es)...`);

            const EDITOR_TIMEOUT_MS = 50_000;
            const editorTask = StellarEditor.revise(enrichment.content, auditReport, intelligenceCtx as any);
            const timeout = new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('Editor timed out')), EDITOR_TIMEOUT_MS)
            );

            const revisedContent = await Promise.race([editorTask, timeout])
                .catch((err) => {
                    console.warn(`⚠️ [generate-enrich] Editor skipped: ${err.message}`);
                    return null;
                });

            if (revisedContent && typeof revisedContent === 'string' && revisedContent.length > enrichment.content.length * 0.5) {
                // Step 4: Re-score the revised content for accurate final scores
                console.log(`📊 [generate-enrich] Re-scoring revised content...`);
                enrichment = await StellarEnricher.enrich(
                    revisedContent,
                    title || 'Untitled',
                    description || '',
                    keyword || '',
                    entities || [],
                    relatedTopics || [],
                    'ScaleToTop',
                    autoVisuals !== undefined ? autoVisuals : true,
                );
                console.log(`✅ [generate-enrich] Re-score complete. Final SEO=${enrichment.scores.seo}, GEO=${enrichment.scores.geo}`);
            }
        } else {
            console.log(`✅ [generate-enrich] Content passed audit. No revision needed.`);
        }

        return NextResponse.json(enrichment);
    } catch (error: any) {
        console.error('Enrichment API Error:', error);
        return NextResponse.json({ error: 'Enrichment failed', message: error.message }, { status: 500 });
    }
}
