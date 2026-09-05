'use client';

import { useTranslations } from 'next-intl';
import { useLiveAttractionData } from '@/lib/hooks/use-live-attraction-data';
import { useAttractionDetail } from '@/lib/hooks/use-attraction-detail';
import { RideNowPanel } from '@/components/parks/ride-now-panel';
import { getLiveAttractionStatus } from '@/lib/utils/park-utils';
import type { ParkWithAttractions } from '@/lib/api/types';

interface RideLiveHeaderProps {
  initialPark: ParkWithAttractions;
  attractionSlug: string;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  /** Today in the park's timezone (`yyyy-MM-dd`), from the server — see `RideNowPanel`. */
  todayIso: string;
}

/**
 * The live half of the ride page's header card — {@link RideNowPanel} with data in it.
 *
 * A wrapper rather than hooks inside the panel, for the same reason `ParkTodayPanel` is handed
 * into `ParkHeaderCard` as a slot: the card is built by a Server Component and everything that
 * reads a query has to cross the client boundary somewhere. Here.
 *
 * It costs no request. Both queries below are the ones `LiveAttractionData` and
 * `AttractionHistorySections` already run, by the same key — React Query serves the three from
 * one fetch, which is the whole reason the ride page polls an attraction rather than its park.
 */
export function RideLiveHeader({
  initialPark,
  attractionSlug,
  continent,
  country,
  city,
  parkSlug,
  todayIso,
}: RideLiveHeaderProps) {
  const t = useTranslations('attractions');

  const { park, attraction, isFetching } = useLiveAttractionData({
    continent,
    country,
    city,
    parkSlug,
    attractionSlug,
    initialPark,
  });
  const { data: detail } = useAttractionDetail({
    continent,
    country,
    city,
    parkSlug,
    attractionSlug,
  });

  if (!attraction) return null;

  // The same reading the ride's own card and the park's filter make — `getLiveAttractionStatus`
  // prefers the API's `effectiveStatus`, which is the only source that knows a ride is out of
  // season, and reports UNKNOWN rather than flattening it to closed.
  const status = getLiveAttractionStatus(attraction, park.status);
  // `todayIso` is the SERVER's answer, in the park's timezone. A tab left open across midnight in
  // the park would keep yesterday's row until the next navigation; the alternative is a browser
  // clock, and that one costs the typical/busy pair its place in the served HTML for every visit.
  const todaySchedule = detail?.schedule?.find((s) => s.date === todayIso) ?? null;

  return (
    <RideNowPanel
      park={park}
      attraction={attraction}
      status={status}
      statusLabel={t(`status.${status.toLowerCase()}` as 'status.operating')}
      todayIso={todayIso}
      todaySchedule={todaySchedule}
      isRefreshing={isFetching}
    />
  );
}
