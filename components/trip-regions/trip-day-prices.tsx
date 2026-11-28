'use client';

import { useQuery } from '@tanstack/react-query';
import { ParkPurchasesCard } from '@/components/parks/park-purchases-card';
import { parkGeo } from '@/lib/trip-regions/hub-data';
import { inPurchaseWindow, type PurchaseDay } from '@/lib/parks/purchases';
import type { TripRegionPark } from '@/lib/trip-regions/types';
import { parkRelayUrl } from '@/lib/parks/paths';

/**
 * A park's Lightning Lane prices on one day of a trip sheet, the hub's and the planner's, as the park
 * page shows them (`ParkPurchasesCard`). Asked when the sheet shows the park, and only for a park
 * the region lists in `dayPriceParks` on a day the relay's answer can hold: one request per park,
 * the same for every day of the window, so a second day costs none. A day without prices draws
 * nothing. Shown beside the day's figure, never part of it.
 */
export function TripDayPrices({
  park,
  date,
  today,
  dayPriceParks,
  note,
  headingLevel,
  className,
}: {
  park: TripRegionPark;
  date: string;
  /** The region's today, `null` while the browser has not read its clock. */
  today: string | null;
  dayPriceParks: readonly string[] | undefined;
  /** The park's name beside the title, where the sheet holds two parks. */
  note?: string;
  headingLevel: 3 | 4;
  className?: string;
}) {
  const geo = parkGeo(park);
  const asks =
    geo !== null && (dayPriceParks?.includes(park.slug) ?? false) && inPurchaseWindow(date, today);
  const { data } = useQuery<{ days: PurchaseDay[] }>({
    queryKey: ['park-purchases', geo?.continent, geo?.country, geo?.city, park.slug],
    queryFn: async () => {
      const response = await fetch(parkRelayUrl({ ...geo!, parkSlug: park.slug }, '/purchases'));
      if (!response.ok) throw new Error(`Park purchases ${response.status}`);
      return response.json();
    },
    enabled: asks,
    staleTime: 60 * 60 * 1000,
  });
  if (!asks) return null;
  return (
    <ParkPurchasesCard
      schedule={data?.days}
      timezone={park.timezone}
      date={date}
      note={note}
      headingLevel={headingLevel}
      wrapNames
      className={className}
    />
  );
}
