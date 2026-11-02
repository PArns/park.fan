'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { trackSiteEvent } from '@/lib/analytics/site-analytics';
import { linkBlockAttributes } from '@/lib/analytics/internal-link';
import { useActiveOnScreen } from '@/lib/hooks/use-active-on-screen';

/**
 * Holds the homepage's Parky stop and reports `home_parky_seen` once it reaches the middle of the
 * screen, which the live Parky answers with a hop and "That's me!" (`reactions.ts`).
 */
export function ParkyHello({ children }: { children: ReactNode }) {
  const { ref, active } = useActiveOnScreen('-35% 0px -35% 0px');
  const said = useRef(false);
  useEffect(() => {
    if (!active || said.current) return;
    said.current = true;
    trackSiteEvent('home_parky_seen');
  }, [active]);
  return (
    <div ref={ref} {...linkBlockAttributes('nav')}>
      {children}
    </div>
  );
}
