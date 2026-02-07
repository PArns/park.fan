'use client';

import { useEffect, useState, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type {
  ParkWithAttractions,
  ParkAttraction,
  ParkShow,
  ParkRestaurant,
} from '@/lib/api/types';
import { calculateDistance, formatDistance } from '@/lib/utils/distance-utils';
import { stripNewPrefix } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons for different entity types
const createIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 25px; height: 25px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><div style="transform: rotate(45deg); width: 100%; height: 100%;"></div></div>`,
    iconSize: [25, 25],
    iconAnchor: [12, 25],
    popupAnchor: [0, -25],
  });
};

const parkIcon = createIcon('#3b82f6'); // blue
const attractionOperatingIcon = createIcon('#10b981'); // green
const attractionClosedIcon = createIcon('#ef4444'); // red
const showIcon = createIcon('#a855f7'); // purple
const restaurantIcon = createIcon('#f97316'); // orange

// Custom eye-catching user location icon with pulsing animation
const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div style="position: relative; width: 40px; height: 40px; z-index: 1000;">
    <style>
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.4; }
        50% { transform: scale(1.3); opacity: 0.1; }
      }
    </style>
    <div style="position: absolute; width: 40px; height: 40px; background: radial-gradient(circle, #3b82f6 0%, #2563eb 100%); border-radius: 50%; animation: pulse 2s ease-in-out infinite;"></div>
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 16px; height: 16px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border: 3px solid white; border-radius: 50%; box-shadow: 0 3px 8px rgba(0,0,0,0.4);"></div>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

const IN_PARK_THRESHOLD = 1000; // 1km in meters

interface EntityWithDistance {
  id: string;
  name: string;
  type: 'attraction' | 'show' | 'restaurant';
  distance: number;
  latitude: number;
  longitude: number;
  data: ParkAttraction | ParkShow | ParkRestaurant;
}

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

// Helper function to get next show time
function getNextShowTime(show: ParkShow): string | null {
  if (!show.showtimes || show.showtimes.length === 0) return null;

  const now = new Date();
  const futureShowtimes = show.showtimes
    .map((st) => new Date(st.startTime))
    .filter((time: Date) => time > now)
    .sort((a: Date, b: Date) => a.getTime() - b.getTime());

  if (futureShowtimes.length === 0) return null;

  const nextShow = futureShowtimes[0];
  const diffMs = nextShow.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);

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
  const tParks = useTranslations('parks');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userHasZoomed, setUserHasZoomed] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [timeRefreshKey, setTimeRefreshKey] = useState(0); // Force re-render for time updates

  const requestLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache position for 5 minutes
      }
    );
  };

  // Automatically request location on mount (GDPR compliant - no cookie storage)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      requestLocation();
    }
  }, []);

  // Refresh times every 1 minute for dynamic updates
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeRefreshKey((prev) => prev + 1);
    }, 60000); // 1 minute

    return () => clearInterval(intervalId);
  }, []);

  // Add attractions
  const validAttractions =
    park.attractions?.filter((a) => a.latitude != null && a.longitude != null) || [];

  // Add shows
  const validShows = park.shows?.filter((s) => s.latitude != null && s.longitude != null) || [];

  // Add restaurants
  const validRestaurants =
    park.restaurants?.filter((r) => r.latitude != null && r.longitude != null) || [];

  // Calculate nearby entities if user location is available
  let nearbyEntities: EntityWithDistance[] = [];
  let distanceToPark: number | null = null;
  let isInPark = false;

  if (userLocation && park.latitude && park.longitude) {
    // Calculate distance to park center
    distanceToPark = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      park.latitude,
      park.longitude
    );
    isInPark = distanceToPark < IN_PARK_THRESHOLD;

    if (isInPark) {
      // User is in park - collect all entities with distances
      const entities: EntityWithDistance[] = [];

      validAttractions.forEach((attraction) => {
        if (attraction.latitude && attraction.longitude) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            attraction.latitude,
            attraction.longitude
          );
          entities.push({
            id: attraction.id,
            name: stripNewPrefix(attraction.name),
            type: 'attraction',
            distance,
            latitude: attraction.latitude,
            longitude: attraction.longitude,
            data: attraction,
          });
        }
      });

      validShows.forEach((show) => {
        if (show.latitude && show.longitude) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            show.latitude,
            show.longitude
          );
          entities.push({
            id: show.id,
            name: stripNewPrefix(show.name),
            type: 'show',
            distance,
            latitude: show.latitude,
            longitude: show.longitude,
            data: show,
          });
        }
      });

      validRestaurants.forEach((restaurant) => {
        if (restaurant.latitude && restaurant.longitude) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            restaurant.latitude,
            restaurant.longitude
          );
          entities.push({
            id: restaurant.id,
            name: stripNewPrefix(restaurant.name),
            type: 'restaurant',
            distance,
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
            data: restaurant,
          });
        }
      });

      // Sort by distance and take top 5
      nearbyEntities = entities.sort((a, b) => a.distance - b.distance).slice(0, 5);
    }
  }

  // Auto-update location with dynamic interval: 5s in park, 60s outside
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }

    // 5 seconds if in park, 60 seconds if outside
    const updateInterval = isInPark ? 5000 : 60000;

    const intervalId = setInterval(() => {
      requestLocation();
    }, updateInterval);

    return () => clearInterval(intervalId);
  }, [isInPark]);

  // Fallback center (use user location if in park, otherwise park center)
  const center: L.LatLngExpression =
    isInPark && userLocation
      ? [userLocation.lat, userLocation.lng]
      : park.latitude && park.longitude
        ? [park.latitude, park.longitude]
        : [51.505, -0.09]; // London as fallback

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

        {/* Attraction markers */}
        {validAttractions.map((attraction) => {
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
                      <span
                        className={isOperating ? 'text-status-operating' : 'text-status-closed'}
                      >
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

        {/* Show markers */}
        {validShows.map((show) => (
          <Marker key={show.id} position={[show.latitude!, show.longitude!]} icon={showIcon}>
            <Popup>
              <div>
                <div className="font-semibold">{stripNewPrefix(show.name)}</div>
                <div className="text-muted-foreground text-xs">{t('show')}</div>
                {show.showtimes && show.showtimes.length > 0 && (
                  <div className="mt-1 text-xs">
                    {t('nextShowtime')}:{' '}
                    {new Date(show.showtimes[0].startTime).toLocaleTimeString(locale, {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: park.timezone,
                    })}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Restaurant markers */}
        {validRestaurants.map((restaurant) => (
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
