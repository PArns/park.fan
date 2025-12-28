'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getCookie, setCookie } from 'cookies-next';
import { MapPin, Navigation, Clock, TrendingUp, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { getNearbyParks } from '@/lib/api/discovery';
import type { NearbyResponse, NearbyRidesData, NearbyParksData } from '@/types/nearby';
import type { ParkCrowdLevel, CrowdLevel } from '@/lib/api/types';

const COOKIE_NAME = 'nearby-parks-enabled';

type PermissionState = 'prompt' | 'granted' | 'denied' | 'loading' | 'error';

export function NearbyParksCard() {
    const t = useTranslations('nearby');
    const tCommon = useTranslations('common');
    const tGeo = useTranslations('geo');

    const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
    const [nearbyData, setNearbyData] = useState<NearbyResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

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
                    setCookie(COOKIE_NAME, 'true', { maxAge: 31536000 }); // 1 year
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

    // Check cookie on mount
    useEffect(() => {
        const hasPermission = getCookie(COOKIE_NAME) === 'true';
        if (hasPermission && typeof navigator !== 'undefined' && navigator.geolocation) {
            // Use setTimeout to avoid synchronous state update in effect
            const timer = setTimeout(() => {
                requestLocation();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, []);

    const formatDistance = (meters: number): string => {
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        }
        return `${(meters / 1000).toFixed(1)}km`;
    };

    // Prompt state - show enable button
    if (permissionState === 'prompt') {
        return (
            <Card className="border-dashed">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        {t('title')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center space-y-4">
                    <p className="text-muted-foreground text-sm">{t('enableDescription')}</p>
                    <Button onClick={requestLocation}>
                        <Navigation className="mr-2 h-4 w-4" />
                        {t('enable')}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Loading state
    if (permissionState === 'loading') {
        return (
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        {t('loadingLocation')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="h-20 bg-muted animate-pulse rounded" />
                        <div className="h-20 bg-muted animate-pulse rounded" />
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
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <MapPin className="h-5 w-5" />
                        {t('permissionDenied')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">{error || t('permissionDeniedDescription')}</p>
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

        return (
            <Card className="border-park-primary/30 bg-park-primary/5">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-park-primary" />
                        {t('youAreIn')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Park Info */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">{park.name}</h3>
                            <p className="text-muted-foreground text-sm">
                                {formatDistance(park.distance)} {t('awayFrom')} · {park.status}
                            </p>
                        </div>
                        {park.analytics?.crowdLevel && (
                            <CrowdLevelBadge level={park.analytics.crowdLevel as ParkCrowdLevel} />
                        )}
                    </div>

                    {/* Park Analytics */}
                    {park.analytics && (
                        <div className="flex items-center gap-4 text-sm">
                            {park.analytics.avgWaitTime !== undefined && (
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{park.analytics.avgWaitTime} {tCommon('minutes')} Ø</span>
                                </div>
                            )}
                            {park.analytics.operatingAttractions !== undefined && (
                                <div className="flex items-center gap-1">
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    <span>{park.analytics.operatingAttractions} {tCommon('operating')}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Nearest Rides */}
                    {rides.length > 0 && (
                        <div>
                            <h4 className="mb-2 text-sm font-medium text-muted-foreground">{t('nearestAttractions')}</h4>
                            <div className="space-y-2">
                                {rides.map((ride) => (
                                    <Link
                                        key={ride.id}
                                        href={ride.url.replace('/v1/parks/', '/parks/')}
                                        className="group block"
                                    >
                                        <div className="flex items-center justify-between rounded-lg border bg-background p-3 transition-all hover:border-primary/50 hover:shadow-sm">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate group-hover:text-primary transition-colors">
                                                    {ride.name}
                                                </p>
                                                <p className="text-muted-foreground text-xs">
                                                    {formatDistance(ride.distance)} {t('awayFrom')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 ml-3">
                                                {ride.waitTime !== null && (
                                                    <Badge variant="secondary" className="bg-status-operating/20 text-status-operating">
                                                        {ride.waitTime} {tCommon('minutes')}
                                                    </Badge>
                                                )}
                                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    // User is OUTSIDE parks - show nearby parks list
    if (nearbyData.type === 'nearby_parks') {
        const data = nearbyData.data as NearbyParksData;
        const parks = data.parks;

        if (parks.length === 0) {
            return (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
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
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-park-primary" />
                        {t('nearbyParks')} ({parks.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {parks.map((park) => {
                            const isOpen = park.status === 'OPERATING';

                            return (
                                <Link
                                    key={park.id}
                                    href={park.url.replace('/v1/parks/', '/parks/')}
                                    className="group"
                                >
                                    <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <CardTitle className="text-base font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                                                    {park.name}
                                                </CardTitle>
                                                <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors mt-0.5" />
                                            </div>
                                            <p className="text-muted-foreground text-xs truncate mt-1">
                                                {park.city}, {tGeo(`countries.${park.country.toLowerCase()}` as string) || park.country}
                                            </p>
                                        </CardHeader>
                                        <CardContent className="space-y-3 pt-0">
                                            {/* Distance + Status */}
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Navigation className="h-4 w-4" />
                                                    <span className="font-medium">{formatDistance(park.distance)}</span>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs ${isOpen
                                                        ? 'border-green-600 text-green-600'
                                                        : 'border-red-500 text-red-500'
                                                        }`}
                                                >
                                                    {isOpen ? tCommon('open') : tCommon('closed')}
                                                </Badge>
                                            </div>

                                            {/* Wait Time + Crowd Level (only for open parks) */}
                                            {isOpen && park.analytics && (
                                                <div className="flex items-center gap-2.5 text-sm">
                                                    {park.analytics.avgWaitTime !== undefined && park.analytics.avgWaitTime > 0 && (
                                                        <div className="flex items-center gap-1 text-muted-foreground">
                                                            <Clock className="h-4 w-4" />
                                                            <span className="text-xs font-medium">
                                                                {park.analytics.avgWaitTime}{tCommon('minute', { count: park.analytics.avgWaitTime })}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {park.analytics.crowdLevel && (
                                                        <Badge
                                                            className={`text-xs ${(park.analytics.crowdLevel as ParkCrowdLevel | CrowdLevel) === 'very_low' || (park.analytics.crowdLevel as ParkCrowdLevel | CrowdLevel) === 'low'
                                                                ? 'bg-crowd-low'
                                                                : (park.analytics.crowdLevel as ParkCrowdLevel | CrowdLevel) === 'normal' || (park.analytics.crowdLevel as ParkCrowdLevel | CrowdLevel) === 'moderate'
                                                                    ? 'bg-crowd-moderate'
                                                                    : 'bg-crowd-high'
                                                                } text-white border-0`}
                                                        >
                                                            {tCommon(`crowd.${park.analytics.crowdLevel}`)}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}

                                            {/* Attractions */}
                                            <div className="flex items-center justify-between text-sm pt-0.5">
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <TrendingUp className="h-4 w-4" />
                                                    <span className="font-medium">
                                                        {park.operatingAttractions}/{park.totalAttractions}
                                                    </span>
                                                </div>
                                                <span className="text-muted-foreground text-xs">{tCommon('operating')}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return null;
}
