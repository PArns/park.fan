'use client';

import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { HubBannerPhoto } from '@/components/layout/hub-banner';
import { useMenuBandOpened } from '@/components/layout/menu-band';
import { PhotoCredit, TILE_CREDIT_POSITION } from '@/components/media/photo-credit';
import { LazyMount } from '@/components/parks/lazy-mount';
import { useAfterLoad } from '@/lib/hooks/use-after-load';
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

/** A region's lazily loaded Parky scene, as {@link useRegionScene} hands it out. */
export type RegionScene = LazyExoticComponent<ComponentType<ArtProps>>;

/**
 * A region's Parky scene, or `null` where `TRIP_REGIONS` gives it none: the one loader for the
 * planner band, the park tile, the phone sheet and the trip planner's assistant. The chunk is
 * fetched when the component first renders, inside a `Suspense`; one that fails renders its
 * `fallback`.
 */
export function useRegionScene(regionId: string): RegionScene | null {
  return SCENES[regionId] ?? null;
}

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
  const Scene = useRegionScene(regionId);

  const photoArt = (
    <>
      <HubBannerPhoto photo={photo} />
      <PhotoCredit src={photo?.src} className={TILE_CREDIT_POSITION} />
    </>
  );
  if (!Scene) return photoArt;
  if (!armed) return null;

  return <SceneFade Scene={Scene} fallback={photoArt} />;
}

/**
 * A loaded scene filling its box, faded in over the card's ground rather than cut in; the scene
 * comes from {@link useRegionScene}.
 */
export function SceneFade({ Scene, fallback }: { Scene: RegionScene; fallback: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <span
        aria-hidden="true"
        className="absolute inset-0 transition-opacity duration-300 starting:opacity-0"
      >
        <Scene className="h-full w-full" fallback={fallback} />
      </span>
    </Suspense>
  );
}

/**
 * A region's scene in a card on a page, the planner tile on a park's pages: fetched once the page
 * has loaded and the card nears the screen (`LazyMount`), and kept from then on, so the chunk
 * costs the first load nothing and a card below the fold costs a reader who never scrolls there
 * nothing at all. It fills the box its parent reserves, which is what keeps it from shifting the
 * page. Until it arrives, for a region without a scene and where the chunk fails, the box shows
 * the card's ground.
 */
export function RegionSceneInView({ regionId }: { regionId: string }) {
  const loaded = useAfterLoad();
  const Scene = useRegionScene(regionId);
  if (!Scene || !loaded) return null;
  return (
    <LazyMount className="absolute inset-0">
      <SceneFade Scene={Scene} fallback={null} />
    </LazyMount>
  );
}

/**
 * A region's scene cut to a 56 × 36 box, for its row in the phone sheet where several regions are
 * listed. The sheet's content is mounted only while the sheet is open, so the chunk loads on its
 * first opening and no page carries the markup; until then, and for a region without a scene, the
 * box is the muted ground.
 */
export function RegionSceneCut({ regionId }: { regionId: string }) {
  const Scene = useRegionScene(regionId);
  return (
    <span
      aria-hidden="true"
      className="bg-muted relative block h-9 w-14 shrink-0 overflow-hidden rounded-md ring-1 ring-black/10 dark:ring-white/10"
    >
      {Scene && <SceneFade Scene={Scene} fallback={null} />}
    </span>
  );
}
