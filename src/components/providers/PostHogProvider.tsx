'use client';

import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from "next/navigation";
import dynamic from 'next/dynamic';
// import { authClient } from "@/lib/auth-client"; // Cause of hang with Turbopack

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

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  // Initialize PostHog
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: false, // Handled manually
        loaded: (ph) => {
          if (process.env.NODE_ENV === 'development') ph.debug();
        },
      });
    }
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageview />
        <PostHogAuthListener />
      </Suspense>
      {children}
    </PostHogProvider>
  );
}
