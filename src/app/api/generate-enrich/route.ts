
import { StellarEnricher } from '@/lib/skills/skills/stellar/StellarEnricher';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { content, title, description, keyword, entities, relatedTopics } = await req.json();

        if (!content) {
            return NextResponse.json({ error: 'Missing content' }, { status: 400 });
        }

        const enrichment = await StellarEnricher.enrich(
            content, 
            title || 'Untitled', 
            description || '', 
            keyword || '',
            entities || [],
            relatedTopics || []
        );

        return NextResponse.json(enrichment);
    } catch (error: any) {
        console.error('Enrichment API Error:', error);
        return NextResponse.json({ error: 'Enrichment failed', message: error.message }, { status: 500 });
    }
}
