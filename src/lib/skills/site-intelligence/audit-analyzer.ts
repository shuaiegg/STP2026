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

const ISSUE_TRANSLATIONS: Record<string, Record<'zh' | 'en', { title: string; explanation: string; howToFix: string }>> = {
  'MISSING_SITEMAP': {
    'zh': {
      title: '缺失 Sitemap',
      explanation: '未在站点根目录发现有效的 sitemap.xml 文件。Sitemap 能够帮助搜索引擎更高效地发现和爬取您的页面。',
      howToFix: '生成一个 sitemap.xml 文件并将其放置在网站根目录下，同时在 Google Search Console 中进行提交。'
    },
    'en': {
      title: 'Missing Sitemap',
      explanation: 'No valid sitemap.xml was found in the root directory. Sitemaps help search engines discover and crawl your pages more efficiently.',
      howToFix: 'Generate a sitemap.xml and place it in the root directory, then submit it in Google Search Console.'
    }
  },
  'DEAD_LINK': {
    'zh': {
      title: '死链',
      explanation: '页面返回了 4xx 或 5xx 错误。死链会严重损害用户体验，并阻碍搜索引擎爬取。',
      howToFix: '修复这些链接，确保它们返回 200 OK 状态码，或设置 301 重定向到新页面。'
    },
    'en': {
      title: 'Dead Link',
      explanation: 'The page returned a 4xx or 5xx error. Dead links harm user experience and block search engine crawling.',
      howToFix: 'Fix these links to ensure they return 200 OK, or set up 301 redirects.'
    }
  },
  'MISSING_H1': {
    'zh': {
      title: '缺失 H1 标签',
      explanation: 'H1 标签是页面最重要的标题，它告诉搜索引擎 and 用户页面的核心主题。',
      howToFix: '为每个页面添加一个描述性的 H1 标签。'
    },
    'en': {
      title: 'Missing H1 Tag',
      explanation: 'The H1 tag is the most important heading, telling search engines and users the core topic of the page.',
      howToFix: 'Add a descriptive H1 tag to every page.'
    }
  },
  'TITLE_TOO_LONG': {
    'zh': {
      title: '标题过长',
      explanation: '页面标题超过 60 个字符，在搜索结果中可能会被截断。',
      howToFix: '缩短标题，确保核心关键词靠前，总长度控制在 60 字符以内。'
    },
    'en': {
      title: 'Title Too Long',
      explanation: 'Page title exceeds 60 characters and may be truncated in search results.',
      howToFix: 'Shorten the title, ensure core keywords are at the beginning, and keep it under 60 characters.'
    }
  },
  'TITLE_TOO_SHORT': {
    'zh': {
      title: '标题过短',
      explanation: '标题太短无法提供足够的语义上下文，不利于排名。',
      howToFix: '扩充标题，加入更多相关的描述性词汇。'
    },
    'en': {
      title: 'Title Too Short',
      explanation: 'The title is too short to provide enough semantic context for ranking.',
      howToFix: 'Expand the title with more relevant descriptive words.'
    }
  },
  'MISSING_TITLE': {
    'zh': {
      title: '缺失标题',
      explanation: '页面没有定义 <title> 标签。',
      howToFix: '为页面添加具有吸引力且包含关键词的标题。'
    },
    'en': {
      title: 'Missing Title',
      explanation: 'The page has no <title> tag defined.',
      howToFix: 'Add an engaging, keyword-rich title to the page.'
    }
  },
  'MISSING_META_DESC': {
    'zh': {
      title: '缺失 Meta 描述',
      explanation: 'Meta 描述虽不直接影响排名，但会极大影响搜索结果的点击率 (CTR)。',
      howToFix: '为每个页面编写 120-160 字符的吸引人的描述。'
    },
    'en': {
      title: 'Missing Meta Description',
      explanation: 'Meta descriptions don\'t directly affect ranking but significantly impact Click-Through Rate (CTR).',
      howToFix: 'Write an engaging description of 120-160 characters for each page.'
    }
  },
  'META_DESC_TOO_LONG': {
    'zh': {
      title: 'Meta 描述过长',
      explanation: '描述超过 160 字符会被搜索引擎截断。',
      howToFix: '精简描述，确保最重要的信息在前面。'
    },
    'en': {
      title: 'Meta Description Too Long',
      explanation: 'Descriptions over 160 characters will be truncated by search engines.',
      howToFix: 'Concatenate the description, ensuring the most important info is at the front.'
    }
  },
  'DUPLICATE_H1': {
    'zh': {
      title: '多个 H1 标签',
      explanation: '一个页面应该只包含一个 H1 标签。多个 H1 标签可能会混淆搜索引擎对页面主题的理解。',
      howToFix: '确保每个页面只有一个 H1 标签，将其他标题改为 H2 或 H3。'
    },
    'en': {
      title: 'Multiple H1 Tags',
      explanation: 'A page should only have one H1 tag. Multiple H1s may confuse search engines about the page\'s topic.',
      howToFix: 'Ensure only one H1 tag per page; change others to H2 or H3.'
    }
  },
  'DUPLICATE_TITLE': {
    'zh': {
      title: '重复标题',
      explanation: '多个页面使用完全相同的标题，会让搜索引擎难以区分哪个页面最相关。',
      howToFix: '为每个页面提供独特的、针对性的标题。'
    },
    'en': {
      title: 'Duplicate Title',
      explanation: 'Multiple pages using the exact same title makes it hard for search engines to distinguish which is most relevant.',
      howToFix: 'Provide unique, targeted titles for every page.'
    }
  },
  'DUPLICATE_META_DESC': {
    'zh': {
      title: '重复 Meta 描述',
      explanation: '重复的 Meta 描述会降低每个页面的独特性。',
      howToFix: '为每个页面编写独特的 Meta 描述。'
    },
    'en': {
      title: 'Duplicate Meta Description',
      explanation: 'Duplicate meta descriptions reduce the uniqueness of each page.',
      howToFix: 'Write unique meta descriptions for each page.'
    }
  },
  'MISSING_OG_IMAGE': {
    'zh': {
      title: '缺失 OG 图',
      explanation: '缺失 Open Graph 图片会降低页面在社交媒体（如 Twitter, LinkedIn）分享时的美观度和点击率。',
      howToFix: '在 <head> 中添加 og:image 标签。'
    },
    'en': {
      title: 'Missing OG Image',
      explanation: 'Missing Open Graph images reduces the visual appeal and CTR when shared on social media (Twitter, LinkedIn).',
      howToFix: 'Add an og:image tag in the <head>.'
    }
  },
  'THIN_CONTENT': {
    'zh': {
      title: '薄内容',
      explanation: '页面内容少于 300 词，可能被搜索引擎视为低质量页面。',
      howToFix: '增加更多高质量、有深度的原创内容。'
    },
    'en': {
      title: 'Thin Content',
      explanation: 'The page has fewer than 300 words and may be viewed as low quality by search engines.',
      howToFix: 'Add more high-quality, in-depth original content.'
    }
  },
  'SLOW_PAGE': {
    'zh': {
      title: '加载缓慢',
      explanation: '页面加载时间超过 3s，会增加用户跳出率。',
      howToFix: '优化图片大小，减少重定向，或使用 CDN。'
    },
    'en': {
      title: 'Slow Loading',
      explanation: 'Page load time exceeds 3s, which can increase bounce rates.',
      howToFix: 'Optimize image sizes, reduce redirects, or use a CDN.'
    }
  },
  'VERY_SLOW_PAGE': {
    'zh': {
      title: '加载极慢',
      explanation: '页面加载时间超过 5s，严重影响体验和排名。',
      howToFix: '需要重点优化，检查服务器响应时间或过重的脚本。'
    },
    'en': {
      title: 'Very Slow Loading',
      explanation: 'Page load time exceeds 5s, severely impacting experience and ranking.',
      howToFix: 'Focus on optimization, checking server response times or heavy scripts.'
    }
  },
  'MISSING_CANONICAL': {
    'zh': {
      title: '缺失 Canonical 标签',
      explanation: 'Canonical 标签缺失可能导致搜索引擎在处理 URL 参数或重复内容时产生歧义。',
      howToFix: '为每个页面添加 rel="canonical" 链接。'
    },
    'en': {
      title: 'Missing Canonical Tag',
      explanation: 'Missing canonical tags can lead to ambiguity when search engines handle URL parameters or duplicate content.',
      howToFix: 'Add a rel="canonical" link to every page.'
    }
  },
  'ORPHAN_PAGE': {
    'zh': {
      title: '孤儿页面',
      explanation: '这些页面没有任何内部链接指向它们。搜索引擎和用户很难发现这些页面。',
      howToFix: '在网站的其他相关页面中添加指向这些页面的链接。'
    },
    'en': {
      title: 'Orphan Page',
      explanation: 'These pages have no internal links pointing to them. It\'s hard for search engines and users to discover them.',
      howToFix: 'Add internal links to these pages from other relevant parts of your site.'
    }
  },
  'MISSING_H2': {
    'zh': {
      title: '缺失 H2 标签',
      explanation: '页面正文较长但没有使用 H2 标题进行结构化。这不利于用户阅读和搜索引擎理解内容层级。',
      howToFix: '使用 H2 标签为页面内容添加子标题，提高可读性。'
    },
    'en': {
      title: 'Missing H2 Tag',
      explanation: 'The page has long content but lacks H2 headings for structure, making it harder to read and understand.',
      howToFix: 'Use H2 tags to add subheadings and improve readability.'
    }
  },
  'HEADING_HIERARCHY_BROKEN': {
    'zh': {
      title: '标题层级跳跃',
      explanation: '页面的标题层级不连续（例如 H1 后面直接使用了 H3 而没有 H2）。良好的结构应该是层级递进的。',
      howToFix: '调整标题层级，确保在 H3 之前使用了 H2 标签。'
    },
    'en': {
      title: 'Heading Hierarchy Jump',
      explanation: 'The heading hierarchy is not sequential (e.g., H1 followed by H3). Good structure should be progressive.',
      howToFix: 'Adjust heading levels to ensure H2 is used before H3.'
    }
  },
  'MISSING_VIEWPORT': {
    'zh': {
      title: '缺失 Viewport 设置',
      explanation: '页面缺失 viewport meta 标签，这会导致页面在移动设备上无法正确缩放和显示。',
      howToFix: '在 <head> 中添加 <meta name="viewport" content="width=device-width, initial-scale=1"> 标签。'
    },
    'en': {
      title: 'Missing Viewport Setting',
      explanation: 'Missing viewport meta tag means the page won\'t scale correctly on mobile devices.',
      howToFix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the <head>.'
    }
  },
  'MISSING_STRUCTURED_DATA': {
    'zh': {
      title: '缺失结构化数据',
      explanation: '页面没有使用 JSON-LD 结构化数据。结构化数据可以帮助搜索引擎在搜索结果中显示富摘要。',
      howToFix: '根据页面内容类型（如 Article, Product, Organization）添加相应的 Schema.org JSON-LD 标记。'
    },
    'en': {
      title: 'Missing Structured Data',
      explanation: 'No JSON-LD structured data was found. Structured data helps show rich snippets in search results.',
      howToFix: 'Add appropriate Schema.org JSON-LD markup based on content type (Article, Product, etc.).'
    }
  }
};

