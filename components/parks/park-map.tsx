'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type L from 'leaflet';
import type { ParkWithAttractions, ParkAttraction, ParkShow } from '@/lib/api/types';
import { formatDistance } from '@/lib/utils/distance-utils';
import { getStandbyWait } from '@/lib/utils/park-utils';
import { stripNewPrefix } from '@/lib/utils';
import { useMinuteNow } from '@/lib/hooks/use-minute-now';
import { useParkMapGeolocation } from '@/lib/hooks/use-park-map-geolocation';
import { useRideFigures } from '@/lib/hooks/use-ride-figures';
import { parkIcon, userIcon } from '@/lib/utils/leaflet-icons';
import { cartoTileUrl } from '@/lib/utils/carto-tile-url';
import {
  AttractionMarkers,
  ShowMarkers,
  RestaurantMarkers,
  getNextShowtimeDate,
} from '@/components/parks/park-map-markers';
import 'leaflet/dist/leaflet.css';

interface ZoomTrackerProps {
  onUserZoom: () => void;
}

/** Maps whose next zoom is one `MapViewController` started itself. */
const programmaticZoom = new WeakSet<L.Map>();

/**
 * Reports a zoom the visitor made. Leaflet fires `zoomstart`/`zoomend` for `setView` too, so a zoom
 * the controller started (`programmaticZoom`) must not count as the visitor taking control, or the
 * map would stop following them.
 */
function ZoomTracker({ onUserZoom }: ZoomTrackerProps) {
  const map = useMap();
  const userInteractedRef = useRef(false);

  useEffect(() => {
    const handleZoomStart = () => {
      userInteractedRef.current = !programmaticZoom.has(map);
    };

    const handleZoomEnd = () => {
      programmaticZoom.delete(map);
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
    // Only a view that changes the zoom fires zoom events for `ZoomTracker` to misread.
    const markIfZooming = () => {
      if (map.getZoom() !== zoom) programmaticZoom.add(map);
    };

    if (!hasSetInitialView.current) {
      markIfZooming();
      map.setView(center, zoom, { animate: false });
      hasSetInitialView.current = true;
      return;
    }

    if (!userHasZoomed) {
      markIfZooming();
      map.setView(center, zoom, { animate: true, duration: 1.5 });
    }
  }, [map, center, zoom, userHasZoomed]);

  return null;
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
  /** Slug from a `#map-show-<slug>` deep link: that show gets the view and an open popup. */
  focusShowSlug?: string | null;
  /**
   * Where the park lives, for the ride figures in the popups. The blog's map widget has no geo
   * path, so its popups carry no figures.
   */
  continent?: string;
  country?: string;
  city?: string;
  parkSlug?: string;
}

/**
 * Leaflet map of a park (CARTO tiles) with markers for in-season rides, shows and restaurants, the
 * visitor's position and, when located, a panel of what is nearby. Used by the map tab and the
 * blog's map widget.
 */
export function ParkMap({ park, focusShowSlug, continent, country, city, parkSlug }: ParkMapProps) {
  const t = useTranslations('parks.mapMarkers');
  // Mounted only while the map tab is the one on screen, so this is the fetch that "opens with the
  // tab": a visitor who never opens it never pays for it.
  const { data: figures } = useRideFigures({ continent, country, city, parkSlug });
  const tCommon = useTranslations('common');
  const [userHasZoomed, setUserHasZoomed] = useState(false);
  // Stable, so `ZoomTracker` does not re-bind its two map listeners on every render.
  const markUserZoom = useCallback(() => setUserHasZoomed(true), []);
  // Shared once-per-minute clock (paused in hidden tabs) for the relative time labels in the
  // popups.
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

  /** The show a deep link named, if it is one this map actually draws. */
  const focusedShow = useMemo(
    () => (focusShowSlug ? (validShows.find((s) => s.slug === focusShowSlug) ?? null) : null),
    [focusShowSlug, validShows]
  );

  const { userLocation, nearbyEntities, distanceToPark, isInPark } = useParkMapGeolocation(
    park,
    validAttractions,
    validShows,
    validRestaurants
  );

  // Fallback centre: the visitor's position in the park, else the park. Memoised on the primitive
  // coordinates, so the minute tick does not hand MapViewController a new array that re-pans the
  // map.
  const center: L.LatLngExpression = useMemo(
    () =>
      // A named show wins over the visitor's own position: they asked for THIS show, and being
      // shown where they are standing instead is an answer to a question nobody asked.
      focusedShow
        ? [focusedShow.latitude!, focusedShow.longitude!]
        : isInPark && userLocation
          ? [userLocation.lat, userLocation.lng]
          : park.latitude != null && park.longitude != null
            ? [park.latitude, park.longitude]
            : [51.505, -0.09], // London as fallback
    // Depend on the primitive coords, not the `userLocation` object: a new object with the same
    // lat/lng must not recompute `center`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      focusedShow?.latitude,
      focusedShow?.longitude,
      isInPark,
      userLocation?.lat,
      userLocation?.lng,
      park.latitude,
      park.longitude,
    ]
  );

  // `!= null`, not truthiness: coordinates are real numbers since the fetch boundary
  // parses them, and 0 is a legal one (Greenwich runs through England).
  if (park.latitude == null || park.longitude == null) {
    return (
      <div className="bg-muted text-muted-foreground flex h-[500px] items-center justify-center rounded-lg">
        <p>{t('noMapData')}</p>
      </div>
    );
  }

  return (
    // `md:` and not `@min-[768px]/page:`: this switches a share of the WINDOW's height for a fixed
    // one, i.e. it asks how much screen there is. The map fills whatever width it is given.
    <div className="relative h-[65vh] w-full overflow-hidden rounded-lg border md:h-[800px]">
      <MapContainer
        center={center}
        zoom={17}
        maxZoom={23}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={cartoTileUrl('rastertiles/voyager')}
          maxNativeZoom={19}
          maxZoom={23}
        />

        <ZoomTracker onUserZoom={markUserZoom} />
        <MapViewController
          center={center}
          zoom={focusedShow || isInPark ? 19 : 17}
          userHasZoomed={userHasZoomed}
        />

        {/* Rendered first to be topmost in Leaflet. */}
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

        {park.latitude != null && park.longitude != null && (
          <Marker position={[park.latitude, park.longitude]} icon={parkIcon}>
            <Popup>
              <div className="font-semibold">{stripNewPrefix(park.name)}</div>
              <div className="text-muted-foreground text-xs">{t('parkCenter')}</div>
            </Popup>
          </Marker>
        )}

        <AttractionMarkers attractions={validAttractions} figures={figures} />
        <ShowMarkers shows={validShows} timezone={park.timezone} focusSlug={focusShowSlug} />
        <RestaurantMarkers restaurants={validRestaurants} />
      </MapContainer>

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
                      ? getStandbyWait(entity.data as ParkAttraction)
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
