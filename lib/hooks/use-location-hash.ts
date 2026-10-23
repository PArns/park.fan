import { useSyncExternalStore } from 'react';

import { onHistoryNavigation } from '@/lib/navigation/history-navigation';

/**
 * The address bar's fragment (`#2026-12-24`, `''` without one), as a store.
 *
 * Not a read in a render or a `useState` initializer: on a client-side navigation Next writes the
 * new URL in an effect after the render that mounts the new page, so such a read sees the page the
 * reader came from. React reads this store again after the commit and re-renders when the fragment
 * has changed. A `pushState` or `replaceState` is announced before the URL changes, so the change
 * is reported a microtask later; `popstate` and `hashchange` cover the browser's own moves.
 */
function subscribe(onChange: () => void): () => void {
  const later = () => queueMicrotask(onChange);
  const unsubscribe = onHistoryNavigation(later);
  window.addEventListener('popstate', onChange);
  window.addEventListener('hashchange', onChange);
  return () => {
    unsubscribe();
    window.removeEventListener('popstate', onChange);
    window.removeEventListener('hashchange', onChange);
  };
}

const getSnapshot = () => window.location.hash;
const getServerSnapshot = () => '';

/** The URL fragment, following client-side navigations; `''` on the server. */
export function useLocationHash(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