/**
 * AuditAnalyzer is a pure function service that detects SEO issues
 * and calculates scores based on scraped page data.
 */
export function analyzeAudit(
  pages: ScrapedPage[],
  meta?: { sitemapFound?: boolean; sitemapUrls?: string[] },
  options?: { locale?: 'zh' | 'en' }
): AuditIssueReport {
  const locale = options?.locale || 'zh';

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
    affectedPages: AffectedPage[]
  ) => {
    if (affectedPages.length > 0) {
      const trans = ISSUE_TRANSLATIONS[code]?.[locale] || {
        title: code,
        explanation: '',
        howToFix: ''
      };
      issues.push({ 
        code, 
        severity, 
        title: trans.title, 
        explanation: trans.explanation, 
        howToFix: trans.howToFix, 
        affectedPages 
      });
    }
  };

  // 0. MISSING_SITEMAP (warning)
  if (meta && meta.sitemapFound === false) {
    addIssue(
      'MISSING_SITEMAP',
      'warning',
      [{ url: `https://${domain}`, detail: locale === 'zh' ? '站点级别' : 'Site level' }]
    );
  }

  // 1. DEAD_LINK (status 4xx/5xx)
  const deadLinks = pages
    .filter((p) => p.status >= 400)
    .map((p) => ({ url: p.url, detail: `HTTP ${p.status}` }));
  addIssue(
    'DEAD_LINK',
    'critical',
    deadLinks
  );

  // 2. MISSING_H1
  const missingH1 = pages
    .filter((p) => !p.h1 || p.h1.trim() === '')
    .map((p) => ({ url: p.url }));
  addIssue(
    'MISSING_H1',
    'critical',
    missingH1
  );

  // 3. TITLE_TOO_LONG (>60)
  const titleTooLong = pages
    .filter((p) => p.title && p.title.length > 60)
    .map((p) => ({ url: p.url, detail: locale === 'zh' ? `${p.title.length} 字符` : `${p.title.length} chars` }));
  addIssue(
    'TITLE_TOO_LONG',
    'warning',
    titleTooLong
  );

  // 4. TITLE_TOO_SHORT (<20)
  const titleTooShort = pages
    .filter((p) => p.title && p.title.length < 20)
    .map((p) => ({ url: p.url, detail: locale === 'zh' ? `${p.title.length} 字符` : `${p.title.length} chars` }));
  addIssue(
    'TITLE_TOO_SHORT',
    'warning',
    titleTooShort
  );

  // 5. MISSING_TITLE
  const missingTitle = pages
    .filter((p) => !p.title || p.title.trim() === '')
    .map((p) => ({ url: p.url }));
  addIssue(
    'MISSING_TITLE',
    'warning',
    missingTitle
  );

  // 6. MISSING_META_DESC
  const missingMetaDesc = pages
    .filter((p) => !p.description || p.description.trim() === '')
    .map((p) => ({ url: p.url }));
  addIssue(
    'MISSING_META_DESC',
    'warning',
    missingMetaDesc
  );

  // 7. META_DESC_TOO_LONG (>160)
  const metaDescTooLong = pages
    .filter((p) => p.description && p.description.length > 160)
    .map((p) => ({ url: p.url, detail: locale === 'zh' ? `${p.description.length} 字符` : `${p.description.length} chars` }));
  addIssue(
    'META_DESC_TOO_LONG',
    'warning',
    metaDescTooLong
  );

  // 8. DUPLICATE_H1 (multiple H1 on same page)
  const duplicateH1 = pages
    .filter((p) => p.h1Count > 1)
    .map((p) => ({ url: p.url, detail: locale === 'zh' ? `${p.h1Count} 个 H1 标签` : `${p.h1Count} H1 tags` }));
  addIssue(
    'DUPLICATE_H1',
    'warning',
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
    .flatMap(([title, urls]) => urls.map((url) => ({ url, detail: locale === 'zh' ? `重复标题: ${title}` : `Duplicate title: ${title}` })));
  addIssue(
    'DUPLICATE_TITLE',
    'warning',
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
    .flatMap(([desc, urls]) => urls.map((url) => ({ url, detail: locale === 'zh' ? `重复描述: ${desc.substring(0, 30)}...` : `Duplicate description: ${desc.substring(0, 30)}...` })));
  addIssue(
    'DUPLICATE_META_DESC',
    'warning',
    duplicateDescs
  );

  // 11. MISSING_OG_IMAGE
  const missingOgImage = pages
    .filter((p) => !p.hasOgImage)
    .map((p) => ({ url: p.url }));
  addIssue(
    'MISSING_OG_IMAGE',
    'info',
    missingOgImage
  );

  // 12. THIN_CONTENT (<300)
  const thinContent = pages
    .filter((p) => p.wordCount < 300)
    .map((p) => ({ url: p.url, detail: locale === 'zh' ? `${p.wordCount} 词` : `${p.wordCount} words` }));
  addIssue(
    'THIN_CONTENT',
    'info',
    thinContent
  );

  // 13. SLOW_PAGE (>3000ms)
  const slowPages = pages
    .filter((p) => p.loadTime > 3000 && p.loadTime <= 5000)
    .map((p) => ({ url: p.url, detail: `${(p.loadTime / 1000).toFixed(1)}s` }));
  addIssue(
    'SLOW_PAGE',
    'info',
    slowPages
  );

  // 14. VERY_SLOW_PAGE (>5000ms)
  const verySlowPages = pages
    .filter((p) => p.loadTime > 5000)
    .map((p) => ({ url: p.url, detail: `${(p.loadTime / 1000).toFixed(1)}s` }));
  addIssue(
    'VERY_SLOW_PAGE',
    'info',
    verySlowPages
  );

  // 15. MISSING_CANONICAL
  const missingCanonical = pages
    .filter((p) => !p.canonicalUrl)
    .map((p) => ({ url: p.url }));
  addIssue(
    'MISSING_CANONICAL',
    'info',
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
      orphanPages
    );
  }

  // 17. MISSING_H2 (warning)
  const missingH2 = pages
    .filter(p => p.wordCount > 100 && p.h2.length === 0)
    .map(p => ({ url: p.url, detail: locale === 'zh' ? `${p.wordCount} 词但无 H2` : `${p.wordCount} words but no H2` }));
  addIssue(
    'MISSING_H2',
    'warning',
    missingH2
  );

  // 18. HEADING_HIERARCHY_BROKEN (info)
  const brokenHierarchy = pages
    .filter(p => p.h1 && p.h1.trim() !== '' && p.h2.length === 0 && p.h3.length > 0)
    .map(p => ({ url: p.url, detail: locale === 'zh' ? 'H1 直接跳到 H3' : 'H1 jumped directly to H3' }));
  addIssue(
    'HEADING_HIERARCHY_BROKEN',
    'info',
    brokenHierarchy
  );

  // 19. MISSING_VIEWPORT (warning)
  const missingViewport = pages
    .filter(p => (p.hasViewportMeta ?? false) === false)
    .map(p => ({ url: p.url }));
  addIssue(
    'MISSING_VIEWPORT',
    'warning',
    missingViewport
  );

  // 20. MISSING_STRUCTURED_DATA (info)
  const missingStructuredData = pages
    .filter(p => (p.hasStructuredData ?? false) === false)
    .map(p => ({ url: p.url }));
  addIssue(
    'MISSING_STRUCTURED_DATA',
    'info',
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
