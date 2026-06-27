export interface ScrapedPage {
  url: string;
  title: string;
  description: string;
  h1: string;
  h1Count: number;
  h2: string[];
  h3: string[];
  loadTime: number;
  status: number;
  // SEO extended fields
  wordCount: number;
  internalLinks: string[];
  externalLinks: string[];
  canonicalUrl: string | null;
  hasOgImage: boolean;
  hasViewportMeta: boolean;
  hasStructuredData: boolean;
  topic?: string;
  lang?: string;                // <html lang> attribute (e.g. 'en', 'zh')
  // GEO readiness fields (Task 1.2.6)
  schemaTypes: string[];        // JSON-LD @type values (Task 1.2.1)
  listCount: number;            // <ul>+<ol> count (Task 1.2.2)
  tableCount: number;           // <table> count (Task 1.2.2)
  questionHeadingCount: number; // h2/h3 with ? or What/How/Why/When/Which (Task 1.2.3)
  hasDates: boolean;            // datePublished/dateModified (Task 1.2.4)
  hasAuthor: boolean;           // author schema or byline (Task 1.2.5)
  hasFaq: boolean;              // FAQPage schema or Q&A block (derived from schemaTypes)
}

// Bad page finding (Task 2.4.1)
export interface BadPage {
  url: string;
  status: number;
}

export interface BusinessDna {
  coreOfferings: string[];
  targetAudience: string[];
  painPoints: string[];
  brandTone: string;
  logicChains?: Array<{ problem: string; solution: string; proof: string }>;
  idealTopicMap?: Array<{ topic: string; subtopics: string[] }>;
  // New fields from unified extractor
  positioning?: string[];
  sourceLocale?: string;
  pagesRead?: string[];
}

// GEO site-level signals (Task 1.1.4)
export interface GeoSiteSignals {
  aiCrawlerStatus: Record<string, 'allowed' | 'blocked' | 'unknown'>; // GPTBot/Google-Extended/ClaudeBot/PerplexityBot/CCBot
  hasLlmsTxt: boolean | null; // null = fetch failed
  robotsFetchFailed: boolean;
  llmsTxtFetchFailed: boolean;
}

export interface SiteAuditResult {
  domain: string;
  sitemapUrl: string | null;
  sitemapFound: boolean;
  pageCount: number;
  allUrls?: string[];
  pages: ScrapedPage[];
  averageLoadTime: number;
  businessDna?: BusinessDna | null;
  geoSignals?: { site: GeoSiteSignals }; // Task 1.1.4
  badPages?: BadPage[];  // Task 2.4.1: HTTP error pages as audit findings
}

export type AuditProgressEvent =
  | { type: 'discovery'; urls: string[]; sitemapFound: boolean; graphData?: import('./graph-generator.service').GraphData; }
  | { type: 'dna_extracted'; dna: BusinessDna; }
  | { type: 'competitors_inferred'; competitors: { domain: string; reason: string; }[]; }
  | { type: 'progress'; scanned: number; total: number; page?: ScrapedPage; }
  | { type: 'done'; scanned: number; total: number; sitemapFound: boolean; graphData?: import('./graph-generator.service').GraphData; techScore: number | null; issueReport?: any; businessDna?: BusinessDna; }
  | { type: 'error'; error: string; refunded?: boolean; };

// --- API Response Types ---

export interface AuditRecord {
  id: string;
  createdAt: string;
  pageCount: number;
  techScore: number | null;
  graphData: import('./graph-generator.service').GraphData | null;
}

export interface SiteRecord {
  id: string;
  domain: string;
  name: string | null;
  createdAt: string;
  latestAudit: Omit<AuditRecord, 'graphData'> | null;
}
