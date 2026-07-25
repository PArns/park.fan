'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type L from 'leaflet';
import type { ParkWithAttractions, ParkAttraction, ParkShow } from '@/lib/api/types';
import { formatDistance } from '@/lib/utils/distance-utils';
import { stripNewPrefix } from '@/lib/utils';
import { useMinuteNow } from '@/lib/hooks/use-minute-now';
import { useParkMapGeolocation } from '@/lib/hooks/use-park-map-geolocation';
import { parkIcon, userIcon } from '@/lib/utils/leaflet-icons';
import {
  AttractionMarkers,
  ShowMarkers,
  RestaurantMarkers,
  getNextShowtimeDate,
} from '@/components/parks/park-map-markers';
import 'leaflet/dist/leaflet.css';

// MapBoundsUpdater removed to prevent zoom reset loop

interface ZoomTrackerProps {
  onUserZoom: () => void;
}

function ZoomTracker({ onUserZoom }: ZoomTrackerProps) {
  const map = useMap();
  const userInteractedRef = useRef(false);

  useEffect(() => {
    const handleZoomStart = () => {
      userInteractedRef.current = true;
    };

    const handleZoomEnd = () => {
      if (userInteractedRef.current) {
        onUserZoom();
        userInteractedRef.current = false;
      }
    };

    map.on('zoomstart', handleZoomStart);
    map.on('zoomend', handleZoomEnd);

    return () => {
      map.off('zoomstart', handleZoomStart);
      map.off('zoomend', handleZoomEnd);
    };
  }, [map, onUserZoom]);

  return null;
}

interface MapViewControllerProps {
  center: L.LatLngExpression;
  zoom: number;
  userHasZoomed: boolean;
}

function MapViewController({ center, zoom, userHasZoomed }: MapViewControllerProps) {
  const map = useMap();
  const hasSetInitialView = useRef(false);

  useEffect(() => {
    // Initial view set
    if (!hasSetInitialView.current) {
      map.setView(center, zoom, { animate: false });
      hasSetInitialView.current = true;
      return;
    }

    // Reactive updates - ONLY if user hasn't taken control
    if (!userHasZoomed) {
      map.setView(center, zoom, { animate: true, duration: 1.5 });
    }
  }, [map, center, zoom, userHasZoomed]);

  return null;
}

// Helper function to get wait time for an attraction
function getWaitTime(attraction: ParkAttraction): number | null {
  const standbyQueue = attraction.queues?.find((q) => q.queueType === 'STANDBY');
  return standbyQueue?.waitTime ?? null;
}

