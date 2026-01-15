import { Link } from '@/i18n/navigation';
import {
  Clock,
  AlertTriangle,
  Wrench,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  User,
  Zap,
  Ticket,
  Navigation,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FavoriteStar } from '@/components/common/favorite-star';
import { BackgroundOverlay } from '@/components/common/background-overlay';
import type { ParkAttraction, AttractionStatus, ParkStatus } from '@/lib/api/types';
import type { FavoriteAttraction } from '@/lib/api/favorites';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { formatDistance } from '@/lib/utils/distance-utils';
import { CrowdLevelBadge } from './crowd-level-badge';
import { WaitTimeSparkline } from './wait-time-sparkline';

interface AttractionCardProps {
  attraction: ParkAttraction | FavoriteAttraction;
  parkPath?: string; // Optional for favorites (uses attraction.url)
  parkStatus?: ParkStatus;
  backgroundImage?: string | null; // Optional background image (for favorites)
  distance?: number; // Optional distance (for favorites)
  showParkName?: boolean; // Show park name (for favorites section on homepage)
}

const statusConfig: Record<AttractionStatus, { icon: typeof Clock; color: string }> = {
  OPERATING: { icon: Clock, color: 'text-status-operating' },
  DOWN: { icon: AlertTriangle, color: 'text-status-down' },
  CLOSED: { icon: XCircle, color: 'text-status-closed' },
  REFURBISHMENT: { icon: Wrench, color: 'text-status-refurbishment' },
};

function getWaitTime(attraction: ParkAttraction | FavoriteAttraction): number | null {
  const standbyQueue = attraction.queues?.find((q) => q.queueType === 'STANDBY');
  if (!standbyQueue) return null;
  // Handle both QueueDataItem and FavoriteAttraction queue types
  if ('waitTime' in standbyQueue) {
    return standbyQueue.waitTime ?? null;
  }
  return null;
}

function getStatus(
  attraction: ParkAttraction | FavoriteAttraction,
  parkStatus?: ParkStatus
): AttractionStatus {
  if (parkStatus && parkStatus !== 'OPERATING') {
    return 'CLOSED';
  }
  const standbyQueue = attraction.queues?.find((q) => q.queueType === 'STANDBY');
  if (standbyQueue && 'status' in standbyQueue) {
    return (
      (standbyQueue.status as AttractionStatus) ??
      (attraction.status as AttractionStatus) ??
      'CLOSED'
    );
  }
  return (attraction.status as AttractionStatus) ?? 'CLOSED';
}

function getCrowdLevel(attraction: ParkAttraction | FavoriteAttraction): string | undefined {
  if ('crowdLevel' in attraction) {
    return attraction.crowdLevel;
  }
  if ('currentLoad' in attraction && attraction.currentLoad?.crowdLevel) {
    return attraction.currentLoad.crowdLevel;
  }
  return undefined;
}

function getHref(attraction: ParkAttraction | FavoriteAttraction, parkPath?: string): string {
  // Check if attraction has url property (now available in both ParkAttraction and FavoriteAttraction)
  if ('url' in attraction && attraction.url) {
    // Convert API URL to frontend URL
    // Backend returns: /v1/parks/europe/germany/bruhl/phantasialand/attractions/taron
    // Frontend needs: /parks/europe/germany/bruhl/phantasialand/taron
    if (attraction.url.startsWith('/v1/parks/')) {
      // Remove /v1 prefix and /attractions/ segment
      const url = attraction.url.replace('/v1/parks/', '/parks/').replace('/attractions/', '/');
      // Ensure URL is complete (has all segments)
      if (url.startsWith('/parks/') && url.split('/').length >= 6) {
        return url;
      }
    }
    // If it's already a frontend URL, validate and use it
    if (attraction.url.startsWith('/parks/')) {
      // Ensure it's a complete URL (has all segments: continent/country/city/park/attraction)
      const segments = attraction.url.split('/').filter(Boolean);
      if (segments.length >= 6 && segments[0] === 'parks') {
        return attraction.url;
      }
    }
  }

  // For FavoriteAttraction, try to construct from park data if available
  if ('park' in attraction && attraction.park) {
    const favoriteAttraction = attraction as FavoriteAttraction;
    const park = favoriteAttraction.park;
    if (park && park.continent && park.country && park.city) {
      return `/parks/${park.continent}/${park.country}/${park.city}/${park.slug}/${attraction.slug}`;
    }
  }

  // Fallback: use parkPath (for ParkAttraction on park detail pages)
  if (parkPath) {
    return `${parkPath}/${attraction.slug}` as '/europe/germany/rust/europa-park/blue-fire';
  }
  return '#';
}

