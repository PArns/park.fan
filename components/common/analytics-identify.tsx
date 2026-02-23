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
    identifyVisitor(locale, hasFavorites);
  }, [locale]);

  return null;
}
