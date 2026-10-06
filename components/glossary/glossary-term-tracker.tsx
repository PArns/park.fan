'use client';

import { useEffect } from 'react';
import { trackGlossaryTermViewed } from '@/lib/analytics/umami';

interface GlossaryTermTrackerProps {
  termId: string;
}

/**
 * Fires a glossary_term_viewed event once on mount, with the term id only: the locale is already
 * in the URL Umami records, and each property is billed as another event
 * (docs/rules/umami-event-budget.md).
 */
export function GlossaryTermTracker({ termId }: GlossaryTermTrackerProps) {
  useEffect(() => {
    trackGlossaryTermViewed({ term_id: termId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
