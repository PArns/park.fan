'use client';

import { useQuery } from '@tanstack/react-query';
import type { CrosstabResponse } from '@/lib/api/admin-site-analytics';
import {
  EMPTY_TICKET_CLICKS,
  TICKET_CLICK_DAYS,
  TICKET_LINK_EVENT,
  sharesTicketLinkHost,
  type AdminTicketProduct,
  type TicketClickTable,
} from '@/lib/admin/tickets';
import type { TripRegion } from '@/lib/trip-regions/types';
import { AdminApiError, adminFetch, useAdminQuery } from '../../_lib/api';
import { analyticsPath } from '../../traffic/_lib/use-traffic';

/**
 * The region's resorts and parks, which the ticket form picks from. The admin catalog names them
 * by key only, so they come from the open region route through the site's relay, the answer the
 * planner reads.
 */
export function useTripRegion(region: string) {
  return useAdminQuery<Pick<TripRegion, 'groups' | 'parks'>>(
    ['admin', 'trip-region', region],
    `/api/trip-regions/${encodeURIComponent(region)}`,
    { staleTime: 10 * 60_000 }
  );
}

/** A click table, or an empty one for an event the API has never seen. */
async function readClicks(path: string, signal: AbortSignal): Promise<TicketClickTable> {
  try {
    return await adminFetch<CrosstabResponse>(path, { signal });
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) return EMPTY_TICKET_CLICKS;
    throw error;
  }
}

function clicksPath(col: 'prop:host' | 'prop:seller'): string {
  return analyticsPath(
    `events/${TICKET_LINK_EVENT}/crosstab`,
    { range: { kind: 'days', days: TICKET_CLICK_DAYS }, locale: null },
    { row: 'prop:product', col }
  );
}

/**
 * The ticket-link clicks of the last 30 days, by product against host, and by product against
 * seller once a product has two links on one host. `null` while loading or when the read failed,
 * which the figures show as unknown; an event nobody has sent yet is an empty table, so 0.
 */
export function useTicketClicks(products: readonly Pick<AdminTicketProduct, 'links'>[]) {
  const bySellerNeeded = products.some(sharesTicketLinkHost);
  const hostPath = clicksPath('prop:host');
  const sellerPath = clicksPath('prop:seller');
  const options = { staleTime: 5 * 60_000, retry: false } as const;
  const byHost = useQuery({
    queryKey: ['admin', 'ticket-clicks', hostPath],
    queryFn: ({ signal }) => readClicks(hostPath, signal),
    ...options,
  });
  const bySeller = useQuery({
    queryKey: ['admin', 'ticket-clicks', sellerPath],
    queryFn: ({ signal }) => readClicks(sellerPath, signal),
    enabled: bySellerNeeded,
    ...options,
  });
  return {
    byHost: byHost.data ?? null,
    bySeller: bySeller.data ?? null,
    loading: byHost.isLoading,
    failed: byHost.isError,
  };
}
