'use client';

import type { Locale } from '@/i18n/config';
import { LIVE_POLL_MS } from '@/lib/admin/live-traffic';
import type { DatacenterScope } from '@/lib/admin/site-analytics';
import type { LiveTraffic } from '@/lib/api/admin-site-analytics';
import { adminKeys, useAdminQuery } from '../../../_lib/api';

/**
 * The live counters for one language or all, without the data centres' readers unless
 * `datacenter` says otherwise, asked every five seconds while the tab is in front
 * and not at all while it is hidden, which is how React Query's interval behaves by default. A
 * failed ask is not retried: the next one is five seconds away, and the page shows the failure in
 * the meantime instead of hiding it behind retries.
 */
export function useLiveTraffic(locale: Locale | null, datacenter: DatacenterScope = 'exclude') {
  const query = new URLSearchParams();
  if (locale) query.set('locale', locale);
  if (datacenter !== 'exclude') query.set('datacenter', datacenter);
  const path = `/api/admin/analytics/live${query.size > 0 ? `?${query}` : ''}`;
  return useAdminQuery<LiveTraffic>(adminKeys.raw(path), path, {
    refetchInterval: LIVE_POLL_MS,
    staleTime: 0,
    retry: false,
  });
}
