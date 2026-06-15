'use client';

import { useEffect, useSyncExternalStore, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, Navigation, Clock, TrendingUp, ChevronRight, Star } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ParkCard } from '@/components/parks/park-card';
import { NearbyParksCardSkeleton } from '@/components/parks/nearby-parks-card-skeleton';
import { BackgroundOverlayImage } from '@/components/common/background-overlay-image';
import { FavoriteStar } from '@/components/common/favorite-star';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { formatDistance } from '@/lib/utils/distance-utils';
import { waitTimeBadgeClass } from '@/lib/blog/live-display';
import { cn, stripNewPrefix } from '@/lib/utils';
import { convertApiUrlToFrontendUrl, getParkUrlFromAttractionUrl } from '@/lib/utils/url-utils';
import type {
  AttractionWithDistance,
  NearbyAttractionsData,
  NearbyParksData,
} from '@/types/nearby';
import type { CrowdLevel, ParkStatus } from '@/lib/api/types';
import {
  trackNearbyPermissionGranted,
  trackNearbyPermissionDenied,
  trackNearbyParksLoaded,
  trackNearbyInParkDetected,
} from '@/lib/analytics/umami';

// Top spacing that separates the card from the hero above. The in-park full-bleed banner
// is intentionally exempt: it must sit flush under the hero (see app/[locale]/page.tsx), so
// only the parks-list / prompt / error / empty states (and the matching skeleton) get this gap.
const TOP_SPACING = 'mt-8';

/**
 * A single in-park attraction row (name, distance, live wait/crowd badges). Shared by the
 * headliner list and the "nearest attractions" list so both render identically. Pass
 * `headlinerLabel` to render a "Top" badge next to the name for marquee attractions.
 */
