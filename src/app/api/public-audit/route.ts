import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { CrawlerService, CrawlerCircuitBreakerError } from '@/lib/skills/site-intelligence/crawler.service';
import { fetchSiteSignals } from '@/lib/skills/site-intelligence/crawler/fetcher';
import { analyzeAudit, AuditIssueReport } from '@/lib/skills/site-intelligence/audit-analyzer';
import { GeoSiteSignals } from '@/lib/skills/site-intelligence/types';

// ─── Rate limiting (in-memory, per-process) ─────────────────────────────────
const IP_RATE_LIMIT = 5;
const IP_RATE_WINDOW = 60 * 60 * 1000; // 1 hour
const ipRequests = new Map<string, number[]>();

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const requests = (ipRequests.get(ip) ?? []).filter(t => now - t < IP_RATE_WINDOW);
  if (requests.length >= IP_RATE_LIMIT) return false;
  requests.push(now);
  ipRequests.set(ip, requests);
  return true;
}

// ─── Domain cache (in-memory, short TTL) ────────────────────────────────────
const DOMAIN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
interface CachedAudit {
  issueReport: AuditIssueReport;
  pageCount: number;
  psiScore: number | null;
  timestamp: number;
}
const domainCache = new Map<string, CachedAudit>();

function getCached(domain: string): CachedAudit | null {
  const entry = domainCache.get(domain);
  if (entry && Date.now() - entry.timestamp < DOMAIN_CACHE_TTL) return entry;
  domainCache.delete(domain);
  return null;
}

function setCache(domain: string, data: Omit<CachedAudit, 'timestamp'>): void {
  domainCache.set(domain, { ...data, timestamp: Date.now() });
}

// ─── Public page limit ───────────────────────────────────────────────────────
const PUBLIC_PAGE_LIMIT = 20;

// ─── SSE helper ─────────────────────────────────────────────────────────────
function sse(event: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

export async function POST(request: Request) {
  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? hdrs.get('x-real-ip')
    ?? 'unknown';

  // Rate limit check
  if (!checkIpRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  let body: { domain?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.domain || typeof body.domain !== 'string') {
    return NextResponse.json({ error: 'domain is required' }, { status: 400 });
  }

  const domain = CrawlerService.normalizeDomain(body.domain.trim());

  // Validate it looks like a real domain
  try {
    const u = new URL(domain);
    if (!u.hostname.includes('.')) throw new Error('not a domain');
  } catch {
    return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
  }

  // SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        // Return cached result immediately
        const cached = getCached(domain);
        if (cached) {
          send({ type: 'cached', domain, pageCount: cached.pageCount, issueReport: cached.issueReport });
          controller.close();
          return;
        }

        // 1. Discover URLs
        const { urls, sitemapFound } = await CrawlerService.discoverUrls(domain);
        const targetUrls = CrawlerService.sampleUrls(urls, PUBLIC_PAGE_LIMIT);
        send({ type: 'discovery', urlCount: urls.length, scanLimit: targetUrls.length });

        // 2. Fetch GEO site signals (free, parallel with crawl start)
        const geoSiteSignalsPromise = fetchSiteSignals(domain).catch(() => null);

        // 3. Crawl pages (no LLM, no DataForSEO)
        const { pages, badPages } = await CrawlerService.crawlWithConcurrency(
          targetUrls,
          3, // lower concurrency for public endpoint
          (scanned, total) => {
            send({ type: 'progress', scanned, total });
          }
        );

        const geoSignalsResult = await geoSiteSignalsPromise;
        const geoSignals: { site: GeoSiteSignals } | undefined = geoSignalsResult
          ? { site: geoSignalsResult }
          : undefined;

        // 4. Optional: Google PageSpeed Insights (free quota, skip if no key)
        let psiScore: number | null = null;
        const psiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
        if (psiKey) {
          try {
            const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(domain)}&strategy=mobile&key=${psiKey}&category=PERFORMANCE`;
            const psiRes = await fetch(psiUrl, { signal: AbortSignal.timeout(15000) });
            if (psiRes.ok) {
              const psiData = await psiRes.json();
              psiScore = Math.round((psiData?.lighthouseResult?.categories?.performance?.score ?? 0) * 100);
            }
          } catch {
            // PSI is optional — skip silently
          }
        }

        // 5. Analyze (rules only, no LLM)
        const issueReport = analyzeAudit(
          pages,
          { sitemapFound, sitemapUrls: urls, geoSignals, badPages },
          { locale: 'en' }
        );

        const result = { issueReport, pageCount: urls.length, psiScore };
        setCache(domain, result);

        send({ type: 'done', domain, ...result });
      } catch (error: unknown) {
        if (error instanceof CrawlerCircuitBreakerError) {
          send({ type: 'error', error: 'Site is unreachable or blocked crawlers.', code: 'UNREACHABLE' });
        } else {
          const msg = error instanceof Error ? error.message : 'Audit failed';
          send({ type: 'error', error: msg, code: 'INTERNAL' });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      'Connection': 'keep-alive',
    },
  });
}
