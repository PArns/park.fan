'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { TickerItem } from '@/lib/api/types';

// Desktop-only lazy chunk — never fetched on mobile because the gate below renders null there.
const LiveWaitTicker = dynamic(() => import('./live-wait-ticker').then((m) => m.LiveWaitTicker), {
  ssr: false,
});

/**
 * Desktop-only gate for the hero wait-times ticker.
 *
 * The ticker was previously `hidden md:block` — visually hidden on mobile but still hydrated,
 * pulling its chunk + a React Query poll for something the user never sees. Here it mounts only
 * once a `min-width: 768px` media query confirms desktop, so on mobile it is never added to the
 * tree (no chunk, no polling, nothing on the critical path). This stays a single tree: the gate
 * always renders and the ticker is a conditional child — there is no separate mobile subtree.
 */
export function HeroTickerClient({ items }: { items: TickerItem[] }) {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  if (!isDesktop) return null;
  return (
    <div className="absolute right-0 bottom-0 left-0">
      <LiveWaitTicker initialItems={items} />
    </div>
  );
}
