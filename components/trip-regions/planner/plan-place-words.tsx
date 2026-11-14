'use client';

import { useTranslations } from 'next-intl';
import type { TripGateway } from '@/lib/trip-regions/types';
import { usePlanContext } from './plan-context';

/**
 * The places of a region as a reader says them, by the API's key: a hotel area, a base, a gateway.
 * The API names them once, in English ("Universal Orlando hotels", "Tokyo", "Haneda Airport"); the
 * region's own words (`tripRegion.planner.area.<key>`, `base.<key>`, `gateway.<code>`) win where
 * they have the key, and a place they lack keeps the API's name.
 */

/** A hotel area's name: "Universal-Hotels" in German, where the API says "Universal Orlando hotels". */
export function useAreaName(): (key: string) => string {
  const tRegion = useTranslations('tripRegion.planner');
  const { region } = usePlanContext();
  return (key) => {
    const own = `area.${key}`;
    if (tRegion.has(own)) return tRegion(own);
    return region.hotelAreas.find((a) => a.key === key)?.name ?? key;
  };
}

/** A base's name: "Tokio" in German. */
export function useBaseName(): (key: string) => string {
  const tRegion = useTranslations('tripRegion.planner');
  const { region } = usePlanContext();
  return (key) => {
    const own = `base.${key}`;
    if (tRegion.has(own)) return tRegion(own);
    return region.bases?.find((b) => b.key === key)?.name ?? key;
  };
}

/** A gateway's short name: "Haneda", "Charles de Gaulle". */
export function useGatewayName(): (gateway: TripGateway) => string {
  const tRegion = useTranslations('tripRegion.planner');
  return (gateway) => {
    const own = `gateway.${gateway.code}`;
    return tRegion.has(own) ? tRegion(own) : gateway.name;
  };
}
