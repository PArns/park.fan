'use client';

import dynamic from 'next/dynamic';
import { useAfterLoad } from '@/lib/hooks/use-after-load';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { HeroWorldPanelSkeleton } from '@/components/home/hero-skeletons';
import type { WorldPanelContinent } from './hero-world-panel';

// The panel carries the (generated) world-map path data — lazy so that chunk only ever
// loads on viewports that render it.
const HeroWorldPanelClient = dynamic(
  () => import('./hero-world-panel-client').then((m) => m.HeroWorldPanelClient),
  { ssr: false, loading: () => <HeroWorldPanelSkeleton /> }
);

/**
 * Mounts the world-map panel only when there is room for it (xl viewports) AND the page has
 * loaded + gone idle — the map must never compete with the hero photo (LCP). Below xl the right
 * grid column simply stays empty (the user asked for the panel only "when there's enough
 * space"). Same gate pattern the old hero ticker used.
 *
 * Until then it renders the skeleton. Note it does so even below xl, where the panel will never
 * appear: `useAfterLoad` and `useMediaQuery` are both false during SSR and on the first client
 * render, so this branch IS the server output — and the parent column is `hidden xl:block`, so
 * a narrow viewport hides the skeleton in CSS and pays only for the markup. The alternative
 * (returning null until the media query resolves) would leave the panel's box empty through
 * first paint and pop the skeleton in after hydration, which is the flicker this avoids.
 */
export function HeroWorldPanelGate({ continents }: { continents: WorldPanelContinent[] }) {
  const ready = useAfterLoad();
  const hasRoom = useMediaQuery('(min-width: 1280px)');

  if (!ready || !hasRoom) return <HeroWorldPanelSkeleton />;
  return <HeroWorldPanelClient continents={continents} />;
}