export function AttractionCard({
  attraction,
  parkPath,
  parkStatus,
  backgroundImage: propBackgroundImage,
  distance,
  showParkName = false, // Default: don't show park name (for park detail pages)
}: AttractionCardProps) {
  const tStatus = useTranslations('attractions.label');
  const t = useTranslations('attractions');
  const tCommon = useTranslations('common');

  const status = getStatus(attraction, parkStatus);
  // If park is closed, force wait time to null
  const waitTime = parkStatus && parkStatus !== 'OPERATING' ? null : getWaitTime(attraction);
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const trendIcon = {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus,
    increasing: TrendingUp,
    decreasing: TrendingDown,
  };

  const TrendIcon = attraction.trend ? trendIcon[attraction.trend] : null;
  const crowdLevel = getCrowdLevel(attraction);
  const href = getHref(attraction, parkPath);

  // Use provided backgroundImage or try to get from attraction
  const backgroundImage =
    propBackgroundImage ?? ('backgroundImage' in attraction ? attraction.backgroundImage : null);

  return (
    <Link href={href} className="group block h-full">
      <Card className="hover:bg-muted/50 relative h-full overflow-hidden transition-colors">
        {/* Background Image */}
        {backgroundImage && (
          <BackgroundOverlay
            imageSrc={backgroundImage}
            alt={attraction.name}
            intensity="medium"
            hoverEffect
          />
        )}

        {/* Favorite Star */}
        {attraction.id && (
          <div className="absolute top-2 right-2 z-20 flex items-center justify-center">
            <FavoriteStar type="attraction" id={attraction.id} />
          </div>
        )}
        <CardContent className="relative z-10 flex h-full flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate leading-tight font-medium">{attraction.name}</h3>

              {/* Park Name (only for favorites section on homepage) */}
              {showParkName &&
                'park' in attraction &&
                attraction.park &&
                'name' in attraction.park && (
                  <p className="text-muted-foreground mt-1 truncate text-xs">
                    {attraction.park.name}
                  </p>
                )}

              {/* Wait Time & Trend */}
              {status === 'OPERATING' && waitTime !== null && (
                <div className="mt-1 flex items-baseline gap-2">
                  <div className="flex items-center gap-1.5 text-lg font-bold">
                    <Clock className="h-4 w-4" />
                    {waitTime} {tCommon('minute', { count: waitTime })}
                  </div>
                  {TrendIcon && (
                    <span
                      className={cn('flex items-center text-xs', {
                        'text-rose-500':
                          attraction.trend === 'up' || attraction.trend === 'increasing',
                        'text-emerald-500':
                          attraction.trend === 'down' || attraction.trend === 'decreasing',
                        'text-muted-foreground': attraction.trend === 'stable',
                      })}
                    >
                      <TrendIcon className="h-3 w-3" />
                    </span>
                  )}
                </div>
              )}

              {/* Queue Types */}
              {status === 'OPERATING' && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {attraction.queues
                    ?.filter((q) => {
                      // Filter out STANDBY
                      if (q.queueType === 'STANDBY') return false;
                      // Filter out SINGLE_RIDER if no wait time
                      if (q.queueType === 'SINGLE_RIDER') {
                        if (!('waitTime' in q)) return false;
                        const wt = q.waitTime;
                        return wt !== null && wt !== undefined && typeof wt === 'number' && wt > 0;
                      }
                      return true;
                    })
                    .map((queue, i) => {
                      let Icon = Ticket;
                      let label = '';
                      let variant: 'outline' | 'secondary' | 'default' = 'outline';

                      // Helper to safely get waitTime
                      const getWaitTime = (q: typeof queue): number | null => {
                        if (!('waitTime' in q)) return null;
                        const wt = q.waitTime;
                        return wt !== null && wt !== undefined && typeof wt === 'number' && wt > 0
                          ? wt
                          : null;
                      };

                      switch (queue.queueType) {
                        case 'SINGLE_RIDER':
                          Icon = User;
                          const singleRiderWaitTime = getWaitTime(queue);
                          label =
                            singleRiderWaitTime !== null
                              ? t('queue.details.singleRider', { time: singleRiderWaitTime })
                              : t('queue.details.singleRiderNoTime');
                          variant = 'outline';
                          break;

                        case 'PAID_RETURN_TIME':
                          Icon = Zap;
                          label =
                            'price' in queue && queue.price?.formatted
                              ? t('queue.details.lightningLane', { price: queue.price.formatted })
                              : t('queue.details.lightningLaneNoPrice');
                          variant = 'secondary';
                          break;

                        case 'PAID_STANDBY':
                          Icon = Zap;
                          label =
                            'price' in queue && queue.price?.formatted
                              ? t('queue.details.express', { price: queue.price.formatted })
                              : t('queue.details.expressNoPrice');
                          variant = 'secondary';
                          break;

                        case 'RETURN_TIME':
                          Icon = Ticket;
                          if (
                            'state' in queue &&
                            queue.state === 'AVAILABLE' &&
                            'returnStart' in queue &&
                            queue.returnStart
                          ) {
                            const start = new Date(queue.returnStart).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                            const end =
                              'returnEnd' in queue && queue.returnEnd
                                ? new Date(queue.returnEnd).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                                : '';
                            label = t('queue.details.return', { start, end });
                          } else {
                            label =
                              'state' in queue && queue.state === 'FULL'
                                ? t('queue.details.virtualQueueFull')
                                : t('queue.details.virtualQueue');
                          }
                          variant = 'outline';
                          break;

                        case 'BOARDING_GROUP':
                          Icon = Ticket;
                          if (
                            'allocationStatus' in queue &&
                            queue.allocationStatus === 'AVAILABLE'
                          ) {
                            label =
                              'currentGroupStart' in queue && queue.currentGroupStart
                                ? t('queue.details.boardingGroups', {
                                  start: queue.currentGroupStart,
                                  end: 'currentGroupEnd' in queue ? queue.currentGroupEnd : '',
                                })
                                : t('queue.details.boardingGroupsAvailable');
                          } else {
                            label =
                              'allocationStatus' in queue && queue.allocationStatus === 'FINISHED'
                                ? t('queue.details.boardingGroupsDistributed')
                                : t('queue.details.boardingGroupsPaused');
                          }
                          variant = 'outline';
                          break;
                      }

                      return (
                        <Badge
                          key={`${queue.queueType}-${i}`}
                          variant={variant}
                          className="flex items-center gap-1.5 px-1.5 py-0.5 text-[10px] font-normal"
                        >
                          <Icon className="h-3 w-3" />
                          {label}
                        </Badge>
                      );
                    })}
                </div>
              )}

              {/* Peak Wait Time */}
              {status === 'OPERATING' &&
                attraction.statistics?.peakWaitToday !== null &&
                attraction.statistics?.peakWaitToday !== undefined && (
                  <div className="text-muted-foreground mt-1 text-xs">
                    {t('peak', { time: attraction.statistics.peakWaitToday })}
                  </div>
                )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge
                className={cn(
                  'shrink-0 border-0 text-white dark:text-slate-900',
                  status === 'OPERATING'
                    ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-400'
                    : 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-400'
                )}
              >
                <StatusIcon className="mr-1 h-3 w-3" />
                {tStatus(status)}
              </Badge>

              {/* Crowd Level Badge */}
              {status === 'OPERATING' && crowdLevel && (
                <CrowdLevelBadge
                  level={
                    crowdLevel as 'very_low' | 'low' | 'moderate' | 'high' | 'very_high' | 'extreme'
                  }
                  className="h-5 px-1.5 text-[10px]"
                />
              )}
            </div>
          </div>

          {/* Distance (for favorites) */}
          {distance !== undefined && distance !== null && (
            <div className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
              <Navigation className="h-3.5 w-3.5" />
              <span className="font-medium">{formatDistance(distance)}</span>
            </div>
          )}

          {/* Sparkline */}
          {status === 'OPERATING' &&
            attraction.statistics?.history &&
            attraction.statistics.history.length > 0 && (
              <div className="mt-auto h-16 w-full pt-4 opacity-50 transition-opacity group-hover:opacity-100">
                <WaitTimeSparkline
                  history={attraction.statistics.history}
                  className="text-primary"
                />
              </div>
            )}
        </CardContent>
      </Card>
    </Link>
  );
}
