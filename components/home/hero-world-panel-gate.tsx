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
 * Mounts the world-map panel only on xl viewports and after load and idle, so the map never
 * competes with the hero photo for LCP. Until then it renders the skeleton, below xl too: that is
 * the server output, and the parent column's `hidden xl:block` hides it there, whereas returning
 * null would pop the skeleton in after hydration.
 */
export function HeroWorldPanelGate({ continents }: { continents: WorldPanelContinent[] }) {
  const ready = useAfterLoad();
  const hasRoom = useMediaQuery('(min-width: 1280px)');

  if (!ready || !hasRoom) return <HeroWorldPanelSkeleton />;
  // Whether the entrance still belongs to the hero's choreography is decided inside the panel,
  // not here: this component renders from hydration onwards (showing the skeleton), so a check
  // at THIS point reads the clock long before the panel actually appears.
  return <HeroWorldPanelClient continents={continents} />;
}
