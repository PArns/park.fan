import { useTranslations } from 'next-intl';
import { Clock, Users, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { LocalTime } from '@/components/ui/local-time';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CrowdLevelBadge } from './crowd-level-badge';
import { ParkStatusBadge } from './park-status-badge';
import { cn } from '@/lib/utils';
import type { ParkWithAttractions, ParkResponse, Trend } from '@/lib/api/types';

type ParkData = ParkWithAttractions | ParkResponse;

interface ParkStatusProps {
  park: ParkData;
  variant: 'compact' | 'detailed' | 'card' | 'hero';
  showWeather?: boolean;
  showSchedule?: boolean;
  className?: string;
}

const trendIcons: Record<Trend, typeof TrendingUp> = {
  up: TrendingUp,
  stable: Minus,
  down: TrendingDown,
};

export function ParkStatus({ park, variant, showSchedule = true, className }: ParkStatusProps) {
  const analytics = 'analytics' in park ? park.analytics : null;
  const currentLoad = 'currentLoad' in park ? park.currentLoad : null;
  const status = 'status' in park ? park.status : undefined;
  const schedule = 'schedule' in park ? park.schedule : undefined;
  const tCommon = useTranslations('common');
  const t = useTranslations('parks');

  // Compact variant - just badges
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {status && <ParkStatusBadge status={status} />}
        {currentLoad && status === 'OPERATING' && (
          <CrowdLevelBadge level={currentLoad.crowdLevel} />
        )}
      </div>
    );
  }

  // Card variant - for listing cards
  if (variant === 'card') {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center gap-2">
          {status && <ParkStatusBadge status={status} />}
          {currentLoad && status === 'OPERATING' && (
            <CrowdLevelBadge level={currentLoad.crowdLevel} />
          )}
        </div>
        {analytics?.statistics && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1.5">
              <Clock className="text-muted-foreground h-4 w-4" />
              <span>{analytics.statistics.avgWaitTime} min avg</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="text-muted-foreground h-4 w-4" />
              <span>
                {analytics.statistics.operatingAttractions}/{analytics.statistics.totalAttractions}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Hero variant - large display for park header
  if (variant === 'hero') {
    return (
      <div className={cn('flex flex-wrap items-center gap-4', className)}>
        {status && <ParkStatusBadge status={status} className="px-4 py-1 text-base" />}
        {currentLoad && status === 'OPERATING' && (
          <CrowdLevelBadge level={currentLoad.crowdLevel} className="px-4 py-1 text-base" />
        )}
        {analytics?.statistics && (
          <Badge variant="outline" className="px-4 py-1 text-base">
            <Clock className="mr-2 h-4 w-4" />
            {analytics.statistics.avgWaitTime} min avg
          </Badge>
        )}
      </div>
    );
  }

  // Detailed variant - for park page
  if (variant === 'detailed') {
    const crowdLevel = analytics?.statistics?.crowdLevel || currentLoad?.crowdLevel;

    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-0">
          <div className="divide-border border-border grid grid-cols-2 divide-x border-b md:grid-cols-4">
            {/* Status */}
            <div className="bg-muted/10 flex flex-col items-center justify-center gap-2 p-6 text-center">
              <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                {tCommon('status')}
              </span>
              {status && (
                <div className="origin-center scale-125">
                  <ParkStatusBadge status={status} />
                </div>
              )}
            </div>

            {/* Crowd Level */}
            <div className="bg-muted/10 flex flex-col items-center justify-center gap-2 p-6 text-center">
              <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                {t('crowdLevel')}
              </span>
              {crowdLevel && status === 'OPERATING' ? (
                <div className="origin-center scale-125">
                  <CrowdLevelBadge level={crowdLevel} />
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">-</div>
              )}
            </div>

            {/* Avg Wait Time */}
            <div className="flex flex-col items-center justify-center gap-1 p-6 text-center">
              <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {t('avgWaitTime')}
              </span>
              <div className="text-foreground mt-1 flex items-center gap-2 text-3xl font-black">
                <Clock className="text-muted-foreground/50 h-6 w-6" />
                <span>
                  {analytics?.statistics?.avgWaitTime || 0}
                  <span className="text-muted-foreground ml-1 text-sm font-medium">
                    {tCommon('minutes')}
                  </span>
                </span>
              </div>
            </div>

            {/* Operating Attractions */}
            <div className="flex flex-col items-center justify-center gap-1 p-6 text-center">
              <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {t('attractions')}
              </span>
              <div className="text-foreground mt-1 flex items-center gap-2 text-3xl font-black">
                <Users className="text-muted-foreground/50 h-6 w-6" />
                <span>
                  {analytics?.statistics?.operatingAttractions || 0}
                  <span className="text-muted-foreground ml-1 text-lg font-medium">
                    / {analytics?.statistics?.totalAttractions || 0}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Trend & Occupancy */}
          {analytics?.occupancy && (
            <div className="divide-border bg-muted/30 grid grid-cols-2 divide-x">
              <div className="flex items-center justify-center gap-3 p-3">
                <span className="text-muted-foreground text-xs font-medium uppercase">
                  {tCommon('trend')}
                </span>
                <div className="flex items-center gap-1.5">
                  {analytics.occupancy.trend && trendIcons[analytics.occupancy.trend] && (
                    <div
                      className={cn(
                        'rounded-full p-1',
                        analytics.occupancy.trend === 'up'
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/30'
                          : analytics.occupancy.trend === 'down'
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800'
                      )}
                    >
                      {(() => {
                        const Icon = trendIcons[analytics.occupancy.trend];
                        return <Icon className="h-3.5 w-3.5" />;
                      })()}
                    </div>
                  )}
                  <span className="text-sm font-medium">{tCommon(analytics.occupancy.trend)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 p-3">
                <span className="text-muted-foreground text-xs font-medium uppercase">
                  {tCommon('vsTypical')}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      analytics.occupancy.comparisonStatus === 'higher'
                        ? 'text-red-500'
                        : analytics.occupancy.comparisonStatus === 'lower'
                          ? 'text-green-500'
                          : 'text-muted-foreground'
                    )}
                  >
                    {analytics.occupancy.comparisonStatus === 'typical'
                      ? tCommon('typical')
                      : `${Math.abs(analytics.occupancy.comparedToTypical)}% ${tCommon(analytics.occupancy.comparisonStatus)}`}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default variant (previously 'detailed') - full stats grid
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Status */}
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm font-medium">{tCommon('status')}</p>
            <div className="flex items-center gap-2">
              {status && <ParkStatusBadge status={status} />}
            </div>
          </div>

          {/* Crowd Level */}
          {currentLoad && status === 'OPERATING' && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm font-medium">{t('crowdLevel')}</p>
              <CrowdLevelBadge level={currentLoad.crowdLevel} />
            </div>
          )}

          {/* Average Wait Time */}
          {analytics?.statistics && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm font-medium">{t('avgWaitTime')}</p>
              <div className="flex items-center gap-2">
                <Clock className="text-primary h-5 w-5" />
                <span className="text-2xl font-bold">{analytics.statistics.avgWaitTime}</span>
                <span className="text-muted-foreground">{tCommon('minutes')}</span>
              </div>
            </div>
          )}

          {/* Operating Attractions */}
          {analytics?.statistics && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm font-medium">{t('attractions')}</p>
              <div className="flex items-center gap-2">
                <Users className="text-primary h-5 w-5" />
                <span className="text-2xl font-bold">
                  {analytics.statistics.operatingAttractions}
                </span>
                <span className="text-muted-foreground">
                  / {analytics.statistics.totalAttractions} {t('open')}
                </span>
              </div>
            </div>
          )}

          {/* Occupancy Trend */}
          {analytics?.occupancy && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm font-medium">{tCommon('trend')}</p>
              <div className="flex items-center gap-2">
                {(() => {
                  const TrendIcon = trendIcons[analytics.occupancy.trend];
                  return (
                    <>
                      <TrendIcon
                        className={cn(
                          'h-5 w-5',
                          analytics.occupancy.trend === 'up' && 'text-crowd-high',
                          analytics.occupancy.trend === 'down' && 'text-crowd-low',
                          analytics.occupancy.trend === 'stable' && 'text-muted-foreground'
                        )}
                      />
                      <span className="capitalize">{tCommon(analytics.occupancy.trend)}</span>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Comparison to Typical */}
          {analytics?.occupancy && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm font-medium">{tCommon('vsTypical')}</p>
              <Badge
                variant="outline"
                className={cn(
                  analytics.occupancy.comparisonStatus === 'lower' &&
                    'border-crowd-low text-crowd-low',
                  analytics.occupancy.comparisonStatus === 'higher' &&
                    'border-crowd-high text-crowd-high',
                  analytics.occupancy.comparisonStatus === 'typical' && 'border-muted-foreground'
                )}
              >
                {analytics.occupancy.comparedToTypical > 0 ? '+' : ''}
                {analytics.occupancy.comparedToTypical}%{' '}
                {tCommon(analytics.occupancy.comparisonStatus)}
              </Badge>
            </div>
          )}

          {/* Today's Schedule */}
          {showSchedule &&
            schedule &&
            schedule.length > 0 &&
            (() => {
              // Get today's schedule - filter by date in park's timezone
              const todayInParkTz = new Date().toLocaleDateString('en-CA', {
                timeZone: park.timezone,
              }); // Format: YYYY-MM-DD
              const todaySchedule = schedule.find((s) => s.date === todayInParkTz) || schedule[0];

              if (!todaySchedule) return null;

              return (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm font-medium">{tCommon('today')}</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="text-primary h-5 w-5" />
                    {todaySchedule.scheduleType === 'OPERATING' ? (
                      <span>
                        <LocalTime
                          time={todaySchedule.openingTime || ''}
                          timeZone={park.timezone}
                        />
                        {' - '}
                        <LocalTime
                          time={todaySchedule.closingTime || ''}
                          timeZone={park.timezone}
                        />
                      </span>
                    ) : (
                      <span className="text-status-closed">Closed</span>
                    )}
                  </div>
                </div>
              );
            })()}
        </div>
      </CardContent>
    </Card>
  );
}
