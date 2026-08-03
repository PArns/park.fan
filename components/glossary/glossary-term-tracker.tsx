'use client';

import { useEffect } from 'react';
import { trackGlossaryTermViewed } from '@/lib/analytics/umami';

interface GlossaryTermTrackerProps {
  termId: string;
}

/**
 * Fires a glossary_term_viewed event once on mount.
 * Renders nothing — purely for client-side analytics.
 *
 * Only the term id is sent. The locale used to ride along, but it is already in the URL Umami
 * records with the event (/de/glossar/…) and each property is billed as another event — see the
 * property budget in `lib/analytics/umami.ts`.
 */
export function GlossaryTermTracker({ termId }: GlossaryTermTrackerProps) {
  useEffect(() => {
    trackGlossaryTermViewed({ term_id: termId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
