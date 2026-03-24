import { ScrapedPage } from './types';

export type Severity = 'critical' | 'warning' | 'info';

export interface AffectedPage {
  url: string;
  detail?: string;
}

export interface IssueItem {
  code: string;
  severity: Severity;
  title: string;
  explanation: string;
  howToFix: string;
  affectedPages: AffectedPage[];
}

export interface AuditIssueReport {
  techScore: number;
  contentScore: number;
  seoScore: number;
  issues: IssueItem[];
  stats: {
    critical: number;
    warning: number;
    info: number;
  };
}

/**
 * AuditAnalyzer is a pure function service that detects SEO issues
 * and calculates scores based on scraped page data.
 */
export function analyzeAudit(
  pages: ScrapedPage[],
  meta?: { sitemapFound?: boolean; sitemapUrls?: string[] }
): AuditIssueReport {
  if (pages.length === 0) {
    return {
      techScore: 100,
      contentScore: 100,
      seoScore: 100,
      issues: [],
      stats: { critical: 0, warning: 0, info: 0 },
    };
  }

  const issues: IssueItem[] = [];
  const totalPages = pages.length;
  // 识别主域名用于站点级 issue
  let domain = 'your-site.com';
  try {
    domain = new URL(pages[0].url).hostname;
  } catch (e) { }

  // Helper to add issues
  const addIssue = (
    code: string,
    severity: Severity,
    title: string,
    explanation: string,
    howToFix: string,
    affectedPages: AffectedPage[]
  ) => {
    if (affectedPages.length > 0) {
      issues.push({ code, severity, title, explanation, howToFix, affectedPages });
    }
  };

  // 0. MISSING_SITEMAP (warning)
  if (meta && meta.sitemapFound === false) {
    addIssue(
      'MISSING_SITEMAP',
      'warning',
      '缺失 Sitemap',
      '未在站点根目录发现有效的 sitemap.xml 文件。Sitemap 能够帮助搜索引擎更高效地发现和爬取您的页面。',
      '生成一个 sitemap.xml 文件并将其放置在网站根目录下，同时在 Google Search Console 中进行提交。',
      [{ url: `https://${domain}`, detail: '站点级别' }]
    );
  }

  // 1. DEAD_LINK (status 4xx/5xx)
  const deadLinks = pages
    .filter((p) => p.status >= 400)
    .map((p) => ({ url: p.url, detail: `HTTP ${p.status}` }));
  addIssue(
    'DEAD_LINK',
    'critical',
    '死链',
    '页面返回了 4xx 或 5xx 错误。死链会严重损害用户体验，并阻碍搜索引擎爬取。',
    '修复这些链接，确保它们返回 200 OK 状态码，或设置 301 重定向到新页面。',
    deadLinks
  );

  // 2. MISSING_H1
  const missingH1 = pages
    .filter((p) => !p.h1 || p.h1.trim() === '')
    .map((p) => ({ url: p.url }));
  addIssue(
    'MISSING_H1',
    'critical',
    '缺失 H1 标签',
    'H1 标签是页面最重要的标题，它告诉搜索引擎和用户页面的核心主题。',
    '为每个页面添加一个描述性的 H1 标签。',
    missingH1
  );

  // 3. TITLE_TOO_LONG (>60)
  const titleTooLong = pages
    .filter((p) => p.title && p.title.length > 60)
    .map((p) => ({ url: p.url, detail: `${p.title.length} 字符` }));
  addIssue(
    'TITLE_TOO_LONG',
    'warning',
    '标题过长',
    '页面标题超过 60 个字符，在搜索结果中可能会被截断。',
    '缩短标题，确保核心关键词靠前，总长度控制在 60 字符以内。',
    titleTooLong
  );

  // 4. TITLE_TOO_SHORT (<20)
  const titleTooShort = pages
    .filter((p) => p.title && p.title.length < 20)
    .map((p) => ({ url: p.url, detail: `${p.title.length} 字符` }));
  addIssue(
    'TITLE_TOO_SHORT',
    'warning',
    '标题过短',
    '标题太短无法提供足够的语义上下文，不利于排名。',
    '扩充标题，加入更多相关的描述性词汇。',
    titleTooShort
  );

  // 5. MISSING_TITLE
  const missingTitle = pages
    .filter((p) => !p.title || p.title.trim() === '')
    .map((p) => ({ url: p.url }));
  addIssue(
    'MISSING_TITLE',
    'warning',
    '缺失标题',
    '页面没有定义 <title> 标签。',
    '为页面添加具有吸引力且包含关键词的标题。',
    missingTitle
  );

  // 6. MISSING_META_DESC
  const missingMetaDesc = pages
    .filter((p) => !p.description || p.description.trim() === '')
    .map((p) => ({ url: p.url }));
  addIssue(
    'MISSING_META_DESC',
    'warning',
    '缺失 Meta 描述',
    'Meta 描述虽不直接影响排名，但会极大影响搜索结果的点击率 (CTR)。',
    '为每个页面编写 120-160 字符的吸引人的描述。',
    missingMetaDesc
  );

  // 7. META_DESC_TOO_LONG (>160)
  const metaDescTooLong = pages
    .filter((p) => p.description && p.description.length > 160)
    .map((p) => ({ url: p.url, detail: `${p.description.length} 字符` }));
  addIssue(
    'META_DESC_TOO_LONG',
    'warning',
    'Meta 描述过长',
    '描述超过 160 字符会被搜索引擎截断。',
    '精简描述，确保最重要的信息在前面。',
    metaDescTooLong
  );

  // 8. DUPLICATE_H1 (multiple H1 on same page)
  const duplicateH1 = pages
    .filter((p) => p.h1Count > 1)
    .map((p) => ({ url: p.url, detail: `${p.h1Count} 个 H1 标签` }));
  addIssue(
    'DUPLICATE_H1',
    'warning',
    '多个 H1 标签',
    '一个页面应该只包含一个 H1 标签。多个 H1 标签可能会混淆搜索引擎对页面主题的理解。',
    '确保每个页面只有一个 H1 标签，将其他标题改为 H2 或 H3。',
    duplicateH1
  );

  // 9. DUPLICATE_TITLE (cross pages)
  const titleGroups: Record<string, string[]> = {};
  pages.forEach((p) => {
    if (p.title && p.title.trim() !== '') {
      const t = p.title.trim();
      if (!titleGroups[t]) titleGroups[t] = [];
      titleGroups[t].push(p.url);
    }
  });
  const duplicateTitles = Object.entries(titleGroups)
    .filter(([_, urls]) => urls.length > 1)
    .flatMap(([title, urls]) => urls.map((url) => ({ url, detail: `重复标题: ${title}` })));
  addIssue(
    'DUPLICATE_TITLE',
    'warning',
    '重复标题',
    '多个页面使用完全相同的标题，会让搜索引擎难以区分哪个页面最相关。',
    '为每个页面提供独特的、针对性的标题。',
    duplicateTitles
  );

  // 10. DUPLICATE_META_DESC (cross pages)
  const descGroups: Record<string, string[]> = {};
  pages.forEach((p) => {
    if (p.description && p.description.trim() !== '') {
      const d = p.description.trim();
      if (!descGroups[d]) descGroups[d] = [];
      descGroups[d].push(p.url);
    }
  });
  const duplicateDescs = Object.entries(descGroups)
    .filter(([_, urls]) => urls.length > 1)
    .flatMap(([desc, urls]) => urls.map((url) => ({ url, detail: `重复描述: ${desc.substring(0, 30)}...` })));
  addIssue(
    'DUPLICATE_META_DESC',
    'warning',
    '重复 Meta 描述',
    '重复的 Meta 描述会降低每个页面的独特性。',
    '为每个页面编写独特的 Meta 描述。',
    duplicateDescs
  );

  // 11. MISSING_OG_IMAGE
  const missingOgImage = pages
    .filter((p) => !p.hasOgImage)
    .map((p) => ({ url: p.url }));
  addIssue(
    'MISSING_OG_IMAGE',
    'info',
    '缺失 OG 图',
    '缺失 Open Graph 图片会降低页面在社交媒体（如 Twitter, LinkedIn）分享时的美观度和点击率。',
    '在 <head> 中添加 og:image 标签。',
    missingOgImage
  );

  // 12. THIN_CONTENT (<300)
  const thinContent = pages
    .filter((p) => p.wordCount < 300)
    .map((p) => ({ url: p.url, detail: `${p.wordCount} 词` }));
  addIssue(
    'THIN_CONTENT',
    'info',
    '薄内容',
    '页面内容少于 300 词，可能被搜索引擎视为低质量页面。',
    '增加更多高质量、有深度的原创内容。',
    thinContent
  );

  // 13. SLOW_PAGE (>3000ms)
  const slowPages = pages
    .filter((p) => p.loadTime > 3000 && p.loadTime <= 5000)
    .map((p) => ({ url: p.url, detail: `${(p.loadTime / 1000).toFixed(1)}s` }));
  addIssue(
    'SLOW_PAGE',
    'info',
    '加载缓慢',
    '页面加载时间超过 3s，会增加用户跳出率。',
    '优化图片大小，减少重定向，或使用 CDN。',
    slowPages
  );

  // 14. VERY_SLOW_PAGE (>5000ms)
  const verySlowPages = pages
    .filter((p) => p.loadTime > 5000)
    .map((p) => ({ url: p.url, detail: `${(p.loadTime / 1000).toFixed(1)}s` }));
  addIssue(
    'VERY_SLOW_PAGE',
    'info',
    '加载极慢',
    '页面加载时间超过 5s，严重影响体验和排名。',
    '需要重点优化，检查服务器响应时间或过重的脚本。',
    verySlowPages
  );

  // 15. MISSING_CANONICAL
  const missingCanonical = pages
    .filter((p) => !p.canonicalUrl)
    .map((p) => ({ url: p.url }));
  addIssue(
    'MISSING_CANONICAL',
    'info',
    '缺失 Canonical 标签',
    'Canonical 标签缺失可能导致搜索引擎在处理 URL 参数或重复内容时产生歧义。',
    '为每个页面添加 rel="canonical" 链接。',
    missingCanonical
  );

  // 16. ORPHAN_PAGE (warning)
  const referencedUrls = new Set<string>();
  // 自动加入根域名 URL 避免误报
  try {
    const rootUrl = new URL(pages[0].url);
    referencedUrls.add(rootUrl.origin);
    referencedUrls.add(rootUrl.origin + '/');
  } catch (e) { }

  // 如果提供了 sitemapUrls，将其视为已引用的链接
  if (meta?.sitemapUrls) {
    meta.sitemapUrls.forEach(u => {
      referencedUrls.add(u);
      if (u.endsWith('/')) {
        referencedUrls.add(u.slice(0, -1));
      } else {
        referencedUrls.add(u + '/');
      }
    });
  }

  pages.forEach(p => {
    p.internalLinks.forEach(link => referencedUrls.add(link));
  });

  const orphanPages = pages
    .filter(p => !referencedUrls.has(p.url) && !referencedUrls.has(p.url + '/'))
    .map(p => ({ url: p.url }));
  
  // 只有在页面数量大于 1 时才报告孤儿页
  if (totalPages > 1) {
    addIssue(
      'ORPHAN_PAGE',
      'warning',
      '孤儿页面',
      '这些页面没有任何内部链接指向它们。搜索引擎和用户很难发现这些页面。',
      '在网站的其他相关页面中添加指向这些页面的链接。',
      orphanPages
    );
  }

  // 17. MISSING_H2 (warning)
  const missingH2 = pages
    .filter(p => p.wordCount > 100 && p.h2.length === 0)
    .map(p => ({ url: p.url, detail: `${p.wordCount} 词但无 H2` }));
  addIssue(
    'MISSING_H2',
    'warning',
    '缺失 H2 标签',
    '页面正文较长但没有使用 H2 标题进行结构化。这不利于用户阅读和搜索引擎理解内容层级。',
    '使用 H2 标签为页面内容添加子标题，提高可读性。',
    missingH2
  );

  // 18. HEADING_HIERARCHY_BROKEN (info)
  const brokenHierarchy = pages
    .filter(p => p.h1 && p.h1.trim() !== '' && p.h2.length === 0 && p.h3.length > 0)
    .map(p => ({ url: p.url, detail: 'H1 直接跳到 H3' }));
  addIssue(
    'HEADING_HIERARCHY_BROKEN',
    'info',
    '标题层级跳跃',
    '页面的标题层级不连续（例如 H1 后面直接使用了 H3 而没有 H2）。良好的结构应该是层级递进的。',
    '调整标题层级，确保在 H3 之前使用了 H2 标签。',
    brokenHierarchy
  );

  // 19. MISSING_VIEWPORT (warning)
  const missingViewport = pages
    .filter(p => (p.hasViewportMeta ?? false) === false)
    .map(p => ({ url: p.url }));
  addIssue(
    'MISSING_VIEWPORT',
    'warning',
    '缺失 Viewport 设置',
    '页面缺失 viewport meta 标签，这会导致页面在移动设备上无法正确缩放和显示。',
    '在 <head> 中添加 <meta name="viewport" content="width=device-width, initial-scale=1"> 标签。',
    missingViewport
  );

  // 20. MISSING_STRUCTURED_DATA (info)
  const missingStructuredData = pages
    .filter(p => (p.hasStructuredData ?? false) === false)
    .map(p => ({ url: p.url }));
  addIssue(
    'MISSING_STRUCTURED_DATA',
    'info',
    '缺失结构化数据',
    '页面没有使用 JSON-LD 结构化数据。结构化数据可以帮助搜索引擎在搜索结果中显示富摘要。',
    '根据页面内容类型（如 Article, Product, Organization）添加相应的 Schema.org JSON-LD 标记。',
    missingStructuredData
  );

  // --- Scoring Calculations ---

  // techScore: 100 - (dead link ratio × 40) - (avg load time penalty, >1s linear, max -30)
  // 修正：Canonical 迁移至 SEO 分
  const deadLinkRatio = deadLinks.length / totalPages;
  const avgLoadTime = pages.reduce((s, p) => s + p.loadTime, 0) / totalPages;
  const loadTimePenalty = avgLoadTime > 1000 ? Math.min(30, ((avgLoadTime - 1000) / 4000) * 30) : 0;
  const techScore = Math.max(0, Math.round(100 - (deadLinkRatio * 40) - loadTimePenalty));

  // contentScore: 100 - (missing H1 rate × 35) - (thin content rate × 30) - (non-compliant title rate × 35)
  const missingH1Rate = missingH1.length / totalPages;
  const thinContentRate = thinContent.length / totalPages;
  const nonCompliantTitleRate = (titleTooLong.length + titleTooShort.length + missingTitle.length) / totalPages;
  const contentScore = Math.max(0, Math.round(100 - (missingH1Rate * 35) - (thinContentRate * 30) - (nonCompliantTitleRate * 35)));

  // seoScore: 100 - (missing meta desc rate × 30) - (missing OG image rate × 25) - (duplicate content penalty) - (meta desc too long rate × 20)
  // 新增：Canonical (15) + Sitemap (10)
  const missingMetaDescRate = missingMetaDesc.length / totalPages;
  const missingOgImageRate = missingOgImage.length / totalPages;
  
  // Linear duplicate penalty
  const affectedByDuplicatesSet = new Set<string>();
  duplicateTitles.forEach(p => affectedByDuplicatesSet.add(p.url));
  duplicateDescs.forEach(p => affectedByDuplicatesSet.add(p.url));
  const duplicatePageRatio = affectedByDuplicatesSet.size / totalPages;
  const duplicatePenalty = duplicatePageRatio * 25;

  const metaDescTooLongRate = metaDescTooLong.length / totalPages;
  const canonicalMissingRate = missingCanonical.length / totalPages;
  const sitemapPenalty = meta?.sitemapFound === false ? 10 : 0;

  const seoScore = Math.max(0, Math.round(
    100 - (missingMetaDescRate * 30) 
        - (missingOgImageRate * 25) 
        - duplicatePenalty 
        - (metaDescTooLongRate * 20)
        - (canonicalMissingRate * 15)
        - sitemapPenalty
  ));

  // Final stats
  const stats = {
    critical: issues.filter((i) => i.severity === 'critical').length,
    warning: issues.filter((i) => i.severity === 'warning').length,
    info: issues.filter((i) => i.severity === 'info').length,
  };

  return {
    techScore,
    contentScore,
    seoScore,
    issues: issues.sort((a, b) => {
      const severityWeight: Record<Severity, number> = { critical: 3, warning: 2, info: 1 };
      const scoreA = severityWeight[a.severity] * 1000 + a.affectedPages.length;
      const scoreB = severityWeight[b.severity] * 1000 + b.affectedPages.length;
      return scoreB - scoreA;
    }),
    stats,
  };
}
