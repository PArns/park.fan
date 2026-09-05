'use client';

import { useTranslations } from 'next-intl';
import { formatInTimeZone } from 'date-fns-tz';
import { useLiveAttractionData } from '@/lib/hooks/use-live-attraction-data';
import { useAttractionDetail } from '@/lib/hooks/use-attraction-detail';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
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
}: RideLiveHeaderProps) {
  const t = useTranslations('attractions');
  const browserNow = useBrowserNow(60_000);

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
  const timezone = park.timezone ?? 'UTC';
  // Today in the PARK's timezone — the row a Florida park is on is not the row Berlin is on.
  const todayIso = browserNow ? formatInTimeZone(browserNow, timezone, 'yyyy-MM-dd') : null;
  const todaySchedule = todayIso
    ? (detail?.schedule?.find((s) => s.date === todayIso) ?? null)
    : null;

  return (
    <RideNowPanel
      park={park}
      attraction={attraction}
      status={status}
      statusLabel={t(`status.${status.toLowerCase()}` as 'status.operating')}
      todaySchedule={todaySchedule}
      isRefreshing={isFetching}
    />
  );
}
