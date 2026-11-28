'use client';

import { adminKeys, useAdminQuery } from './api';
import type { AdminAttractionListItem } from './types';

/** What `GET /api/admin/content/parks/:id/attractions` answers. */
export interface ParkAttractionList {
  total: number;
  attractions: AdminAttractionListItem[];
}

/**
 * One park's admin attraction list, under one key per query string, so the screens that show the
 * same list share one request. `params` is the query string without its `?`; a null `parkId` asks
 * nothing.
 */
export function useParkAttractions(parkId: string | null, params = '') {
  return useAdminQuery<ParkAttractionList>(
    adminKeys.parkAttractions(parkId ?? '', { params }),
    parkId ? `/api/admin/content/parks/${parkId}/attractions?${params}` : null
  );
}
