'use client';

import type { Locale } from '@/i18n/config';
import { LIVE_POLL_MS } from '@/lib/admin/live-traffic';
import type { LiveTraffic } from '@/lib/api/admin-live-traffic';
import { adminKeys, useAdminQuery } from '../../../_lib/api';

/**
 * The live counters for one language or all, asked every five seconds while the tab is in front
 * and not at all while it is hidden, which is how React Query's interval behaves by default. A
 * failed ask is not retried: the next one is five seconds away, and the page shows the failure in
 * the meantime instead of hiding it behind retries.
 */
export function useLiveTraffic(locale: Locale | null) {
  const path = `/api/admin/analytics/live${locale ? `?locale=${locale}` : ''}`;
  return useAdminQuery<LiveTraffic>(adminKeys.raw(path), path, {
    refetchInterval: LIVE_POLL_MS,
    staleTime: 0,
    retry: false,
  });
}
