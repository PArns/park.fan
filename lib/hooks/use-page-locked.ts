'use client';

import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-scroll-locked'] });
  return () => observer.disconnect();
}

const locked = () => document.body.hasAttribute('data-scroll-locked');

/**
 * Whether a modal popup covers the page (a dialog, the planner's wizard, the whole planner on a
 * phone): Radix locks the page's scroll with react-remove-scroll, which marks `<body>` with
 * `data-scroll-locked` for as long as it does. `false` on the server.
 */
export function usePageLocked(): boolean {
  return useSyncExternalStore(subscribe, locked, () => false);
}
