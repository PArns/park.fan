'use client';

import { memo, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Marker, Popup } from 'react-leaflet';
import type { Marker as LeafletMarker } from 'leaflet';
import type { ParkAttraction, ParkShow, ParkRestaurant } from '@/lib/api/types';
import { stripNewPrefix } from '@/lib/utils';
import { getStandbyWait } from '@/lib/utils/park-utils';
import {
  attractionOperatingIcon,
  attractionClosedIcon,
  showIcon,
  restaurantIcon,
} from '@/lib/utils/leaflet-icons';
import { formatTime } from '@/lib/utils/intl-format';
import { formatDuration } from '@/lib/utils/temperature';
import { Speed, TrackLength } from '@/components/common/unit-display';
import type { RideFigures } from '@/lib/api/ride-figures';

/** The show's next start time still to come, or `null` when none remain. */
export function getNextShowtimeDate(show: ParkShow): Date | null {
  if (!show.showtimes || show.showtimes.length === 0) return null;

  const now = new Date();
  const futureShowtimes = show.showtimes
    .map((st) => new Date(st.startTime))
    .filter((time: Date) => time > now)
    .sort((a: Date, b: Date) => a.getTime() - b.getTime());

  return futureShowtimes[0] ?? null;
}

interface AttractionMarkersProps {
  attractions: ParkAttraction[];
  /** Speed, height and duration by attraction id; empty until the map's own fetch lands. */
  figures?: Record<string, RideFigures>;
}

/**
 * The ride pins. Memoised: nothing here is time-relative, so the minute tick the show markers need
 * does not reconcile them.
 */
export const AttractionMarkers = memo(function AttractionMarkers({
  attractions,
  figures,
}: AttractionMarkersProps) {
  const t = useTranslations('parks.mapMarkers');
  const tParks = useTranslations('parks');

  return (
    <>
      {attractions.map((attraction) => {
        const isOperating = attraction.status === 'OPERATING';
        const icon = isOperating ? attractionOperatingIcon : attractionClosedIcon;

        const waitTime = getStandbyWait(attraction);
        const ride = figures?.[attraction.id];

        return (
          <Marker
            key={attraction.id}
            position={[attraction.latitude!, attraction.longitude!]}
            icon={icon}
          >
            <Popup>
              <div>
                <div className="font-semibold">{stripNewPrefix(attraction.name)}</div>
                {attraction.land && (
                  <div className="text-muted-foreground text-xs">{attraction.land}</div>
                )}
                {attraction.status && (
                  <div className="mt-1 text-xs">
                    {t('status')}:{' '}
                    <span className={isOperating ? 'text-status-operating' : 'text-status-closed'}>
                      {tParks(`status.${attraction.status}`)}
                    </span>
                  </div>
                )}
                {waitTime !== null && (
                  <div className="mt-1 text-xs">
                    {t('waitTime')}: <span className="font-semibold">{waitTime} min</span>
                  </div>
                )}
                {attraction.crowdLevel && (
                  <div className="mt-1 text-xs">
                    {t('crowdLevel')}:{' '}
                    <span className="font-semibold">
                      {tParks(`crowdLevels.${attraction.crowdLevel}`)}
                    </span>
                  </div>
                )}
                {ride?.topSpeedKmh != null && (
                  <div className="mt-1 text-xs">
                    {t('topSpeed')}:{' '}
                    <span className="font-semibold">
                      <Speed kmh={ride.topSpeedKmh} />
                    </span>
                  </div>
                )}
                {ride?.heightM != null && (
                  <div className="mt-1 text-xs">
                    {t('height')}:{' '}
                    <span className="font-semibold">
                      <TrackLength meters={ride.heightM} />
                    </span>
                  </div>
                )}
                {ride?.durationSeconds != null && (
                  <div className="mt-1 text-xs">
                    {t('duration')}:{' '}
                    <span className="font-semibold">{formatDuration(ride.durationSeconds)}</span>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
});

interface ShowMarkersProps {
  shows: ParkShow[];
  /** IANA timezone of the park, used to render showtimes in park-local time. */
  timezone: string;
  /**
   * Slug of the show a `#map-show-<slug>` deep link named. Its popup opens on mount, so a „nächste
   * Shows" row lands on that show's marker rather than on a map of identical pins.
   */
  focusSlug?: string | null;
}

/** The show pins, memoised like their siblings; the props are `useMemo`-stable at the call site. */
export const ShowMarkers = memo(function ShowMarkers({
  shows,
  timezone,
  focusSlug,
}: ShowMarkersProps) {
  const t = useTranslations('parks.mapMarkers');
  const locale = useLocale();

  /**
   * The marker a `#map-show-<slug>` deep link named, opened from a parent effect: react-leaflet's
   * `<Popup>` binds to its marker in its own effect, so `openPopup()` in the ref callback is a
   * silent no-op.
   */
  const focusRef = useRef<LeafletMarker | null>(null);
  useEffect(() => {
    if (!focusSlug) return;
    // One frame later still: Leaflet positions the popup against the map pane, and opening it
    // during the same commit that sets the view puts it at the pre-pan coordinates.
    const raf = requestAnimationFrame(() => focusRef.current?.openPopup());
    return () => cancelAnimationFrame(raf);
  }, [focusSlug]);

  return (
    <>
      {shows.map((show) => (
        <Marker
          key={show.id}
          position={[show.latitude!, show.longitude!]}
          icon={showIcon}
          ref={focusSlug && show.slug === focusSlug ? focusRef : undefined}
        >
          <Popup>
            <div>
              <div className="font-semibold">{stripNewPrefix(show.name)}</div>
              <div className="text-muted-foreground text-xs">{t('show')}</div>
              {(() => {
                const nextShowtime = getNextShowtimeDate(show);
                return nextShowtime ? (
                  <div className="mt-1 text-xs">
                    {t('nextShowtime')}:{' '}
                    {formatTime(nextShowtime, locale, {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: timezone,
                    })}
                  </div>
                ) : null;
              })()}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
});

interface RestaurantMarkersProps {
  restaurants: ParkRestaurant[];
}

/** The restaurant pins, memoised: they carry nothing time-relative. */
export const RestaurantMarkers = memo(function RestaurantMarkers({
  restaurants,
}: RestaurantMarkersProps) {
  const t = useTranslations('parks.mapMarkers');

  return (
    <>
      {restaurants.map((restaurant) => (
        <Marker
          key={restaurant.id}
          position={[restaurant.latitude!, restaurant.longitude!]}
          icon={restaurantIcon}
        >
          <Popup>
            <div>
              <div className="font-semibold">{stripNewPrefix(restaurant.name)}</div>
              <div className="text-muted-foreground text-xs">{t('restaurant')}</div>
              {restaurant.cuisineType && (
                <div className="mt-1 text-xs">
                  {t('cuisine')}: {restaurant.cuisineType}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
});
