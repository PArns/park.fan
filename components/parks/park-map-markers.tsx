'use client';

import { memo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Marker, Popup } from 'react-leaflet';
import type { ParkAttraction, ParkShow, ParkRestaurant } from '@/lib/api/types';
import { stripNewPrefix } from '@/lib/utils';
import {
  attractionOperatingIcon,
  attractionClosedIcon,
  showIcon,
  restaurantIcon,
} from '@/lib/utils/leaflet-icons';

// Returns the next future showtime as a Date, or null if none remain
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
}

// Memoized: `attractions` is a `useMemo`-stable array in ParkMap, and nothing here is
// time-relative — so the once-per-minute `useMinuteNow` tick (needed only by the show
// markers) no longer reconciles every attraction marker. Re-renders only when the 5-min
// park poll actually changes the attractions.
export const AttractionMarkers = memo(function AttractionMarkers({
  attractions,
}: AttractionMarkersProps) {
  const t = useTranslations('parks.mapMarkers');
  const tParks = useTranslations('parks');

  return (
    <>
      {attractions.map((attraction) => {
        const isOperating = attraction.status === 'OPERATING';
        const icon = isOperating ? attractionOperatingIcon : attractionClosedIcon;

        // Get wait time from queues
        const standbyQueue = attraction.queues?.find((q) => q.queueType === 'STANDBY');
        const waitTime = standbyQueue?.waitTime;

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
                {waitTime !== null && waitTime !== undefined && (
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
}

export function ShowMarkers({ shows, timezone }: ShowMarkersProps) {
  const t = useTranslations('parks.mapMarkers');
  const locale = useLocale();

  return (
    <>
      {shows.map((show) => (
        <Marker key={show.id} position={[show.latitude!, show.longitude!]} icon={showIcon}>
          <Popup>
            <div>
              <div className="font-semibold">{stripNewPrefix(show.name)}</div>
              <div className="text-muted-foreground text-xs">{t('show')}</div>
              {(() => {
                const nextShowtime = getNextShowtimeDate(show);
                return nextShowtime ? (
                  <div className="mt-1 text-xs">
                    {t('nextShowtime')}:{' '}
                    {nextShowtime.toLocaleTimeString(locale, {
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
}

interface RestaurantMarkersProps {
  restaurants: ParkRestaurant[];
}

// Memoized like AttractionMarkers — restaurants carry no time-relative content, so the
// minute tick never needs to touch them.
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
