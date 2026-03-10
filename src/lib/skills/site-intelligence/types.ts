export interface ScrapedPage {
  url: string;
  title: string;
  description: string;
  h1: string;
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

export interface SiteAuditResult {
  domain: string;
  sitemapUrl: string | null;
  pageCount: number;
  allUrls?: string[];
  pages: ScrapedPage[];
  averageLoadTime: number;
}

export type AuditProgressEvent =
  | { type: 'discovery'; urls: string[]; graphData?: import('./graph-generator.service').GraphData; }
  | { type: 'progress'; scanned: number; total: number; page?: ScrapedPage; }
  | { type: 'done'; scanned: number; total: number; graphData?: import('./graph-generator.service').GraphData; techScore: number | null; }
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
