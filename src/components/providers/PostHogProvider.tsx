'use client';

import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from "next/navigation";
import dynamic from 'next/dynamic';
// import { authClient } from "@/lib/auth-client"; // Cause of hang with Turbopack

import { CookieConsentBanner } from '@/components/seo/CookieConsentBanner';

const PostHogAuthListener = dynamic(() => import('./PostHogAuthListener').then(mod => mod.PostHogAuthListener), {
  ssr: false,
});



function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Handle Pageviews
  useEffect(() => {
    if (pathname && posthog.__loaded) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function CSPostHogProvider({ children, locale }: { children: React.ReactNode; locale: string }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NODE_ENV !== 'development') {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        ui_host: 'https://us.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: false, // Handled manually
        disable_surveys: true,
        opt_out_capturing_by_default: true, // Gate tracking by default
        loaded: (ph) => {
          if (process.env.NODE_ENV === 'development') ph.debug();
          // TAGGING: Mark every event with environment info
          const isProd = window.location.hostname === 'www.scaletotop.com' || window.location.hostname === 'scaletotop.com';
          ph.register({
            environment: isProd ? 'production' : 'development',
            host_type: window.location.hostname === 'localhost' ? 'local' : 'remote',
            locale: locale // super property
          });
          ph.setPersonProperties({ locale: locale }); // person property
        },
      });
    }
  }, [locale]);

  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageview />
        <PostHogAuthListener />
      </Suspense>
      {children}
      <CookieConsentBanner locale={locale} />
    </PostHogProvider>
  );
}
