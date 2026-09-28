'use client';

import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { useMounted } from '@/lib/hooks/use-mounted';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import type { NearbyParksData } from '@/types/nearby';

/** API returns distance in meters. Only show "Nearby: Park" when nearest park is within this (m). */
const NEAR_PARK_HEADER_RADIUS_M = 5000; // 5 km

/**
 * The header's "you are near <park>" link: a pin in the bar (`bar`), a full row in the burger
 * sheet (`sheet`).
 *
 * Its own component because of what it subscribes to. `useHomeNearbyParks` reads the geolocation
 * context, an after-load flag and a query, and each of them changes several times per page load
 * (and again on every refetch while there is a position). Read in `Header`, every one of those
 * changes re-rendered the whole bar: four nav menus, five mega-menu panels, two search commands
 * and the toggles, for a 28 px pin most visitors never see. Here only the pin re-renders.
 */
export function HeaderNearbyPark({ variant }: { variant: 'bar' | 'sheet' }) {
  const t = useTranslations('navigation');
  const { data: nearbyData } = useHomeNearbyParks();
  /*
   * Erst nach dem Mount, wie überall an dieser Query.
   *
   * `useHomeNearbyParks` seedet aus `localStorage`, also gibt es die Pille auf dem Server nicht
   * und im ersten Client-Render eines Besuchers, der schon einmal in Parknähe war, schon — ein
   * Hydration-Fehler mitten im Header, nach dem React die ganze Leiste neu rendert. Auf einer
   * Maschine ohne Standort fällt das nie auf, weil die Pille dort nie erscheint.
   */
  const mounted = useMounted();
  const parks =
    nearbyData?.type === 'nearby_parks' ? (nearbyData.data as NearbyParksData).parks : [];
  const nearestPark = parks[0];
  if (!mounted || nearestPark == null || nearestPark.distance > NEAR_PARK_HEADER_RADIUS_M) {
    return null;
  }

  const label = t('nearbyPark', { parkName: nearestPark.name });
  const href = convertApiUrlToFrontendUrl(nearestPark.url);

  if (variant === 'sheet') {
    return (
      <Link
        href={href}
        prefetch={false}
        className="bg-muted/80 hover:bg-muted text-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        aria-label={label}
        data-sheet-stagger
      >
        <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      prefetch={false}
      className="bg-muted/80 hover:bg-muted text-foreground flex size-7 items-center justify-center gap-1.5 rounded-full text-xs font-medium transition-colors @min-[1280px]:w-auto @min-[1280px]:px-3"
      aria-label={label}
      title={label}
    >
      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="hidden max-w-24 truncate @min-[1280px]:inline @min-[1536px]:max-w-[140px]">
        {nearestPark.name}
      </span>
    </Link>
  );
}
