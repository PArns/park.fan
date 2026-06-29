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
  loading: () => (
    <div className="border-primary/15 bg-muted/40 aspect-[16/10] w-full animate-pulse rounded-xl border sm:aspect-[16/9]" />
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
