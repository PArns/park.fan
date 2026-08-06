'use client';

import dynamic from 'next/dynamic';
import { useAfterLoad } from '@/lib/hooks/use-after-load';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import type { WorldPanelContinent } from './hero-world-panel';

// The panel carries the (generated) world-map path data — lazy so that chunk only ever
// loads on viewports that render it.
const HeroWorldPanelClient = dynamic(
  () => import('./hero-world-panel-client').then((m) => m.HeroWorldPanelClient),
  {
    ssr: false,
    loading: () => (
      <div className="border-border/50 bg-background/40 h-[540px] animate-pulse rounded-2xl border shadow-xl backdrop-blur-md" />
    ),
  }
);

/**
 * Mounts the world-map panel only when there is room for it (xl viewports) AND the page has
 * loaded + gone idle — the map must never compete with the hero photo (LCP). Below xl the
 * right grid column simply stays empty (the user asked for the panel only "when there's
 * enough space"). Same gate pattern the old hero ticker used.
 */
export function HeroWorldPanelGate({ continents }: { continents: WorldPanelContinent[] }) {
  const ready = useAfterLoad();
  const hasRoom = useMediaQuery('(min-width: 1280px)');

  if (!ready || !hasRoom) return null;
  return <HeroWorldPanelClient continents={continents} />;
}
