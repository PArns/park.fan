import { useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ACCOUNT_MARKER_COOKIE } from '@/lib/admin/cookie';
import { SessionApiError } from '@/lib/admin/session-client';
import { readCookie } from '@/lib/utils/browser-cookie';
import type { AccountOverview } from './sync';

/**
 * Who the visitor is to members-only pages and features: a member (a signed-in visitor account),
 * a guest, or not known yet. The marker cookie answers guests without a request; a member's
 * account is read once per page through the sync, which also starts it.
 */

/** The React Query key of the signed-in member's account. */
export const ACCOUNT_QUERY_KEY = ['account', 'overview'] as const;

/** Where a visitor stands for members-only content. */
export type Membership =
  { status: 'loading' } | { status: 'guest' } | { status: 'member'; overview: AccountOverview };

const noSubscription = () => () => undefined;

/** The marker on the client; null while rendering on the server and hydrating. */
function useAccountMarker(): boolean | null {
  return useSyncExternalStore(
    noSubscription,
    () => readCookie(ACCOUNT_MARKER_COOKIE) === '1',
    () => null
  );
}

/** The visitor's membership, for `MembersOnly`, `MemberPage` and members-only features. */
export function useMembership(): Membership {
  const marker = useAccountMarker();
  const account = useQuery<AccountOverview, Error>({
    queryKey: ACCOUNT_QUERY_KEY,
    queryFn: async () => {
      const sync = await import('./sync');
      const overview = await sync.syncAccountNow();
      sync.startAccountSync();
      return overview;
    },
    enabled: marker === true,
    staleTime: Infinity,
    // A 401 means the session is gone, and asking again does not change that.
    retry: (count, error) => !(error instanceof SessionApiError && error.signedOut) && count < 2,
  });
  if (marker === null) return { status: 'loading' };
  if (!marker || account.isError) return { status: 'guest' };
  if (account.data) return { status: 'member', overview: account.data };
  return { status: 'loading' };
}
