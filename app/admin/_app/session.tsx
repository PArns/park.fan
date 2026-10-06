'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { adminFetch, adminKeys, useAdminQuery } from '../_lib/api';
import { roleAtLeast, type AdminIdentity, type AdminRole } from '@/lib/admin/roles';

/**
 * Who is signed in, for the whole admin. The session lives in an httpOnly cookie, so the browser
 * holds only the answer from `/api/admin/session`, and signing out in one tab signs out in all.
 */

interface SessionContextValue {
  identity: AdminIdentity;
  /** Whether this account holds `role` or anything above it. */
  can: (role: AdminRole) => boolean;
  signOut: () => Promise<void>;
  refresh: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Returns the signed-in admin's identity, a `can(role)` check, `signOut` and `refresh`. Throws
 * outside the session provider.
 */
export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used inside <SessionGate>');
  return context;
}

/** Convenience for the very common `can('editor')` guard around a control. */
export function useCan(role: AdminRole): boolean {
  return useSession().can(role);
}

/**
 * Provides the signed-in identity to the admin. Its `signOut` deletes the session, drops every
 * cached query and reloads `/admin`, so nothing from the old account stays in the tab.
 */
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

    // Not `client.clear()` plus an invalidate: clearing removes the session query, and its mounted
    // observer keeps the old identity with nothing left to refetch. So drop the other queries and
    // reset the session one, which refetches for the observer.
    client.removeQueries({
      predicate: (query) => query.queryKey[1] !== 'session',
    });
    await client.resetQueries({ queryKey: adminKeys.session });

    // Then a full document load, so nothing the old account rendered or typed outlives its
    // session; a client-side navigation would keep this tab's memory.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign('/admin');
  }, [client]);

  const value = useMemo<SessionContextValue>(
    () => ({
      identity,
      can: (role) => roleAtLeast(identity.role, role),
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
