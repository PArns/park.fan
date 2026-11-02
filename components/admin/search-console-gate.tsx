'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { Search } from 'lucide-react';
import { ADMIN_MARKER_COOKIE } from '@/lib/admin/cookie';
import { readCookie } from '@/lib/utils/browser-cookie';

const SearchConsoleOverlay = dynamic(
  () => import('./search-console-overlay').then((mod) => mod.SearchConsoleOverlay),
  { ssr: false }
);

const SHOWN_KEY = 'parkfan:sc-overlay-shown';
const noSubscription = () => () => {};
const hasMarker = () => readCookie(ADMIN_MARKER_COOKIE) === '1';
const onServer = () => false;

function readShown(): boolean {
  try {
    return window.sessionStorage.getItem(SHOWN_KEY) === '1';
  } catch {
    return false;
  }
}

function writeShown(shown: boolean): void {
  try {
    if (shown) window.sessionStorage.setItem(SHOWN_KEY, '1');
    else window.sessionStorage.removeItem(SHOWN_KEY);
  } catch {
    // Without storage the choice lasts as long as the page.
  }
}

/**
 * Mounts the Search Console overlay for a browser that signed in to the admin, and nothing for
 * anyone else: the marker cookie is read in the browser only, so the cached page is the same for
 * everybody and a visitor's bundle carries only this check. It starts as a small button with the
 * magnifier, so it covers nothing; opened, it stays open for the session until its ✕.
 */
export function SearchConsoleGate() {
  const marked = useSyncExternalStore(noSubscription, hasMarker, onServer);
  const storedShown = useSyncExternalStore(noSubscription, readShown, onServer);
  const [shown, setShown] = useState<boolean | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const onSignedOut = useCallback(() => setSignedOut(true), []);
  const hide = useCallback(() => {
    writeShown(false);
    setShown(false);
  }, []);
  if (!marked || signedOut) return null;
  if (!(shown ?? storedShown)) {
    return (
      <button
        type="button"
        onClick={() => {
          writeShown(true);
          setShown(true);
        }}
        aria-label="Zahlen zu dieser Seite zeigen"
        title="Zahlen zu dieser Seite zeigen"
        className="bg-background/80 border-border/60 text-primary fixed bottom-4 left-4 z-[51] grid size-8 place-items-center rounded-full border shadow-lg backdrop-blur"
      >
        <Search className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    );
  }
  return <SearchConsoleOverlay onSignedOut={onSignedOut} onClose={hide} />;
}