function InParkAttractionRow({
  attraction,
  awayLabel,
  headlinerLabel,
}: {
  attraction: AttractionWithDistance;
  awayLabel: string;
  headlinerLabel?: string;
}) {
  return (
    <li>
      <Link
        href={convertApiUrlToFrontendUrl(attraction.url)}
        prefetch={false}
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
            <div className="flex items-center gap-2">
              <p className="group-hover:text-primary truncate font-medium transition-colors">
                {stripNewPrefix(attraction.name)}
              </p>
              {headlinerLabel && (
                <Badge className="shrink-0 gap-1 border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400">
                  <Star className="h-3 w-3 fill-current" />
                  {headlinerLabel}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              {formatDistance(attraction.distance)} {awayLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {attraction.status === 'OPERATING' && typeof attraction.waitTime === 'number' && (
              <Badge className={waitTimeBadgeClass(attraction.waitTime)}>
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
  );
}

export function NearbyParksCard({ className }: { className?: string }) {
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
    permissionDenied,
    permissionGranted,
    refresh,
    setIsInPark,
  } = useGeolocation();

  const { data: nearbyData, isLoading: dataLoading, error: dataError } = useHomeNearbyParks();

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
      if (!parkData?.park) return;
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

  // Show skeleton whenever there's nothing to display and something is still in progress.
  // Keep showing skeleton even on 400 errors while GPS is still loading — coords may arrive
  // and trigger a successful retry. nearbyData covers both real and placeholder (cached) data.
  const isLoading = !nearbyData && (geoLoading || dataLoading);

  // "Location required" 400 = no public IP and no coords (e.g. local dev). Treat as prompt, not error.
  const isLocationUnavailable =
    dataError != null &&
    !dataLoading &&
    typeof (dataError as Error)?.message === 'string' &&
    ((dataError as Error).message.toLowerCase().includes('location') ||
      (dataError as Error).message.toLowerCase().includes('geoip') ||
      (dataError as Error).message.includes('400'));

  // Same structure on server and initial client to avoid hydration mismatch. Mirrors the live
  // "nearby parks" layout exactly (shared skeleton) so the swap to real parks doesn't shift layout.
  if (!mounted || isLoading) {
    return <NearbyParksCardSkeleton className={className} />;
  }

  // Prompt state: only when user hasn't granted location yet (or is still undecided).
  // Don't show if GPS timed out / unavailable — permissionGranted stays true in that case.
  if (!permissionGranted && !permissionDenied && !geoLoading && !dataLoading && !nearbyData) {
    return (
      <div className={cn('min-h-[200px]', TOP_SPACING, className)}>
        <h2 className="mb-2 flex items-center gap-2 text-xl font-bold">
          <MapPin className="text-muted-foreground h-5 w-5" />
          {t('title')}
        </h2>
        <div className="flex flex-col items-center space-y-4 py-4 text-center">
          <p className="text-muted-foreground text-sm">{t('enableDescription')}</p>
          <Button onClick={refresh}>
            <Navigation className="mr-2 h-4 w-4" />
            {t('enable')}
          </Button>
        </div>
      </div>
    );
  }

  // Error state: unexpected API/backend errors only
  const showErrorCard = dataError && !dataLoading && !isLocationUnavailable;

  if (showErrorCard) {
    return (
      <div className={cn('min-h-[200px]', TOP_SPACING, className)}>
        <h2 className="mb-2 flex items-center gap-2 text-xl font-bold">
          <MapPin className="text-park-primary h-5 w-5" />
          {t('loadError')}
        </h2>
        <div className="flex flex-col items-center space-y-4 py-4 text-center">
          <p className="text-muted-foreground mx-auto max-w-md text-sm">
            {t('loadErrorDescription')}
          </p>
          <Button onClick={refresh} variant="outline">
            <Navigation className="mr-2 h-4 w-4" />
            {tCommon('retry')}
          </Button>
        </div>
      </div>
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
    // Drop rides that are clearly out of their season. The API already hides
    // `isCurrentlyInSeason === false`, but we filter defensively so off-season attractions never
    // leak into the list; seasonal rides with unknown months (null) and in-season ones stay.
    const inSeasonRides = (data.rides || []).filter((a) => a.isCurrentlyInSeason !== false);

    // Headliners (top/marquee attractions, flagged by the API). Always shown above the regular
    // list, sorted by distance. Keep closed ones too — a headliner is worth pointing out even when
    // it's momentarily not operating.
    const headliners = inSeasonRides
      .filter((a) => a.isHeadliner)
      .sort((a, b) => a.distance - b.distance);
    const headlinerIds = new Set(headliners.map((h) => h.id));

    // Hide attractions that aren't open (e.g. seasonal closures like Phantasialand's ice-skate
    // hire, which only runs during Wintertraum, or rides under refurbishment). DOWN is kept — it's
    // part of today's lineup, just momentarily out of service. Filter before slicing so closed
    // rides don't take up the 5 visible slots. Sort by distance (API order isn't guaranteed).
    // Headliners are excluded here so they aren't listed twice.
    const attractions = inSeasonRides
      .filter((a) => !headlinerIds.has(a.id))
      .filter((a) => a.status !== 'CLOSED' && a.status !== 'REFURBISHMENT')
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    // Park page URL (for "Go to park page" CTA); fallback from first known ride (headliner or
    // regular attraction) when the park itself doesn't carry a url.
    const fallbackRide = attractions[0] ?? headliners[0] ?? null;
    const rawParkUrl = (park as { url?: string })?.url;
    const parkPageUrl = rawParkUrl
      ? convertApiUrlToFrontendUrl(rawParkUrl)
      : fallbackRide
        ? getParkUrlFromAttractionUrl(fallbackRide.url)
        : null;
    const parkMapUrl = parkPageUrl && fallbackRide ? `${parkPageUrl}#map` : parkPageUrl;

    return (
      <section
        className={cn(
          // Full-bleed banner: the card lives inside a centered container, so break the whole
          // section out to the viewport width (body has `overflow-x: clip` → no h-scrollbar).
          // The content below is re-contained, so its left/right padding stays symmetric.
          'bg-park-primary/5 relative left-1/2 w-screen -translate-x-1/2 overflow-hidden py-6',
          className
        )}
      >
        {/* Background image: confined to the header band and faded to the section background
            so it never bleeds through the attractions list — keeping the list readable in
            light mode. */}
        {park.backgroundImage && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-56 overflow-hidden sm:h-64">
            <BackgroundOverlayImage
              imageSrc={park.backgroundImage}
              alt={stripNewPrefix(park.name)}
              sizes="100vw"
            />
            <div className="from-background/10 via-background/50 to-background absolute inset-0 bg-gradient-to-b" />
          </div>
        )}

        <div className="relative z-10 container mx-auto px-4">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
            <MapPin className="text-park-primary h-5 w-5" />
            {t('youAreInPark', { parkName: stripNewPrefix(park.name) })}
          </h2>
          <div className="space-y-4">
            {/* Quick navigation: primary CTA to park page when user is in park */}
            {parkPageUrl && (
              <div className="mb-4">
                <Button asChild size="lg" className="w-full justify-center sm:w-auto">
                  <Link href={parkPageUrl} prefetch={false}>
                    {t('goToParkPage')}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
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
                  {park.analytics?.crowdLevel &&
                    (park.status === 'OPERATING' || park.status === 'UNKNOWN') && (
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
                  {park.analytics?.crowdLevel &&
                    (park.status === 'OPERATING' || park.status === 'UNKNOWN') && (
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

            {/* Headliners — always shown above the nearest attractions */}
            {headliners.length > 0 && (
              <div>
                <h4 className="text-muted-foreground mb-2 flex items-center gap-1.5 text-sm font-medium">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  {t('headliners')}
                </h4>
                <ul className="space-y-2">
                  {headliners.map((attraction) => (
                    <InParkAttractionRow
                      key={attraction.id}
                      attraction={attraction}
                      awayLabel={t('awayFrom')}
                      headlinerLabel={t('headlinerBadge')}
                    />
                  ))}
                </ul>
              </div>
            )}

            {/* Nearest Attractions */}
            {attractions.length > 0 && (
              <div>
                <h4 className="text-muted-foreground mb-2 text-sm font-medium">
                  {t('nearestAttractions')}
                </h4>
                <ul className="space-y-2">
                  {attractions.map((attraction) => (
                    <InParkAttractionRow
                      key={attraction.id}
                      attraction={attraction}
                      awayLabel={t('awayFrom')}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (nearbyData.type === 'nearby_parks') {
    const data = nearbyData.data as NearbyParksData;
    const rawParks = data.parks;

    // Sort: open (OPERATING/UNKNOWN) first, then by distance – so "nearest open" is first open
    const parks = [...rawParks].sort((a, b) => {
      const aOpen = a.status === 'OPERATING' || a.status === 'UNKNOWN' ? 1 : 0;
      const bOpen = b.status === 'OPERATING' || b.status === 'UNKNOWN' ? 1 : 0;
      if (bOpen !== aOpen) return bOpen - aOpen;
      return a.distance - b.distance;
    });
    const nearestOpenPark =
      parks.find((p) => p.status === 'OPERATING' || p.status === 'UNKNOWN') ?? null;
    const hasNoOpenNearby = parks.length > 0 && nearestOpenPark === null;

    if (parks.length === 0) {
      return (
        <div className={cn('min-h-[200px]', TOP_SPACING, className)}>
          <h2 className="mb-2 flex items-center gap-2 text-xl font-bold">
            <MapPin className="text-muted-foreground h-5 w-5" />
            {t('title')}
          </h2>
          <p className="text-muted-foreground text-center text-sm">{t('noParksNearby')}</p>
        </div>
      );
    }

    return (
      <section className={cn(TOP_SPACING, className)}>
        <h2 className="mb-2 flex items-center gap-2 text-xl font-bold">
          <MapPin className="text-park-primary h-5 w-5" />
          {nearestOpenPark
            ? t('nearestOpenTitle')
            : hasNoOpenNearby
              ? t('nearbyParksClosedTitle')
              : t('nearbyParks')}{' '}
          <span className="text-muted-foreground font-normal">({parks.length})</span>
        </h2>
        {parks.length > 0 && (
          <p className="text-muted-foreground mb-8 text-sm">
            {t('nearParkSubtitle', { parkName: parks[0].name })}
          </p>
        )}
        {hasNoOpenNearby && (
          <p className="text-muted-foreground mb-4 text-sm">{t('noOpenNearbyFocus')}</p>
        )}
        <div>
          {/* The location prompt lives in the floating LocationBanner now — an inline,
              conditionally-rendered hint here would re-introduce an in-flow layout shift
              (and duplicate the banner's message). */}
          <ul className="grid [grid-auto-rows:auto_1fr_auto] gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {parks.map((park, index) => {
              const hidden = !isExpanded && index >= 2;

              return (
                <li
                  key={park.id}
                  className={cn(
                    'row-span-3 grid [grid-template-rows:subgrid]',
                    hidden && 'hidden md:grid'
                  )}
                >
                  <ParkCard
                    id={park.id}
                    name={stripNewPrefix(park.name)}
                    slug={park.slug}
                    city={park.city}
                    country={park.country}
                    distance={park.distance}
                    status={park.status as ParkStatus}
                    timezone={park.timezone}
                    totalAttractions={park.totalAttractions}
                    operatingAttractions={park.operatingAttractions}
                    analytics={park.analytics}
                    todaySchedule={park.todaySchedule}
                    nextSchedule={park.nextSchedule}
                    backgroundImage={park.backgroundImage}
                    url={park.url}
                    hasOperatingSchedule={park.hasOperatingSchedule}
                    highlightAsNearestOpen={nearestOpenPark?.id === park.id}
                    translateCountry
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
        </div>
      </section>
    );
  }

  return null;
}
