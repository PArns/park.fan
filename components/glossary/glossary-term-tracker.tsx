'use client';

import { useEffect } from 'react';
import { trackSiteEvent } from '@/lib/analytics/site-analytics';

interface GlossaryTermTrackerProps {
  termId: string;
}

/**
 * Counts `glossary_term_viewed` once on mount, with the term's English id, which is the same in
 * every language, so a term viewed in German and in French is one term.
 */
export function GlossaryTermTracker({ termId }: GlossaryTermTrackerProps) {
  useEffect(() => {
    trackSiteEvent('glossary_term_viewed', { term: termId });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- leaves out `termId`: the event is "this page was opened", and the term never changes for a mounted page
  }, []);

  return null;
}
