'use client';

import type { ServedAttractionKind } from '@/lib/admin/attraction-kind';
import { adminKeys, useAdminQuery } from './api';

const NO_KINDS: Record<string, ServedAttractionKind> = {};

/**
 * The kinds the public payload serves for one park's attractions, keyed by attraction id, from
 * `/api/admin/attraction-kinds`. The admin's attraction list holds only what an editor stored, and
 * this adds what the API's rule derived for the rest. A null `parkPath` asks nothing, and the map
 * is empty until the answer is in.
 */
export function useServedAttractionKinds(
  parkId: string,
  parkPath: string | null
): Record<string, ServedAttractionKind> {
  const query = useAdminQuery<{ kinds: Record<string, ServedAttractionKind> }>(
    adminKeys.parkAttractionKinds(parkId),
    parkPath ? `/api/admin/attraction-kinds?path=${encodeURIComponent(parkPath)}` : null
  );
  return query.data?.kinds ?? NO_KINDS;
}
