'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { ADMIN_MARKER_COOKIE } from '@/lib/admin/cookie';
import { readCookie } from '@/lib/utils/browser-cookie';

const SearchConsoleOverlay = dynamic(
  () => import('./search-console-overlay').then((mod) => mod.SearchConsoleOverlay),
  { ssr: false }
);

const noSubscription = () => () => {};
const hasMarker = () => readCookie(ADMIN_MARKER_COOKIE) === '1';
const onServer = () => false;

/**
 * Mounts the Search Console overlay for a browser that signed in to the admin, and nothing for
 * anyone else: the marker cookie is read in the browser only, so the cached page is the same for
 * everybody and a visitor's bundle carries only this check.
 */
export function SearchConsoleGate() {
  const marked = useSyncExternalStore(noSubscription, hasMarker, onServer);
  const [signedOut, setSignedOut] = useState(false);
  const onSignedOut = useCallback(() => setSignedOut(true), []);
  if (!marked || signedOut) return null;
  return <SearchConsoleOverlay onSignedOut={onSignedOut} />;
}
