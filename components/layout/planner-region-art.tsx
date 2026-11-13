'use client';

import { lazy, Suspense, useState, type ComponentType, type LazyExoticComponent } from 'react';
import { HubBannerPhoto } from '@/components/layout/hub-banner';
import { useMenuBandOpen } from '@/components/layout/menu-band';
import { PhotoCredit, TILE_CREDIT_POSITION } from '@/components/media/photo-credit';
import { TRIP_REGIONS } from '@/lib/navigation/trip-regions';
import type { MoreMenuPhoto } from '@/lib/navigation/more-menu';

/** What the lazily loaded art receives: the scene's box, and what to draw if it never arrives. */
interface ArtProps {
  className?: string;
  fallback: React.ReactNode;
}

/**
 * One lazy component per region with a scene, made once at module scope, so its identity never
 * changes. A chunk that fails to load resolves to the fallback rather than throwing: the header has
 * no error boundary, and a tile is no reason to lose the bar.
 */
const SCENES: Partial<Record<string, LazyExoticComponent<ComponentType<ArtProps>>>> =
  Object.fromEntries(
    TRIP_REGIONS.flatMap(({ id, scene: load }) =>
      load
        ? [
            [
              id,
              lazy(() =>
                load().then(
                  ({ default: Scene }) => ({
                    default: function RegionScene({ className }: ArtProps) {
                      return <Scene className={className} />;
                    },
                  }),
                  () => ({
                    default: function RegionSceneMissing({ fallback }: ArtProps) {
                      return <>{fallback}</>;
                    },
                  })
                )
              ),
            ] as const,
          ]
        : []
    )
  );

/**
 * The picture of a region's tile in the planner band: its Parky scene where `TRIP_REGIONS` gives
 * it one, else the hub's photo. The scene is fetched the first time the band opens and stays
 * mounted after, so no page carries its markup in the HTML and a crawler loses nothing (it is
 * decoration, `aria-hidden` by the scene's own contract). Until it arrives the photo stands in, and
 * the scene fades in over the tile rather than cutting.
 */
export function PlannerRegionArt({
  regionId,
  photo,
}: {
  regionId: string;
  photo: MoreMenuPhoto | null;
}) {
  const open = useMenuBandOpen();
  // Armed on the first opening and never disarmed, adjusted during render: a closed band keeps its
  // scene rather than dropping back to the photo.
  const [armed, setArmed] = useState(false);
  if (open && !armed) setArmed(true);

  const photoArt = (
    <>
      <HubBannerPhoto photo={photo} />
      <PhotoCredit src={photo?.src} className={TILE_CREDIT_POSITION} />
    </>
  );
  const Scene = SCENES[regionId];
  if (!Scene || !armed) return photoArt;

  return (
    <Suspense fallback={photoArt}>
      <span
        aria-hidden="true"
        className="absolute inset-0 transition-opacity duration-300 starting:opacity-0"
      >
        <Scene className="block h-full w-full" fallback={photoArt} />
      </span>
    </Suspense>
  );
}
