'use client';

import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { usePlanner } from '@/lib/planner/use-planner';
import { parkGeoFromUrl } from '@/lib/planner/park-url';
import { todayInZone } from '@/lib/planner/park-time';
import type { NearbyAttractionsData } from '@/types/nearby';

/**
 * "You are at Phantasialand: plan today here." A second reader of `/api/nearby`'s `in_park` answer,
 * through `useHomeNearbyParks` with its canonical radius and limit, so React Query dedupes it with
 * the homepage's request. Only inside the open panel, and it never asks for location (see
 * docs/rules/location-is-asked-for-where-it-is-needed.md). Nothing where the park being planned is
 * already the one underfoot. Today, not a date picker: standing in a park is a statement about now.
 */
export function PlannerInParkCta({ activeParkSlug }: { activeParkSlug: string | null }) {
  const t = useTranslations('planner');
  const { openDay } = usePlanner();
  const { data } = useHomeNearbyParks();

  if (data?.type !== 'in_park') return null;
  const park = (data.data as NearbyAttractionsData).park;
  if (!park?.slug || park.slug === activeParkSlug) return null;

  // This answer's park carries no URL (see `parkGeoFromUrl`), so the geography comes off a ride's;
  // `find`, so a ride without a URL does not end the search.
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
            // The park's own today, never the reader's: the reader is standing in this park.
            todayInZone(park.timezone)
          )
        }
        className="bg-primary text-primary-foreground hover:bg-primary/90 planner-phone:min-h-11 flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors"
      >
        <MapPin className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{t('inPark.cta', { park: park.name })}</span>
      </button>
    </div>
  );
}
