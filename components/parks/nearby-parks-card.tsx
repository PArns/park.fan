'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, Navigation, Clock, TrendingUp, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { BackgroundOverlay } from '@/components/common/background-overlay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { getNearbyParks } from '@/lib/api/discovery';
import { formatDistance } from '@/lib/utils/distance-utils';
import type { NearbyResponse, NearbyRidesData, NearbyParksData } from '@/types/nearby';
import type { CrowdLevel } from '@/lib/api/types';

type PermissionState = 'prompt' | 'granted' | 'denied' | 'loading' | 'error';

export function NearbyParksCard() {
  const t = useTranslations('nearby');
  const tCommon = useTranslations('common');
  const tGeo = useTranslations('geo');

  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
  const [nearbyData, setNearbyData] = useState<NearbyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const requestLocation = () => {
    setPermissionState('loading');
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setPermissionState('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          console.log('[NearbyParks] Fetching data for:', { latitude, longitude });

          const data = await getNearbyParks(latitude, longitude);
          console.log('[NearbyParks] Data received:', data);

          setNearbyData(data);
          setPermissionState('granted');
        } catch (err) {
          console.error('[NearbyParks] Failed to fetch nearby parks:', err);
          setError(err instanceof Error ? err.message : 'Failed to load nearby parks');
          setPermissionState('error');
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setPermissionState('denied');
        setError(err.message || 'Location access denied');
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
      // Use setTimeout to avoid synchronous state update in effect
      const timer = setTimeout(() => {
        requestLocation();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  const getScheduleMessage = (
    todaySchedule: { openingTime: string; closingTime: string; scheduleType: string } | undefined,
    timezone: string,
    status: string,
    isInMaintenance: boolean
  ): { message: string; icon: 'opening' | 'closing' } | null => {
    // Don't show schedule for parks in maintenance
    if (isInMaintenance || !todaySchedule) {
      return null;
    }

    try {
      const now = new Date();
      const opening = new Date(todaySchedule.openingTime);
      const closing = new Date(todaySchedule.closingTime);

      if (status === 'OPERATING') {
        // Park is open - show closing time
        const diff = closing.getTime() - now.getTime();
        if (diff <= 0) return null;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
          return { message: `${t('closesIn')} ${hours} Std. ${minutes} Min.`, icon: 'closing' };
        }
        return { message: `${t('closesIn')} ${minutes} Min.`, icon: 'closing' };
      } else if (status === 'CLOSED') {
        // Park is closed - show opening time
        const diff = opening.getTime() - now.getTime();
        if (diff <= 0) return null;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
          return { message: `${t('opensIn')} ${hours} Std. ${minutes} Min.`, icon: 'opening' };
        }
        return { message: `${t('opensIn')} ${minutes} Min.`, icon: 'opening' };
      }

      return null;
    } catch (error) {
      console.error('[NearbyParks] Error calculating schedule:', error);
      return null;
    }
  };

  // Prompt state - show enable button
  if (permissionState === 'prompt') {
    return (
      <section className="bg-card text-card-foreground rounded-xl border border-dashed py-6 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="text-muted-foreground h-5 w-5" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4 text-center">
          <p className="text-muted-foreground text-sm">{t('enableDescription')}</p>
          <Button onClick={requestLocation}>
            <Navigation className="mr-2 h-4 w-4" />
            {t('enable')}
          </Button>
        </CardContent>
      </section>
    );
  }

  // Loading state
  if (permissionState === 'loading') {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
            {t('loadingLocation')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-muted h-20 animate-pulse rounded" />
            <div className="bg-muted h-20 animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error or denied state
  if (permissionState === 'denied' || permissionState === 'error') {
    return (
      <Card className="border-destructive/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-destructive flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t('permissionDenied')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {error || t('permissionDeniedDescription')}
          </p>
        </CardContent>
      </Card>
    );
  }

  // No data yet
  if (!nearbyData) {
    return null;
  }

  // User is IN a park - show park info and nearby rides
  if (nearbyData.type === 'in_park') {
    const data = nearbyData.data as NearbyRidesData;
    const park = data.park;
    const rides = data.rides.slice(0, 5); // Show max 5 rides

    // Extract park URL from first ride if available
    const parkMapUrl =
      rides.length > 0
        ? `${rides[0].url.split('/attractions/')[0].replace('/v1/parks/', '/parks/')}#map`
        : null;

    return (
      <section className="bg-park-primary/5 border-park-primary/30 relative overflow-hidden rounded-xl border py-6 shadow-sm">
        {/* Background Image */}
        {park.backgroundImage && (
          <BackgroundOverlay imageSrc={park.backgroundImage} alt={park.name} intensity="medium" />
        )}

        <div className="relative z-10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="text-park-primary h-5 w-5" />
              {t('youAreIn')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Park Info */}
            {parkMapUrl ? (
              <Link href={parkMapUrl} className="group block transition-opacity hover:opacity-80">
                <article className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{park.name}</h3>
                      <ChevronRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {formatDistance(park.distance)} {t('awayFrom')} · {park.status}
                    </p>
                  </div>
                  {park.analytics?.crowdLevel && (
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
                    <h3 className="text-lg font-semibold">{park.name}</h3>
                    <p className="text-muted-foreground text-sm">
                      {formatDistance(park.distance)} {t('awayFrom')} · {park.status}
                    </p>
                  </div>
                  {park.analytics?.crowdLevel && (
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

            {/* Nearest Rides */}
            {rides.length > 0 && (
              <div>
                <h4 className="text-muted-foreground mb-2 text-sm font-medium">
                  {t('nearestAttractions')}
                </h4>
                <ul className="space-y-2">
                  {rides.map((ride) => (
                    <li key={ride.id}>
                      <Link
                        href={ride.url.replace('/v1/parks/', '/parks/')}
                        className="group block"
                      >
                        <div className="bg-background/60 hover:bg-background/80 hover:border-primary/50 flex items-center justify-between rounded-lg border p-3 backdrop-blur-md transition-all hover:shadow-sm">
                          <div className="min-w-0 flex-1">
                            <p className="group-hover:text-primary truncate font-medium transition-colors">
                              {ride.name}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {formatDistance(ride.distance)} {t('awayFrom')}
                            </p>
                          </div>
                          <div className="ml-3 flex items-center gap-2">
                            {ride.status === 'OPERATING' && typeof ride.waitTime === 'number' && (
                              <Badge
                                variant="secondary"
                                className="bg-status-operating/20 text-status-operating gap-1"
                              >
                                <span>⏱️</span>
                                {ride.waitTime} min
                              </Badge>
                            )}
                            <ChevronRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
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
    const parks = data.parks;

    if (parks.length === 0) {
      return (
        <Card>
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
      <section className="bg-card text-card-foreground rounded-xl border py-4 shadow-sm md:py-6">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="text-park-primary h-5 w-5" />
            {t('nearbyParks')} ({parks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
            {parks.map((park, index) => {
              const isOpen = park.status === 'OPERATING';
              // Hide items > 1 (index 2+) on mobile if not expanded
              const hiddenClass = !isExpanded && index >= 2 ? 'hidden md:block' : '';

              return (
                <li key={park.id} className={hiddenClass}>
                  <Link href={park.url.replace('/v1/parks/', '/parks/')} className="group h-full">
                    <article className="hover:border-primary/50 bg-card relative h-full overflow-hidden rounded-xl border py-4 transition-all hover:shadow-md md:py-6">
                      {/* Background Image */}
                      {park.backgroundImage && (
                        <BackgroundOverlay
                          imageSrc={park.backgroundImage}
                          alt={park.name}
                          intensity="medium"
                          hoverEffect
                        />
                      )}

                      <div className="relative z-10 flex h-full flex-col p-3 md:p-4">
                        <div className="bg-background/20 flex flex-1 flex-col justify-between rounded-xl p-3 shadow-sm backdrop-blur-md md:p-4">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="group-hover:text-primary line-clamp-2 text-base font-semibold transition-colors">
                                {park.name}
                              </h3>
                              <ChevronRight className="text-muted-foreground group-hover:text-primary mt-0.5 h-4 w-4 flex-shrink-0 transition-colors" />
                            </div>
                            <p className="text-muted-foreground mt-1 truncate text-xs">
                              {park.city},{' '}
                              {tGeo(`countries.${park.country.toLowerCase()}` as string) ||
                                park.country}
                            </p>
                          </div>

                          <div className="mt-3 flex flex-1 flex-col justify-end space-y-2 md:space-y-3">
                            {/* Distance + Status */}
                            <div className="flex items-center justify-between text-sm">
                              <div className="text-muted-foreground flex items-center gap-1.5">
                                <Navigation className="h-4 w-4" />
                                <span className="font-medium">{formatDistance(park.distance)}</span>
                              </div>
                              <Badge
                                className={`border-0 text-xs font-medium ${isOpen
                                    ? 'bg-green-600 text-white dark:bg-green-400 dark:text-slate-900'
                                    : 'bg-red-600 text-white dark:bg-red-400 dark:text-slate-900'
                                  }`}
                              >
                                {isOpen ? tCommon('open') : tCommon('closed')}
                              </Badge>
                            </div>

                            <div className="min-h-[4.5rem] space-y-2 md:space-y-3">
                              {/* Wait Time + Crowd Level (only for open parks) */}
                              {isOpen && park.analytics ? (
                                <div className="flex items-center gap-2.5 text-sm">
                                  {park.analytics.avgWaitTime !== undefined &&
                                    park.analytics.avgWaitTime > 0 && (
                                      <div className="text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span className="text-xs font-medium">
                                          {park.analytics.avgWaitTime}{' '}
                                          {tCommon('minute', { count: park.analytics.avgWaitTime })}
                                        </span>
                                      </div>
                                    )}
                                  {park.analytics.crowdLevel && (
                                    <CrowdLevelBadge
                                      level={park.analytics.crowdLevel as CrowdLevel}
                                      className="text-xs"
                                    />
                                  )}
                                </div>
                              ) : (
                                <div className="h-5" /> /* Spacer for closed parks */
                              )}

                              {/* Attractions (only for open parks) */}
                              {isOpen ? (
                                <div className="flex items-center justify-between pt-0.5 text-sm">
                                  <div className="text-muted-foreground flex items-center gap-1.5">
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="font-medium">
                                      {park.operatingAttractions}/{park.totalAttractions}
                                    </span>
                                  </div>
                                  <span className="text-muted-foreground text-xs">
                                    {tCommon('operating')}
                                  </span>
                                </div>
                              ) : (
                                <div className="h-5" /> /* Spacer for closed parks */
                              )}
                            </div>

                            {/* Park Schedule */}
                            {(() => {
                              const isInMaintenance =
                                park.status !== 'OPERATING' && park.status !== 'CLOSED';
                              const scheduleInfo = getScheduleMessage(
                                park.todaySchedule,
                                park.timezone,
                                park.status,
                                isInMaintenance
                              );

                              if (scheduleInfo) {
                                return (
                                  <div className="text-muted-foreground border-border/50 mt-2 flex items-center gap-1.5 border-t pt-1 pt-2 text-xs">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{scheduleInfo.message}</span>
                                  </div>
                                );
                              }
                              return (
                                <div className="mt-2 h-[25px] border-t border-transparent pt-1 pt-2" />
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
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
