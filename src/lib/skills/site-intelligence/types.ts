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
  topic?: string;
}

export interface BusinessDna {
  coreOfferings: string[];
  targetAudience: string[];
  painPoints: string[];
  brandTone: string;
}

export interface SiteAuditResult {
  domain: string;
  sitemapUrl: string | null;
  pageCount: number;
  allUrls?: string[];
  pages: ScrapedPage[];
  averageLoadTime: number;
  businessDna?: BusinessDna | null;
}

export type AuditProgressEvent =
  | { type: 'discovery'; urls: string[]; graphData?: import('./graph-generator.service').GraphData; }
  | { type: 'dna_extracted'; dna: BusinessDna; }
  | { type: 'progress'; scanned: number; total: number; page?: ScrapedPage; }
  | { type: 'done'; scanned: number; total: number; graphData?: import('./graph-generator.service').GraphData; techScore: number | null; issueReport?: any; }
  | { type: 'error'; error: string; };

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
