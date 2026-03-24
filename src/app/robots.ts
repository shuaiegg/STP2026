import { MetadataRoute } from 'next';

// export default function robots(): MetadataRoute.Robots {
//   const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.scaletotop.com';

//   return {
//     rules: [
//       {
//         userAgent: '*',
//         allow: '/',
//         disallow: ['/admin/', '/dashboard/', '/api/', '/preview/'],
//       },
//     ],
//     sitemap: `${baseUrl}/sitemap.xml`,
//   };
// }


export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.scaletotop.com').replace(/\/$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/dashboard/', '/api/', '/preview/'],
      },
      // 正确的屏蔽 AI 爬虫的方式（Google 认可的 User-agent）
      {
        userAgent: ['GoogleRT', 'GPTBot', 'CCBot'], 
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}