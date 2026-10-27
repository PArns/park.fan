'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import {
  PAGE_VIEW_DWELL_MS,
  sendPageView,
  shouldCountPageView,
  type PageViewKind,
} from '@/lib/analytics/page-views';

/**
 * Counts this page as read once it has been visible for {@link PAGE_VIEW_DWELL_MS}: a tab opened in
 * the background and closed unseen counts nothing, and a reader who switches away and comes back
 * starts the wait again. Renders nothing. See docs/features/most-read.md.
 */
export function PageViewBeacon({ kind, pageKey }: { kind: PageViewKind; pageKey: string }) {
  const locale = useLocale();

  useEffect(() => {
    const id = `${kind}:${pageKey}:${locale}`;
    if (!shouldCountPageView(id)) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      clearTimeout(timer);
      timer = undefined;
    };
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return stop();
      if (timer !== undefined) return;
      timer = setTimeout(() => {
        document.removeEventListener('visibilitychange', onVisibility);
        sendPageView(id, { kind, key: pageKey, locale });
      }, PAGE_VIEW_DWELL_MS);
    };

    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [kind, pageKey, locale]);

  return null;
}
