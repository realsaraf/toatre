'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!pathname) return;
    const url = searchParams?.size
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    ph.capture('$pageview', { $current_url: url });
  }, [pathname, searchParams, ph]);

  return null;
}

// Separate the searchParams read so the rest of the tree is not deferred.
function PageViewTrackerWrapper() {
  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  );
}

if (typeof window !== 'undefined') {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
  if (key) {
    posthog.init(key, {
      api_host: host,
      // Capture pageviews manually via PageViewTracker so we control the URL.
      capture_pageview: false,
      capture_pageleave: true,
      // Respect user privacy — mask all text content in session recordings.
      session_recording: { maskAllInputs: true, maskTextSelector: '*' },
      person_profiles: 'identified_only',
    });
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <PageViewTrackerWrapper />
      {children}
    </PHProvider>
  );
}
