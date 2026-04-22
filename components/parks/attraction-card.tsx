import { Link } from '@/i18n/navigation';
import { Clock, Crown, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { FavoriteStar } from '@/components/common/favorite-star';
import { BackgroundOverlay } from '@/components/common/background-overlay';
import { DistanceBadge } from '@/components/common/distance-badge';
import type { ParkAttraction, AttractionStatus, ParkStatus, BestVisitSlot } from '@/lib/api/types';
import type { FavoriteAttraction } from '@/lib/api/favorites';
import { useTranslations, useLocale } from 'next-intl';
import { stripNewPrefix } from '@/lib/utils';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import { CrowdLevelBadge } from './crowd-level-badge';
import { ParkStatusBadge } from './park-status-badge';
import { SeasonalBadge } from './seasonal-badge';
import { TrendIndicator } from './trend-indicator';
import { QueueTypeBadge } from './queue-type-badge';
import { WaitTimeSparkline } from './wait-time-sparkline';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { TruncatedText } from '@/components/common/truncated-text';

interface AttractionCardProps {
  attraction: ParkAttraction | FavoriteAttraction;
  parkPath?: string; // Optional for favorites (uses attraction.url)
  parkStatus?: ParkStatus;
  backgroundImage?: string | null; // Optional background image (for favorites)
  distance?: number; // Optional distance (for favorites)
  showParkName?: boolean; // Show park name (for favorites section on homepage)
  timezone?: string;
}

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
): AttractionStatus | 'UNKNOWN' {
  if (parkStatus && parkStatus === 'UNKNOWN') {
    return 'UNKNOWN';
  }
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

function formatBestVisitTime(isoStr: string, timezone?: string, locale = 'en'): string {
  const hour12 = locale === 'en';
  return new Intl.DateTimeFormat(locale, {
    hour: hour12 ? 'numeric' : '2-digit',
    minute: '2-digit',
    hour12,
    ...(hour12 ? {} : { hourCycle: 'h23' }),
    timeZone: timezone ?? 'UTC',
  }).format(new Date(isoStr));
}

function getBestVisitSlotStatus(isoStr: string): 'now' | 'future' | 'past' {
  const slotStart = new Date(isoStr);
  const slotEnd = new Date(slotStart.getTime() + 15 * 60 * 1000);
  const now = new Date();
  if (now >= slotStart && now < slotEnd) return 'now';
  if (now < slotStart) return 'future';
  return 'past';
}

function minutesUntilSlot(isoStr: string): number {
  return Math.round((new Date(isoStr).getTime() - Date.now()) / 60000);
}

function getOptimalSlot(attraction: ParkAttraction | FavoriteAttraction): BestVisitSlot | null {
  if (!('bestVisitTimes' in attraction) || !attraction.bestVisitTimes) return null;
  return attraction.bestVisitTimes.find((s) => s.rating === 'optimal') ?? null;
}

function getHref(attraction: ParkAttraction | FavoriteAttraction, parkPath?: string): string {
  // Check if attraction has url property (now available in both ParkAttraction and FavoriteAttraction)
  if ('url' in attraction && attraction.url) {
    // Use centralized utility for URL conversion
    const convertedUrl = convertApiUrlToFrontendUrl(attraction.url);
    if (convertedUrl && convertedUrl !== '#') {
      return convertedUrl;
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
  timezone,
}: AttractionCardProps) {
  const t = useTranslations('attractions');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const status = getStatus(attraction, parkStatus);
  // If park is closed, force wait time to null
  const waitTime =
    parkStatus && parkStatus !== 'OPERATING' && parkStatus !== 'UNKNOWN'
      ? null
      : getWaitTime(attraction);
  const effectiveTimezone =
    timezone ??
    ('park' in attraction && attraction.park?.timezone ? attraction.park.timezone : undefined);

  const crowdLevel = getCrowdLevel(attraction);
  const href = getHref(attraction, parkPath);

  // Use provided backgroundImage or try to get from attraction
  const backgroundImage =
    propBackgroundImage ?? ('backgroundImage' in attraction ? attraction.backgroundImage : null);

  const isOperatingOrUnknown = status === 'OPERATING' || status === 'UNKNOWN';

  return (
    <Link href={href} prefetch={false} className="group block h-full">
      <Card className="hover:border-primary/50 hover:bg-background/70 relative h-full overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
        {/* Background Image */}
        {backgroundImage && (
          <BackgroundOverlay
            imageSrc={backgroundImage}
            alt={stripNewPrefix(attraction.name)}
            intensity="medium"
            hoverEffect
          />
        )}

        {/* Favorite Star */}
        {attraction.id && (
          <div className="absolute top-2 right-2 z-20 flex items-center justify-center">
            <FavoriteStar
              type="attraction"
              id={attraction.id}
              name={stripNewPrefix(attraction.name)}
            />
          </div>
        )}
        <CardContent className="relative z-10 flex h-full flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="flex items-center gap-1.5 leading-tight font-medium">
                {'isHeadliner' in attraction && attraction.isHeadliner && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Crown className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">{t('headliner.title')}</p>
                      <p className="text-muted-foreground mt-0.5">{t('headliner.description')}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                <TruncatedText
                  text={stripNewPrefix(attraction.name)}
                  className="block min-w-0 flex-1 truncate"
                />
              </h3>

              {/* Park Name (only for favorites section on homepage) */}
              {showParkName &&
                'park' in attraction &&
                attraction.park &&
                'name' in attraction.park && (
                  <p className="text-muted-foreground mt-1 truncate text-xs">
                    {stripNewPrefix(attraction.park.name)}
                  </p>
                )}

              {/* Status description for non-operating attractions */}
              {!isOperatingOrUnknown && (
                <p className="text-muted-foreground mt-1 text-sm">
                  {t(`status.${status.toLowerCase()}`)}
                </p>
              )}

              {/* Wait Time & Trend */}
              {isOperatingOrUnknown && waitTime !== null && (
                <div className="mt-1 flex items-baseline gap-2">
                  <div className="flex items-center gap-1.5 text-lg font-bold">
                    <Clock className="h-4 w-4" />
                    {waitTime} {tCommon('minute', { count: waitTime })}
                  </div>
                  {attraction.trend && <TrendIndicator trend={attraction.trend} />}
                </div>
              )}

              {/* Queue Types */}
              {isOperatingOrUnknown && (
                <div className="mt-2 flex max-w-full flex-wrap gap-1">
                  {attraction.queues
                    ?.filter((q) => {
                      if (q.queueType === 'STANDBY') return false;
                      if (q.queueType === 'SINGLE_RIDER') {
                        if (!('waitTime' in q)) return false;
                        const wt = q.waitTime;
                        return wt !== null && wt !== undefined && typeof wt === 'number' && wt > 0;
                      }
                      return true;
                    })
                    .map((queue, i) => (
                      <QueueTypeBadge
                        key={`${queue.queueType}-${i}`}
                        queue={queue as import('@/lib/api/types').QueueDataItem}
                        timezone={effectiveTimezone}
                      />
                    ))}
                </div>
              )}

              {/* Peak Wait Time */}
              {isOperatingOrUnknown &&
                attraction.statistics?.peakWaitToday !== null &&
                attraction.statistics?.peakWaitToday !== undefined && (
                  <div className="text-muted-foreground mt-1 text-xs">
                    {t('peak', { time: attraction.statistics.peakWaitToday })}
                  </div>
                )}

              {/* Best visit time — only for open rides */}
              {status === 'OPERATING' &&
                (() => {
                  const slot = getOptimalSlot(attraction);
                  if (!slot) return null;
                  const slotStatus = getBestVisitSlotStatus(slot.time);
                  const time = formatBestVisitTime(slot.time, effectiveTimezone, locale);
                  let label: string;
                  if (slotStatus === 'now') {
                    label = t('bestVisitNow');
                  } else if (slotStatus === 'future') {
                    label = t('bestVisitInMin', { time, minutes: minutesUntilSlot(slot.time) });
                  } else {
                    label = t('bestVisit', { time });
                  }
                  return (
                    <div className="mt-1 flex items-center gap-1 text-xs text-emerald-700 dark:text-amber-400">
                      <Star className="h-3 w-3 shrink-0 fill-current" />
                      <span className="font-medium">{label}</span>
                    </div>
                  );
                })()}
            </div>

            <div className="flex flex-col items-end gap-2">
              <ParkStatusBadge
                status={status as import('@/lib/api/types').ParkStatus}
                className="shrink-0"
              />

              {/* Seasonal Badge */}
              {'isSeasonal' in attraction && attraction.isSeasonal && (
                <SeasonalBadge
                  seasonMonths={'seasonMonths' in attraction ? attraction.seasonMonths : null}
                  isCurrentlyInSeason={
                    'isCurrentlyInSeason' in attraction ? attraction.isCurrentlyInSeason : null
                  }
                  className="h-5 px-1.5 text-[10px]"
                />
              )}

              {/* Crowd Level Badge */}
              {isOperatingOrUnknown && crowdLevel && (
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
            <DistanceBadge distance={distance} className="mt-2" />
          )}

          {/* Sparkline */}
          {isOperatingOrUnknown &&
            attraction.statistics?.history &&
            attraction.statistics.history.length > 0 && (
              <div className="mt-auto h-16 w-full overflow-hidden pt-4 opacity-50 transition-opacity group-hover:opacity-100">
                <WaitTimeSparkline
                  history={attraction.statistics.history}
                  timezone={effectiveTimezone}
                  className="text-primary"
                />
              </div>
            )}
        </CardContent>
      </Card>
    </Link>
  );
}
