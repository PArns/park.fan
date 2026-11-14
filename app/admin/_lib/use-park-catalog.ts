'use client';

import { adminKeys, useAdminQuery } from './api';
import type { AdminParkListItem } from './types';

const PARK_CATALOG_PARAMS = 'limit=500';

/**
 * Every park, under the key of the parks page's unfiltered list, so a park picker opened anywhere
 * in the admin asks once and a page that already holds the list costs nothing. `enabled: false`
 * reads the cache without asking.
 */
export function useParkCatalog(enabled = true) {
  return useAdminQuery<{ total: number; parks: AdminParkListItem[] }>(
    adminKeys.parks({ params: PARK_CATALOG_PARAMS }),
    enabled ? `/api/admin/content/parks?${PARK_CATALOG_PARAMS}` : null,
    { staleTime: 10 * 60_000 }
  );
}

/** The parks as picker options: the name, town and country as a hint, and the slug to match on. */
export function parkCatalogOptions(parks: readonly AdminParkListItem[]) {
  return parks.map((park) => ({
    value: park.id,
    label: park.name,
    hint: [park.city, park.country].filter(Boolean).join(', ') || undefined,
    keywords: [park.slug, park.city, park.country],
  }));
}
