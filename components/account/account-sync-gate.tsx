'use client';

import { useEffect } from 'react';
import { ACCOUNT_MARKER_COOKIE } from '@/lib/admin/cookie';
import { readCookie } from '@/lib/utils/browser-cookie';

/**
 * Starts a signed-in visitor's sync on every page, and costs nothing for everyone else: the sync
 * module is loaded only when the account marker is set (`lib/account/sync.ts`).
 */
export function AccountSyncGate() {
  useEffect(() => {
    if (readCookie(ACCOUNT_MARKER_COOKIE) !== '1') return;
    void import('@/lib/account/sync').then((sync) => sync.startAccountSync());
  }, []);
  return null;
}
