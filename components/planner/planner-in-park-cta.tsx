'use client';

import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { usePlanner } from '@/lib/planner/use-planner';
import { parkGeoFromUrl } from '@/lib/planner/park-url';
import { todayInZone } from '@/lib/planner/park-time';
import type { NearbyAttractionsData } from '@/types/nearby';

/**
 * "You are at Phantasialand — plan today here."
 *
 * The planner asked which park every single time, including when the visitor was
 * standing in one. `/api/nearby` already answers `in_park` with the park's slug,
 * name, timezone and URL, and the homepage has been reading it since long before
 * the planner existed — so this is a second reader of an answer the app already
 * has rather than a new question it asks.
 *
 * Three things keep it from being intrusive. It goes through
 * `useHomeNearbyParks`, whose radius and limit are the canonical pair, so on a
 * page that already asks this question React Query dedupes the two into one
 * request rather than adding a second with a different key. It is rendered only
 * inside the open panel, so a page nobody planned on makes no extra request at
 * all. And the geolocation context never prompts on mount — it reads a position
 * only where permission is already granted, and otherwise falls back to GeoIP —
 * so opening the planner cannot produce a permission dialog.
 *
 * It renders nothing where the park being planned is already the one underfoot,
 * which is the common case the moment somebody has used it once: an offer to do
 * what has just been done is noise.
 *
 * TODAY and not a date picker. Standing in a park is a statement about now.
 */
export function PlannerInParkCta({ activeParkSlug }: { activeParkSlug: string | null }) {
  const t = useTranslations('planner');
  const { openDay } = usePlanner();
  const { data } = useHomeNearbyParks();

  if (data?.type !== 'in_park') return null;
  const park = (data.data as NearbyAttractionsData).park;
  if (!park?.slug || park.slug === activeParkSlug) return null;

  // The park object carries no URL in this answer (see `parkGeoFromUrl`), so the
  // geography is read off a ride's — every one of them names the same four
  // slugs. `find` rather than `[0]`: a ride with no URL must not end the search.
  const geo =
    parkGeoFromUrl(park.url) ??
    (data.data as NearbyAttractionsData).rides.reduce<ReturnType<typeof parkGeoFromUrl>>(
      (found, ride) => found ?? parkGeoFromUrl(ride.url),
      null
    );
  if (!geo) return null;

  return (
    <div className="border-border/60 shrink-0 border-t px-2 py-2">
      <button
        type="button"
        onClick={() =>
          openDay(
            { slug: park.slug, name: park.name, geo, timezone: park.timezone },
            // The park's own today, never the reader's: the two differ for
            // anybody in a park west of their own clock, and the whole premise
            // here is that the reader is standing in this one.
            todayInZone(park.timezone)
          )
        }
        className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors max-sm:min-h-11"
      >
        <MapPin className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{t('inPark.cta', { park: park.name })}</span>
      </button>
    </div>
  );
}
