'use client';

import { useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { useAfterLoad } from '@/lib/hooks/use-after-load';
import type { TickerItem } from '@/lib/api/types';

// Client-only lazy chunk — only fetched once the gate below decides to mount.
const LiveWaitTicker = dynamic(() => import('./live-wait-ticker').then((m) => m.LiveWaitTicker), {
  ssr: false,
});

const DESKTOP_MQ = '(min-width: 768px)';

/** `true` on desktop viewports. Server/first render = false (no hydration mismatch); tracks resize. */
function useIsDesktop(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(DESKTOP_MQ);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(DESKTOP_MQ).matches,
    () => false
  );
}

/**
 * Deferred, desktop-only gate for the hero wait-times ticker.
 *
 * The ticker is purely decorative live data, so it must never compete with the initial render /
 * LCP — on desktop either. It mounts only when the viewport is desktop (`min-width: 768px`) AND
 * the page has loaded + gone idle (see {@link useAfterLoad}); on mobile it never mounts at all,
 * so its chunk + React Query poll never load there. Single tree: this component always renders
 * and the ticker is a conditional child — no separate mobile subtree.
 */
export function HeroTickerClient({ items }: { items: TickerItem[] }) {
  const ready = useAfterLoad();
  const isDesktop = useIsDesktop();

  if (!ready || !isDesktop) return null;
  return (
    <div className="absolute right-0 bottom-0 left-0">
      <LiveWaitTicker initialItems={items} />
    </div>
  );
}
