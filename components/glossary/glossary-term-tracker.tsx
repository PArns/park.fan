'use client';

import { useEffect } from 'react';
import { trackGlossaryTermViewed } from '@/lib/analytics/umami';

interface GlossaryTermTrackerProps {
  termId: string;
  locale: string;
}

/**
 * Fires a glossary_term_viewed event once on mount.
 * Renders nothing — purely for client-side analytics.
 */
export function GlossaryTermTracker({ termId, locale }: GlossaryTermTrackerProps) {
  useEffect(() => {
    trackGlossaryTermViewed({ term_id: termId, locale });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
