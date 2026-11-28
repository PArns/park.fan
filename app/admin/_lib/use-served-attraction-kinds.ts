'use client';

import {
  servedKindsFromList,
  type AttractionKindColumns,
  type ServedAttractionKind,
} from '@/lib/admin/attraction-kind';
import { adminKeys, useAdminQuery } from './api';

const NO_KINDS: Record<string, ServedAttractionKind> = {};

/**
 * The kinds the API serves for one park's attractions, keyed by attraction id, read off the rows
 * of the park's admin list (`servedKindsFromList`). The map is empty until the rows are in.
 *
 * An API whose list does not carry the kind columns yet gets the old way instead: the park shell
 * through `/api/admin/attraction-kinds`, for which `parkPath` is needed (null asks nothing). That
 * fallback and its route go once the API sends the columns.
 */
export function useServedAttractionKinds(
  parkId: string,
  parkPath: string | null,
  rows: readonly AttractionKindColumns[] | undefined
): Record<string, ServedAttractionKind> {
  const fromList = rows ? servedKindsFromList(rows) : null;
  const fallback = useAdminQuery<{ kinds: Record<string, ServedAttractionKind> }>(
    adminKeys.parkAttractionKinds(parkId),
    rows && !fromList && parkPath
      ? `/api/admin/attraction-kinds?path=${encodeURIComponent(parkPath)}`
      : null
  );
  return fromList ?? fallback.data?.kinds ?? NO_KINDS;
}
