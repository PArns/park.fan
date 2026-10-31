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

const HIDDEN_KEY = 'parkfan:sc-overlay-hidden';
const noSubscription = () => () => {};
const hasMarker = () => readCookie(ADMIN_MARKER_COOKIE) === '1';
const onServer = () => false;

function readHidden(): boolean {
  try {
    return window.sessionStorage.getItem(HIDDEN_KEY) === '1';
  } catch {
    return false;
  }
}

function writeHidden(hidden: boolean): void {
  try {
    if (hidden) window.sessionStorage.setItem(HIDDEN_KEY, '1');
    else window.sessionStorage.removeItem(HIDDEN_KEY);
  } catch {
    // Without storage the choice lasts as long as the page.
  }
}

/**
 * Mounts the Search Console overlay for a browser that signed in to the admin, and nothing for
 * anyone else: the marker cookie is read in the browser only, so the cached page is the same for
 * everybody and a visitor's bundle carries only this check. The overlay can be put away for the
 * session; a small button in its corner brings it back.
 */
export function SearchConsoleGate() {
  const marked = useSyncExternalStore(noSubscription, hasMarker, onServer);
  const storedHidden = useSyncExternalStore(noSubscription, readHidden, onServer);
  const [hidden, setHidden] = useState<boolean | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const onSignedOut = useCallback(() => setSignedOut(true), []);
  const hide = useCallback(() => {
    writeHidden(true);
    setHidden(true);
  }, []);
  if (!marked || signedOut) return null;
  if (hidden ?? storedHidden) {
    return (
      <button
        type="button"
        onClick={() => {
          writeHidden(false);
          setHidden(false);
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
