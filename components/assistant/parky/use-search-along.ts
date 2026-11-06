'use client';

import { useEffect, useState } from 'react';
import { useSearchOpen } from '@/lib/analytics/search-presence';
import { onSiteEvent } from '@/lib/analytics/site-analytics';

/** How long the glass takes to go once the search has closed; the stylesheet reads `--parky-act`. */
export const LENS_OUT_MS = 400;
/** How long a question mark hangs over Parky after a search found nothing. */
export const PUZZLED_MS = 1800;

/**
 * Parky searching along while a search is open on the page ({@link useSearchOpen}): `searching`
 * while one is, `done` for the moment the glass takes to go after it closed, `null` otherwise;
 * `puzzled` for a moment after the search found nothing.
 */
export function useSearchAlong(enabled: boolean) {
  const open = useSearchOpen() && enabled;
  const [puzzled, setPuzzled] = useState(false);
  useEffect(() => {
    if (!open) return;
    let timer: ReturnType<typeof setTimeout>;
    const stop = onSiteEvent((name) => {
      if (name !== 'search_no_results') return;
      clearTimeout(timer);
      setPuzzled(true);
      timer = setTimeout(() => setPuzzled(false), PUZZLED_MS);
    });
    return () => {
      stop();
      clearTimeout(timer);
    };
  }, [open]);
  const [wasOpen, setWasOpen] = useState(open);
  const [leaving, setLeaving] = useState(false);
  if (wasOpen !== open) {
    setWasOpen(open);
    setLeaving(!open);
  }
  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => setLeaving(false), LENS_OUT_MS);
    return () => clearTimeout(timer);
  }, [leaving]);
  return {
    search: open ? ('searching' as const) : leaving ? ('done' as const) : null,
    puzzled: open && puzzled,
  };
}
