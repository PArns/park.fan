'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { TickerItem } from '@/lib/api/types';

// Client-only lazy chunk — only fetched once the gate below decides to mount.
const LiveWaitTicker = dynamic(() => import('./live-wait-ticker').then((m) => m.LiveWaitTicker), {
  ssr: false,
});

/**
 * Deferred, desktop-only gate for the hero wait-times ticker.
 *
 * The ticker is purely decorative live data, so it must never compete with the initial render /
 * LCP — on desktop either. It is mounted only when:
 *   1. the viewport is desktop (`min-width: 768px`) — mobile never mounts it at all, and
 *   2. the page has finished loading and the main thread goes idle,
 * so its chunk + React Query poll start strictly after the page is interactive. Single tree:
 * this component always renders and the ticker is a conditional child — no separate mobile subtree.
 */
export function HeroTickerClient({ items }: { items: TickerItem[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Desktop only — decide once on mount; mobile never loads the ticker.
    if (!window.matchMedia('(min-width: 768px)').matches) return;

    let cancelled = false;
    let idle: number | undefined;
    const schedule = () => {
      const ric = window.requestIdleCallback;
      idle = ric
        ? ric(() => !cancelled && setMounted(true), { timeout: 2000 })
        : window.setTimeout(() => !cancelled && setMounted(true), 300);
    };

    // Wait for the load event (or run now if the page is already loaded), then idle.
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener('load', schedule);
      if (idle != null) (window.cancelIdleCallback ?? window.clearTimeout)(idle);
    };
  }, []);

  if (!mounted) return null;
  return (
    <div className="absolute right-0 bottom-0 left-0">
      <LiveWaitTicker initialItems={items} />
    </div>
  );
}
