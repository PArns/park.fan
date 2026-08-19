'use client';

/**
 * Public entry for the glossary 3-D coaster player. Code-splits the heavy
 * three.js scene + controls (`coaster-player-scene`) behind a `ssr:false`
 * dynamic import so three.js never lands in SSR or the page's initial bundle;
 * a matching-shape skeleton holds the layout while that chunk downloads.
 */

import nextDynamic from 'next/dynamic';
import type { CoasterPlayerLabels } from './coaster-player-scene';

export type { CoasterPlayerLabels } from './coaster-player-scene';

const Scene = nextDynamic(() => import('./coaster-player-scene'), {
  ssr: false,
  // Same shell as the scene itself: the aspect-ratio stage AND the 57 px
  // transport row below it. The placeholder used to be the stage alone, so the
  // player grew by a row the moment the chunk landed and shoved the rest of the
  // term page down with it.
  loading: () => (
    <div className="border-primary/15 bg-muted/40 w-full animate-pulse overflow-hidden rounded-xl border">
      <div className="aspect-[16/10] w-full sm:aspect-[16/9]" />
      <div className="border-t px-3 py-2.5">
        <div className="h-9" />
      </div>
    </div>
  ),
});

export interface CoasterPlayerProps {
  element: string;
  labels: CoasterPlayerLabels;
  className?: string;
}

export function CoasterPlayer(props: CoasterPlayerProps) {
  return <Scene {...props} />;
}
