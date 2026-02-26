'use client';

import { useEffect } from 'react';
import { identifyVisitor } from '@/lib/analytics/umami';
import { getFavoritesFromCookies } from '@/lib/utils/favorites';

interface Props {
  locale: string;
}

export function AnalyticsIdentify({ locale }: Props) {
  useEffect(() => {
    const favData = getFavoritesFromCookies();
    const hasFavorites = Object.values(favData).some((arr) => arr.length > 0);

    // Try immediately — works when Umami is already loaded (e.g. client-side navigation)
    if (identifyVisitor(locale, hasFavorites)) return;

    // Umami script hasn't finished loading yet (deferred async load on initial page load).
    // Retry once after a short delay to give the script time to initialise.
    const timer = setTimeout(() => {
      identifyVisitor(locale, hasFavorites);
    }, 3000);

    return () => clearTimeout(timer);
  }, [locale]);

  return null;
}
