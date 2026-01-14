
import { Post, Category } from './types';

export const CATEGORIES: Category[] = [
  { name: 'SEO 增长', slug: 'seo', description: '通过技术手段和内容策略实现搜索排名的指数级提升。' },
  { name: '技术架构', slug: 'architecture', description: '构建现代数字化营销的底层系统，从 Headless CMS 到自动化流水线。' },
  { name: '外链工程', slug: 'link-building', description: '工程化的外链获取策略，建立权威的数字化资产。' },
  { name: '数据驱动', slug: 'data', description: '利用数据分析与归因模型优化营销回报率。' },
];

export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    slug: 'technical-seo-audit-checklist',
    title: '现代 SaaS 的技术型 SEO 审计清单',
    excerpt: '一份专为工程团队和复杂 React 架构设计的 50 点深度审计清单，助力全面性能优化与收录效率提升。',
    category: 'SEO 增长',
    publishedAt: '2024-10-24',
    readTime: '12 min',
    content: `
      ## 为什么 SaaS 需要差异化的 SEO 审计？
      在现代 Web 架构中，尤其是使用 Next.js 或复杂 SPA 时，传统的 SEO 工具往往无法准确捕获服务端渲染（SSR）与客户端水合（Hydration）之间的微妙差异。

      ## 核心审计维度
      1. **渲染路径分析**：确保核心内容在初次 HTML 返回中即存在。
      2. **核心网页指标 (CWV)**：不仅仅是分数，更关注 LCP 的真实加载顺序。
      3. **Schema 结构化数据**：为 SaaS 产品页面注入 SoftwareApplication 元数据。

      ## 实战建议
      将 SEO 视为工程债务的一部分。在 CI/CD 流程中加入自动化检查点，确保每一次代码提交都不会破坏现有的 SEO 结构。
    `,
    coverImage: 'https://picsum.photos/seed/seo/1200/630'
  },
  {
    id: '2',
    slug: 'programmatic-seo-guide',
    title: '利用程序化 SEO 与 Next.js 实现规模化增长',
    excerpt: '从 0 到 100 万月活，解析现代 SaaS 企业如何通过自动化页面生成技术构建 SEO 护城河。',
    category: '技术架构',
    publishedAt: '2024-10-20',
    readTime: '15 min',
    content: `
      ## 程序化 SEO 的核心公式
      程序化 SEO = 结构化数据 + 内容模板 + 自动化生成。

      ## 如何开始？
      首先，你需要找到具备高度重复性的用户搜索意图。例如 "Best [Product] for [Role]"。
    `,
    coverImage: 'https://picsum.photos/seed/code/1200/630'
  },
  {
    id: '3',
    slug: 'link-building-in-ai-age',
    title: 'AI 搜索时代的外链建设未来',
    excerpt: '生成式搜索体验 (SGE) 如何重新定义链接权威性，以及这对于你的品牌长期排名策略意味着什么。',
    category: '外链工程',
    publishedAt: '2024-10-15',
    readTime: '8 min',
    content: '...',
    coverImage: 'https://picsum.photos/seed/link/1200/630'
  },
  {
    id: '4',
    slug: 'core-web-vitals-optimization',
    title: '核心网页指标 (CWV) 深度优化指南',
    excerpt: '分步技术指南，教你如何获得完美 Lighthouse 分数并提升真实世界的用户交互响应体验。',
    category: 'SEO 增长',
    publishedAt: '2024-10-10',
    readTime: '10 min',
    content: '...',
    coverImage: 'https://picsum.photos/seed/vitals/1200/630'
  }
];
