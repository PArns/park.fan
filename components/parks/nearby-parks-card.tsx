'use client';

import { useEffect, useSyncExternalStore, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, Navigation, Clock, TrendingUp, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ParkCardNearby } from '@/components/parks/park-card-nearby';
import { ParkCardNearbySkeleton } from '@/components/parks/park-card-nearby-skeleton';
import { BackgroundOverlay } from '@/components/common/background-overlay';
import { FavoriteStar } from '@/components/common/favorite-star';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import { useNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { formatDistance } from '@/lib/utils/distance-utils';
import { stripNewPrefix } from '@/lib/utils';
import { convertApiUrlToFrontendUrl, getParkUrlFromAttractionUrl } from '@/lib/utils/url-utils';
import type { NearbyAttractionsData, NearbyParksData } from '@/types/nearby';
import type { CrowdLevel } from '@/lib/api/types';
import {
  trackNearbyPermissionGranted,
  trackNearbyPermissionDenied,
  trackNearbyParksLoaded,
  trackNearbyInParkDetected,
} from '@/lib/analytics/umami';

export function NearbyParksCard() {
  const t = useTranslations('nearby');
  const tCommon = useTranslations('common');

  const [isExpanded, setIsExpanded] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const {
    position,
    loading: geoLoading,
    error: geoError,
    permissionDenied,
    refresh,
    setIsInPark,
  } = useGeolocation();

  const {
    data: nearbyData,
    isLoading: dataLoading,
    error: dataError,
  } = useNearbyParks({
    radiusInMeters: 200,
    limit: 6,
  });

  const hasTrackedGranted = useRef(false);
  const hasTrackedDenied = useRef(false);
  const lastTrackedDataKey = useRef<string | null>(null);

  const locationSource = position ? 'gps' : 'ip';

  // Track analytics when nearby data changes (once per result, include source: gps | ip)
  useEffect(() => {
    if (!nearbyData) return;

    const dataKey =
      nearbyData.type === 'nearby_parks'
        ? `parks-${(nearbyData.data as NearbyParksData).parks.length}-${locationSource}`
        : `in_park-${(nearbyData.data as NearbyAttractionsData).park?.id}-${locationSource}`;
    if (lastTrackedDataKey.current === dataKey) return;
    lastTrackedDataKey.current = dataKey;

    const geoAllowed = !!position;

    if (nearbyData.type === 'nearby_parks') {
      trackNearbyParksLoaded({
        count: (nearbyData.data as NearbyParksData).parks.length,
        type: 'nearby_parks',
        in_park: false,
        geo_allowed: geoAllowed,
        source: locationSource,
      });
      setIsInPark(false);
    } else if (nearbyData.type === 'in_park') {
      const parkData = nearbyData.data as NearbyAttractionsData;
      trackNearbyParksLoaded({
        count: 1,
        type: 'in_park',
        in_park: true,
        geo_allowed: geoAllowed,
        source: locationSource,
        parkId: parkData.park.id,
        parkName: stripNewPrefix(parkData.park.name),
      });
      trackNearbyInParkDetected({
        parkId: parkData.park.id,
        parkName: stripNewPrefix(parkData.park.name),
        geo_allowed: geoAllowed,
      });
      setIsInPark(true);
    }
  }, [nearbyData, setIsInPark, locationSource, position]);

  // Track permission granted once when user grants location
  useEffect(() => {
    if (position && !permissionDenied && !hasTrackedGranted.current) {
      hasTrackedGranted.current = true;
      trackNearbyPermissionGranted();
    }
    if (!position) hasTrackedGranted.current = false;
  }, [position, permissionDenied]);

  // Track permission denied once when user denies location
  useEffect(() => {
    if (permissionDenied && !hasTrackedDenied.current) {
      hasTrackedDenied.current = true;
      trackNearbyPermissionDenied();
    }
    if (!permissionDenied) hasTrackedDenied.current = false;
  }, [permissionDenied]);

  const isLoading = geoLoading || dataLoading;

  // Same structure on server and initial client to avoid hydration mismatch
  if (!mounted || isLoading) {
    return (
      <section className="bg-card text-card-foreground min-h-[200px] rounded-xl border py-4 shadow-sm md:py-6">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
            {t('loadingLocation')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
            <li>
              <ParkCardNearbySkeleton />
            </li>
            <li>
              <ParkCardNearbySkeleton />
            </li>
            <li>
              <ParkCardNearbySkeleton />
            </li>
          </ul>
        </CardContent>
      </section>
    );
  }

  // Prompt state - show enable button only when we have no data and are not loading (homepage uses LocationBanner instead)
  if (!position && !geoError && !permissionDenied && !geoLoading && !dataLoading && !nearbyData) {
    return (
      <section className="bg-card text-card-foreground min-h-[200px] rounded-xl border border-dashed py-6 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="text-muted-foreground h-5 w-5" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4 text-center">
          <p className="text-muted-foreground text-sm">{t('enableDescription')}</p>
          <Button onClick={refresh}>
            <Navigation className="mr-2 h-4 w-4" />
            {t('enable')}
          </Button>
        </CardContent>
      </section>
    );
  }

  // Error state: from API/backend only (browser "permission denied" is not an error here – we use IP fallback)
  const showErrorCard = dataError && !dataLoading;
  const isLocationUnavailable =
    showErrorCard &&
    typeof (dataError as Error)?.message === 'string' &&
    ((dataError as Error).message.toLowerCase().includes('location') ||
      (dataError as Error).message.toLowerCase().includes('geoip') ||
      (dataError as Error).message.includes('400'));

  if (showErrorCard) {
    return (
      <section className="bg-muted/30 min-h-[200px] rounded-xl border border-dashed py-6 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="text-park-primary h-5 w-5" />
            {isLocationUnavailable ? t('locationUnavailable') : t('loadError')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4 text-center">
          <p className="text-muted-foreground mx-auto max-w-md text-sm">
            {isLocationUnavailable
              ? t('locationUnavailableDescription')
              : t('loadErrorDescription')}
          </p>
          <Button onClick={refresh} variant="outline">
            <Navigation className="mr-2 h-4 w-4" />
            {tCommon('retry')}
          </Button>
        </CardContent>
      </section>
    );
  }

  // No data yet
  if (!nearbyData) {
    return null;
  }

  // User is IN a park - show park info and nearby attractions
  if (nearbyData.type === 'in_park') {
    const data = nearbyData.data as NearbyAttractionsData;

    if (!data || !data.park) {
      return null;
    }

    const park = data.park;
    const attractions = (data.rides || []).slice(0, 5);

    // Park page URL (for "Go to park page" CTA); fallback from first attraction
    const rawParkUrl = (park as { url?: string })?.url;
    const parkPageUrl = rawParkUrl
      ? convertApiUrlToFrontendUrl(rawParkUrl)
      : attractions.length > 0
        ? getParkUrlFromAttractionUrl(attractions[0].url)
        : null;
    const parkMapUrl = parkPageUrl && attractions.length > 0 ? `${parkPageUrl}#map` : parkPageUrl;

    return (
      <section className="bg-park-primary/5 border-park-primary/30 relative min-h-[200px] overflow-hidden rounded-xl border py-6 shadow-sm">
        {/* Background Image */}
        {park.backgroundImage && (
          <BackgroundOverlay
            imageSrc={park.backgroundImage}
            alt={stripNewPrefix(park.name)}
            intensity="medium"
          />
        )}

        <div className="relative z-10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="text-park-primary h-5 w-5" />
              {t('youAreInPark', { parkName: stripNewPrefix(park.name) })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!position && (
              <div className="bg-muted/50 border-border flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                <span className="text-muted-foreground">{t('locationHint')}</span>
                <Button onClick={refresh} size="sm" variant="outline">
                  <Navigation className="mr-1.5 h-3.5 w-3.5" />
                  {t('enable')}
                </Button>
              </div>
            )}
            {/* Quick navigation: primary CTA to park page when user is in park */}
            {parkPageUrl && (
              <div className="mb-4">
                <Link href={parkPageUrl} prefetch={park.status === 'OPERATING'}>
                  <Button className="w-full sm:w-auto" size="lg">
                    <ChevronRight className="mr-2 h-4 w-4" />
                    {t('goToParkPage')}
                  </Button>
                </Link>
              </div>
            )}
            {/* Park Info */}
            {parkMapUrl ? (
              <Link
                href={parkMapUrl}
                prefetch={false}
                className="group block transition-opacity hover:opacity-80"
              >
                <article className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{stripNewPrefix(park.name)}</h3>
                      <ChevronRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {t('youAreIn')} · {park.status}
                    </p>
                  </div>
                  {park.analytics?.crowdLevel && park.status === 'OPERATING' && (
                    <CrowdLevelBadge level={park.analytics.crowdLevel as CrowdLevel} />
                  )}
                </article>

                {/* Park Analytics - Inside Link */}
                {park.analytics && (
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    {park.analytics.avgWaitTime !== undefined && (
                      <div className="flex items-center gap-1">
                        <Clock className="text-muted-foreground h-4 w-4" />
                        <span>
                          {park.analytics.avgWaitTime} {tCommon('minutes')} Ø
                        </span>
                      </div>
                    )}
                    {park.analytics.operatingAttractions !== undefined && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="text-muted-foreground h-4 w-4" />
                        <span>
                          {park.analytics.operatingAttractions} {tCommon('operating')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </Link>
            ) : (
              <>
                <article className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{stripNewPrefix(park.name)}</h3>
                    <p className="text-muted-foreground text-sm">
                      {t('youAreIn')} · {park.status}
                    </p>
                  </div>
                  {park.analytics?.crowdLevel && park.status === 'OPERATING' && (
                    <CrowdLevelBadge level={park.analytics.crowdLevel as CrowdLevel} />
                  )}
                </article>

                {/* Park Analytics */}
                {park.analytics && (
                  <div className="flex items-center gap-4 text-sm">
                    {park.analytics.avgWaitTime !== undefined && (
                      <div className="flex items-center gap-1">
                        <Clock className="text-muted-foreground h-4 w-4" />
                        <span>
                          {park.analytics.avgWaitTime} {tCommon('minutes')} Ø
                        </span>
                      </div>
                    )}
                    {park.analytics.operatingAttractions !== undefined && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="text-muted-foreground h-4 w-4" />
                        <span>
                          {park.analytics.operatingAttractions} {tCommon('operating')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Nearest Attractions */}
            {attractions.length > 0 && (
              <div>
                <h4 className="text-muted-foreground mb-2 text-sm font-medium">
                  {t('nearestAttractions')}
                </h4>
                <ul className="space-y-2">
                  {attractions.map((attraction) => (
                    <li key={attraction.id}>
                      <Link
                        href={convertApiUrlToFrontendUrl(attraction.url)}
                        prefetch={attraction.status === 'OPERATING'}
                        className="group block"
                      >
                        <div className="bg-background/60 hover:bg-background/80 hover:border-primary/50 relative flex items-center justify-between rounded-lg border p-3 backdrop-blur-md transition-all hover:shadow-sm">
                          {/* Favorite Star */}
                          {attraction.id && (
                            <div className="absolute top-2 right-2 z-20 flex items-center justify-center">
                              <FavoriteStar type="attraction" id={attraction.id} />
                            </div>
                          )}
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="group-hover:text-primary truncate font-medium transition-colors">
                              {stripNewPrefix(attraction.name)}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {formatDistance(attraction.distance)} {t('awayFrom')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {attraction.status === 'OPERATING' &&
                              typeof attraction.waitTime === 'number' && (
                                <Badge
                                  variant="secondary"
                                  className="bg-status-operating/20 text-status-operating gap-1"
                                >
                                  <span>⏱️</span>
                                  {attraction.waitTime} min
                                </Badge>
                              )}
                            {attraction.status === 'OPERATING' &&
                              attraction.crowdLevel &&
                              attraction.crowdLevel !== null && (
                                <CrowdLevelBadge level={attraction.crowdLevel} showLabel={false} />
                              )}
                            <ChevronRight className="text-muted-foreground group-hover:text-primary h-4 w-4 flex-shrink-0 transition-colors" />
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </div>
      </section>
    );
  }

  if (nearbyData.type === 'nearby_parks') {
    const data = nearbyData.data as NearbyParksData;
    const rawParks = data.parks;

    // Sort: open (OPERATING) first, then by distance – so "nearest open" is first open
    const parks = [...rawParks].sort((a, b) => {
      const aOpen = a.status === 'OPERATING' ? 1 : 0;
      const bOpen = b.status === 'OPERATING' ? 1 : 0;
      if (bOpen !== aOpen) return bOpen - aOpen;
      return a.distance - b.distance;
    });
    const nearestOpenPark = parks.find((p) => p.status === 'OPERATING') ?? null;
    const hasNoOpenNearby = parks.length > 0 && nearestOpenPark === null;

    if (parks.length === 0) {
      return (
        <Card className="min-h-[200px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="text-muted-foreground h-5 w-5" />
              {t('title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">{t('noParksNearby')}</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <section className="bg-card text-card-foreground min-h-[200px] rounded-xl border py-4 shadow-sm md:py-6">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="text-park-primary h-5 w-5" />
            {nearestOpenPark
              ? t('nearestOpenTitle')
              : hasNoOpenNearby
                ? t('nearbyParksClosedTitle')
                : t('nearbyParks')}{' '}
            <span className="text-muted-foreground font-normal">({parks.length})</span>
          </CardTitle>
          {parks.length > 0 && (
            <p className="text-muted-foreground mt-1 text-sm">
              {t('nearParkSubtitle', { parkName: parks[0].name })}
            </p>
          )}
          {hasNoOpenNearby && (
            <p className="text-muted-foreground mt-1 text-sm">{t('noOpenNearbyFocus')}</p>
          )}
        </CardHeader>
        <CardContent>
          {!position && (
            <div className="bg-muted/50 border-border mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
              <span className="text-muted-foreground">{t('locationHint')}</span>
              <Button onClick={refresh} size="sm" variant="outline">
                <Navigation className="mr-1.5 h-3.5 w-3.5" />
                {t('enable')}
              </Button>
            </div>
          )}
          <ul className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
            {parks.map((park, index) => {
              // Hide items > 1 (index 2+) on mobile if not expanded
              const hiddenClass = !isExpanded && index >= 2 ? 'hidden md:block' : '';

              // Extract continent from URL if available for robust URL building
              const continent = park.url?.split('/')?.[3]; // /v1/parks/[continent]/...

              return (
                <li key={park.id} className={hiddenClass}>
                  <ParkCardNearby
                    id={park.id}
                    name={stripNewPrefix(park.name)}
                    slug={park.slug}
                    city={park.city}
                    country={park.country}
                    continent={continent}
                    distance={park.distance}
                    status={park.status}
                    timezone={park.timezone}
                    totalAttractions={park.totalAttractions}
                    operatingAttractions={park.operatingAttractions}
                    analytics={park.analytics}
                    todaySchedule={park.todaySchedule}
                    nextSchedule={park.nextSchedule}
                    backgroundImage={park.backgroundImage}
                    url={park.url}
                    highlightAsNearestOpen={nearestOpenPark?.id === park.id}
                  />
                </li>
              );
            })}
          </ul>

          {/* Show More Button (Mobile Only) */}
          {!isExpanded && parks.length > 2 && (
            <div className="mt-4 flex justify-center md:hidden">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="w-full"
              >
                {tCommon('showMore')}
              </Button>
            </div>
          )}
        </CardContent>
      </section>
    );
  }

  return null;
}
