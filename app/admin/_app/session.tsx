'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { adminFetch, adminKeys, useAdminQuery } from '../_lib/api';
import type { AdminIdentity, AdminRole } from '../_lib/types';

/**
 * Who is signed in, for the whole admin.
 *
 * The session itself lives in an httpOnly cookie this code cannot read; what
 * the browser holds is only the *answer* to "who am I", fetched once per load
 * from `/api/admin/session`. So there is no token to keep in sync, no storage
 * event to listen for, and signing out in one tab genuinely signs out in all
 * of them — the next request from any tab carries a cookie the server has
 * already dropped.
 */

const ROLE_RANK: Record<AdminRole, number> = {
  owner: 30,
  editor: 20,
  author: 10,
  viewer: 0,
};

interface SessionContextValue {
  identity: AdminIdentity;
  /** Whether this account holds `role` or anything above it. */
  can: (role: AdminRole) => boolean;
  signOut: () => Promise<void>;
  refresh: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used inside <SessionGate>');
  return context;
}

/** Convenience for the very common `can('editor')` guard around a control. */
export function useCan(role: AdminRole): boolean {
  return useSession().can(role);
}

export function SessionProvider({
  identity,
  children,
}: {
  identity: AdminIdentity;
  children: ReactNode;
}) {
  const client = useQueryClient();

  const signOut = useCallback(async () => {
    await adminFetch('/api/admin/session', { method: 'DELETE' }).catch(() => undefined);

    // Everything cached was fetched as this account, so it goes. But NOT via
    // `client.clear()` followed by an invalidate: clearing removes the session
    // query itself, and its mounted observer then holds the identity it
    // already had with no query left to refetch — `invalidateQueries` finds
    // nothing to invalidate and nothing refetches. The cookie was gone, the
    // DELETE answered 204, and the admin carried on as though somebody were
    // still signed in.
    //
    // So: drop the other queries, and *reset* the session one, which is the
    // operation that puts a query back to its initial state and refetches it
    // for the observer that is watching.
    client.removeQueries({
      predicate: (query) => query.queryKey[1] !== 'session',
    });
    await client.resetQueries({ queryKey: adminKeys.session });

    // And then leave the page for real. The reset alone lands on the login
    // screen, but this tab still holds a rendered shell built from the old
    // account — its lists, its drafts, whatever was typed into a form. A fresh
    // document is the only way to be sure none of it outlives the session it
    // belonged to, and signing out is a deliberate, once-a-day action that can
    // afford one navigation.
    // A full document load is the point, so the lint rule that prefers
    // `router.push` does not apply: a client-side navigation keeps this tab's
    // memory, and its memory is what belonged to the account that just left.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign('/admin');
  }, [client]);

  const value = useMemo<SessionContextValue>(
    () => ({
      identity,
      can: (role) => (ROLE_RANK[identity.role] ?? -1) >= ROLE_RANK[role],
      signOut,
      refresh: () => {
        void client.invalidateQueries({ queryKey: adminKeys.session });
      },
    }),
    [identity, signOut, client]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/** The session query, shared by the gate and anything that wants to re-read it. */
export function useSessionQuery() {
  return useAdminQuery<AdminIdentity>(adminKeys.session, '/api/admin/session', {
    retry: false,
    staleTime: 60_000,
    // The admin is a long-lived tab. Re-checking on focus is how a session
    // revoked from another device stops being usable here without a reload.
    refetchOnWindowFocus: true,
  });
}
