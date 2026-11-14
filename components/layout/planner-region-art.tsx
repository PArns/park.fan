'use client';

import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { HubBannerPhoto } from '@/components/layout/hub-banner';
import { useMenuBandOpened } from '@/components/layout/menu-band';
import { PhotoCredit, TILE_CREDIT_POSITION } from '@/components/media/photo-credit';
import { TRIP_REGIONS } from '@/lib/trip-regions/registry';
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
    TRIP_REGIONS.flatMap(({ slug: id, scene: load }) =>
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
 * The picture of a region's card in the planner band: its Parky scene where `TRIP_REGIONS` gives
 * it one, else the hub's photo. The scene is fetched the first time the band opens and stays
 * mounted after, so no page carries its markup, or a photo it would cover, in the HTML; a crawler
 * loses nothing, since it is decoration (`aria-hidden` by the scene's own contract). It fades in
 * over the card's ground rather than cutting, and a chunk that fails to load leaves the photo.
 */
export function PlannerRegionArt({
  regionId,
  photo,
}: {
  regionId: string;
  photo: MoreMenuPhoto | null;
}) {
  const armed = useMenuBandOpened();

  const photoArt = (
    <>
      <HubBannerPhoto photo={photo} />
      <PhotoCredit src={photo?.src} className={TILE_CREDIT_POSITION} />
    </>
  );
  const Scene = SCENES[regionId];
  if (!Scene) return photoArt;
  if (!armed) return null;

  return (
    <Suspense fallback={null}>
      <span
        aria-hidden="true"
        className="absolute inset-0 transition-opacity duration-300 starting:opacity-0"
      >
        <Scene className="h-full w-full" fallback={photoArt} />
      </span>
    </Suspense>
  );
}

/**
 * A region's scene cut to a 56 × 36 box, for its row in the phone sheet where several regions are
 * listed. The sheet's content is mounted only while the sheet is open, so the chunk loads on its
 * first opening and no page carries the markup; until then, and for a region without a scene, the
 * box is the muted ground.
 */
export function RegionSceneCut({ regionId }: { regionId: string }) {
  const Scene = SCENES[regionId];
  return (
    <span
      aria-hidden="true"
      className="bg-muted relative block h-9 w-14 shrink-0 overflow-hidden rounded-md ring-1 ring-black/10 dark:ring-white/10"
    >
      {Scene && (
        <Suspense fallback={null}>
          <Scene className="h-full w-full" fallback={null} />
        </Suspense>
      )}
    </span>
  );
}