// Returns the next show time as a relative string (e.g. "45 min"), used in the in-park panel
function getNextShowTime(show: ParkShow): string | null {
  const nextShow = getNextShowtimeDate(show);
  if (!nextShow) return null;

  const diffMins = Math.floor((nextShow.getTime() - Date.now()) / 60000);

  if (diffMins < 60) {
    return `${diffMins} min`;
  } else {
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours} h ${mins} min`;
  }
}

interface ParkMapProps {
  park: ParkWithAttractions;
}

export function ParkMap({ park }: ParkMapProps) {
  const t = useTranslations('parks.mapMarkers');
  const tCommon = useTranslations('common');
  const [userHasZoomed, setUserHasZoomed] = useState(false);
  // Shared once-per-minute clock (paused in hidden tabs) re-renders the relative
  // time labels in the popups — replaces a private always-on 60 s interval.
  useMinuteNow();

  const validAttractions = useMemo(
    () =>
      park.attractions?.filter(
        (a) => a.latitude != null && a.longitude != null && a.isCurrentlyInSeason !== false
      ) || [],
    [park.attractions]
  );

  const validShows = useMemo(
    () =>
      park.shows?.filter(
        (s) => s.latitude != null && s.longitude != null && s.isCurrentlyInSeason !== false
      ) || [],
    [park.shows]
  );

  const validRestaurants = useMemo(
    () => park.restaurants?.filter((r) => r.latitude != null && r.longitude != null) || [],
    [park.restaurants]
  );

  const { userLocation, nearbyEntities, distanceToPark, isInPark } = useParkMapGeolocation(
    park,
    validAttractions,
    validShows,
    validRestaurants
  );

  // Fallback center (use user location if in park, otherwise park center). Memoized on the
  // primitive coords so its identity is stable across the once-per-minute `useMinuteNow` tick —
  // otherwise a fresh array each render re-triggers MapViewController's setView effect and the
  // map visibly re-pans (animate: true) every 60 s even though nothing moved.
  const center: L.LatLngExpression = useMemo(
    () =>
      isInPark && userLocation
        ? [userLocation.lat, userLocation.lng]
        : park.latitude && park.longitude
          ? [park.latitude, park.longitude]
          : [51.505, -0.09], // London as fallback
    // Depend on the primitive coords, not the `userLocation` object identity: a new object with
    // unchanged lat/lng must NOT recompute `center` (that's exactly what caused the every-minute
    // re-pan). `userLocation?.lat` flipping to/from undefined already covers null↔fix transitions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isInPark, userLocation?.lat, userLocation?.lng, park.latitude, park.longitude]
  );

  if (!park.latitude || !park.longitude) {
    return (
      <div className="bg-muted text-muted-foreground flex h-[500px] items-center justify-center rounded-lg">
        <p>{t('noMapData')}</p>
      </div>
    );
  }

  return (
    <div className="relative h-[65vh] w-full overflow-hidden rounded-lg border md:h-[800px]">
      <MapContainer
        center={center}
        zoom={17}
        maxZoom={23}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxNativeZoom={19}
          maxZoom={23}
        />

        <ZoomTracker onUserZoom={() => setUserHasZoomed(true)} />
        <MapViewController
          center={center}
          zoom={isInPark ? 19 : 17}
          userHasZoomed={userHasZoomed}
        />

        {/* User location marker - rendered FIRST to be topmost in Leaflet */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon}
            zIndexOffset={1000}
          >
            <Popup>
              <div className="font-semibold">{t('yourLocation')}</div>
            </Popup>
          </Marker>
        )}

        {/* Park center marker */}
        {park.latitude && park.longitude && (
          <Marker position={[park.latitude, park.longitude]} icon={parkIcon}>
            <Popup>
              <div className="font-semibold">{stripNewPrefix(park.name)}</div>
              <div className="text-muted-foreground text-xs">{t('parkCenter')}</div>
            </Popup>
          </Marker>
        )}

        <AttractionMarkers attractions={validAttractions} />
        <ShowMarkers shows={validShows} timezone={park.timezone} />
        <RestaurantMarkers restaurants={validRestaurants} />
      </MapContainer>

      {/* Location Info Panel */}
      {userLocation && (
        <div className="bg-background/95 absolute bottom-4 left-4 z-[1000] w-auto min-w-[320px] rounded-lg border p-4 shadow-lg backdrop-blur-sm">
          {isInPark ? (
            <>
              <h3 className="mb-2 text-sm font-semibold">{t('inPark')}</h3>
              {nearbyEntities.length > 0 ? (
                <div className="text-muted-foreground mb-1 text-xs">{t('nearest')}:</div>
              ) : null}
              <ul className="space-y-2">
                {nearbyEntities.map((entity) => {
                  const waitTime =
                    entity.type === 'attraction'
                      ? getWaitTime(entity.data as ParkAttraction)
                      : null;
                  const nextShow =
                    entity.type === 'show' ? getNextShowTime(entity.data as ParkShow) : null;

                  return (
                    <li key={entity.id} className="text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate">
                          {entity.type === 'attraction' && '🎢'} {entity.type === 'show' && '🎭'}{' '}
                          {entity.type === 'restaurant' && '🍴'} {entity.name}
                        </span>
                        <div className="text-muted-foreground flex flex-shrink-0 items-center gap-2 text-[10px]">
                          {waitTime !== null && <span>⏱️ {waitTime} min</span>}
                          {nextShow && (
                            <span>
                              🕐 {tCommon('in')} {nextShow}
                            </span>
                          )}
                          <span>{formatDistance(entity.distance)}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <>
              <h3 className="mb-1 text-sm font-semibold">{t('distanceToPark')}</h3>
              <p className="text-muted-foreground text-xs">
                {distanceToPark !== null && formatDistance(distanceToPark)} {t('away')}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
