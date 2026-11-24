'use client';

import { KEY_REQUESTS_PATH, KEY_REQUESTS_QUERY_KEY } from '@/lib/admin/key-requests';
import type { KeyRequestRecord } from '@/lib/developers/key-request';
import { useAdminQuery } from './api';

/**
 * The developers' key requests from the API, under the one query key the API keys page and the
 * overview share, so a request decided on the page leaves the overview's card too. The list is the
 * owner's; `enabled` keeps another role from collecting a 403.
 */
export function useKeyRequests({
  enabled = true,
  staleTime,
}: { enabled?: boolean; staleTime?: number } = {}) {
  return useAdminQuery<{ items: KeyRequestRecord[] }>(KEY_REQUESTS_QUERY_KEY, KEY_REQUESTS_PATH, {
    enabled,
    staleTime,
    // An API without the requests answers 404, which retrying does not change.
    retry: (count, error) => error.status !== 404 && count < 2,
  });
}
