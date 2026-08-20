'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
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
    // Everything cached was fetched as this account. Clearing rather than
    // invalidating so nothing from the old session can flash into the next
    // one's first render.
    client.clear();
    await client.invalidateQueries({ queryKey: adminKeys.session });
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
