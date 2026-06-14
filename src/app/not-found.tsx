import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { Button } from "@/components/ui/Button";

// 根 not-found 在根 layout 渲染（NextIntlClientProvider 之外），故不能用 useTranslations。
// 用 cookie → Accept-Language 检测语言，内联双语。
async function detectLocale(): Promise<'en' | 'zh'> {
  const c = await cookies();
  const cookieLocale = c.get('NEXT_LOCALE')?.value;
  if (cookieLocale === 'zh' || cookieLocale === 'en') return cookieLocale;
  const h = await headers();
  const primary = (h.get('accept-language') ?? '').split(',')[0]?.trim().toLowerCase() ?? '';
  return primary.startsWith('zh') ? 'zh' : 'en';
}

const COPY = {
  en: {
    badge: 'Error 404 · Page not found',
    heading: "This page doesn't exist",
    sub: 'The page may have been moved or renamed, or the link is incorrect. Let’s get you back on track.',
    home: 'Back to home',
    blog: 'Explore the blog',
    homeHref: '/',
    blogHref: '/blog',
  },
  zh: {
    badge: '错误 404 · 页面不存在',
    heading: '该页面不存在',
    sub: '页面可能已被移动或重命名，或链接有误。让我们带您回到正轨。',
    home: '返回首页',
    blog: '浏览博客',
    homeHref: '/zh',
    blogHref: '/zh/blog',
  },
} as const;

export default async function NotFound() {
  const locale = await detectLocale();
  const t = COPY[locale];

  return (
    <div className="min-h-screen bg-brand-surface flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
      {/* Oversized watermark */}
      <span
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-0 flex items-center justify-center font-display font-black text-[40vw] leading-none text-brand-primary/[0.04]"
      >
        404
      </span>

      <div className="relative z-10 max-w-xl w-full text-center">
        <span className="inline-block font-mono text-xs font-bold text-brand-secondary bg-brand-secondary/10 px-3 py-1.5 rounded-lg uppercase tracking-widest mb-8">
          {t.badge}
        </span>

        <h1 className="font-display text-4xl md:text-5xl font-bold text-brand-text-primary tracking-tight mb-5">
          {t.heading}
        </h1>

        <p className="text-base md:text-lg text-brand-text-secondary leading-relaxed mb-10 max-w-md mx-auto">
          {t.sub}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={t.homeHref}>
            <Button size="lg" className="w-full sm:w-auto px-8 font-bold">
              {t.home}
            </Button>
          </Link>
          <Link href={t.blogHref}>
            <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 font-bold">
              {t.blog}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
