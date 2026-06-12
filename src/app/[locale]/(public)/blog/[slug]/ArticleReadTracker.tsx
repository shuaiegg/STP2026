'use client';

import { useEffect, useRef } from 'react';
import posthog from 'posthog-js';

interface Props {
  slug: string;
  category?: string;
}

export function ArticleReadTracker({ slug, category }: Props) {
  const fired50 = useRef(false);
  const fired100 = useRef(false);

  useEffect(() => {
    fired50.current = false;
    fired100.current = false;

    function handleScroll() {
      const el = document.documentElement;
      const scrolled = el.scrollTop + el.clientHeight;
      const total = el.scrollHeight;
      const pct = (scrolled / total) * 100;

      if (!fired50.current && pct >= 50) {
        fired50.current = true;
        posthog.capture('blog_article_read', { slug, category, read_pct: 50 });
      }
      if (!fired100.current && pct >= 95) {
        fired100.current = true;
        posthog.capture('blog_article_read', { slug, category, read_pct: 100 });
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [slug, category]);

  return null;
}
