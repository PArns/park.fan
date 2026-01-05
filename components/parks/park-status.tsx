import { useTranslations } from 'next-intl';
import {
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  ActivitySquare,
} from 'lucide-react';
import { LocalTime } from '@/components/ui/local-time';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CrowdLevelBadge } from './crowd-level-badge';
import { PeakHourBadge } from './peak-hour-badge';
import { ParkStatusBadge } from './park-status-badge';
import { cn } from '@/lib/utils';
import type { ParkWithAttractions, ParkResponse, TrendDirection } from '@/lib/api/types';

type ParkData = ParkWithAttractions | ParkResponse;

interface ParkStatusProps {
  park: ParkData;
  variant: 'compact' | 'detailed' | 'card' | 'hero';
  showWeather?: boolean;
  showSchedule?: boolean;
  className?: string;
}

const trendIconMap: Record<TrendDirection, typeof TrendingUp> = {
  up: TrendingUp,
  stable: Minus,
  down: TrendingDown,
  increasing: TrendingUp,
  decreasing: TrendingDown,
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
        {analytics?.statistics?.peakWaitToday !== undefined && (
          <Badge variant="outline" className="px-4 py-1 text-base">
            <TrendingUp className="mr-2 h-4 w-4" />
            {t('peak')}: {analytics.statistics.peakWaitToday} min
          </Badge>
        )}
      </div>
    );
  }

  // Detailed variant - for park page (NEW DESIGN)
  if (variant === 'detailed') {
    const crowdLevel = analytics?.statistics?.crowdLevel || currentLoad?.crowdLevel;
    const occupancy = analytics?.occupancy;
    const stats = analytics?.statistics;

    return (
      <div className={cn('space-y-4', className)}>
        {/* Main Stats Grid */}
        {status === 'OPERATING' && (stats || occupancy) && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Status & Crowd Card */}
            {crowdLevel && status && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ActivitySquare className="h-4 w-4" />
                    {t('crowdLevel')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-center py-2">
                    <CrowdLevelBadge level={crowdLevel} className="scale-110" />
                  </div>
                  {occupancy && (
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-muted-foreground text-xs">{t('occupancy')}</span>
                        <span className="text-foreground text-xl font-bold">
                          {Math.round(occupancy.current)}%
                        </span>
                      </div>
                      <Progress
                        value={occupancy.current}
                        className="h-2"
                        aria-label={t('occupancy')}
                      />
                      {occupancy.comparisonStatus !== 'typical' && (
                        <p className="text-xs">
                          <span
                            className={cn(
                              'font-semibold',
                              occupancy.comparisonStatus === 'higher' ||
                                occupancy.comparisonStatus === 'much_higher'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-green-600 dark:text-green-400'
                            )}
                          >
                            {Math.abs(occupancy.comparedToTypical)}%{' '}
                            {tCommon(occupancy.comparisonStatus)}
                          </span>
                          <span className="text-muted-foreground ml-1">
                            {tCommon('vsTypical').toLowerCase()}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Wait Times Card */}
            {stats && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4" />
                    {t('avgWaitTime')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-muted-foreground text-sm font-medium">Aktuell</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-foreground text-3xl font-bold tabular-nums">
                        {stats.avgWaitTime}
                      </span>
                      <span className="text-muted-foreground text-sm font-medium">
                        {tCommon('minutes')}
                      </span>
                    </div>
                  </div>

                  {occupancy?.trend && (
                    <div className="flex items-center justify-between border-t pt-3">
                      <span className="text-muted-foreground text-sm font-medium">
                        {tCommon('trend')}
                      </span>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const Icon = trendIconMap[occupancy.trend];
                          return (
                            <div
                              className={cn(
                                'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                                (occupancy.trend === 'up' || occupancy.trend === 'increasing') &&
                                  'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
                                (occupancy.trend === 'down' || occupancy.trend === 'decreasing') &&
                                  'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400',
                                occupancy.trend === 'stable' && 'bg-muted text-muted-foreground'
                              )}
                            >
                              <Icon className="h-3 w-3" />
                              <span className="capitalize">{tCommon(occupancy.trend)}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                  {stats.peakWaitToday !== undefined && (
                    <div className="flex items-center justify-between border-t pt-3">
                      <span className="text-muted-foreground text-sm font-medium">
                        {t('parkPeak')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-foreground text-lg font-bold tabular-nums">
                          {stats.peakWaitToday}
                        </span>
                        <span className="text-muted-foreground text-xs font-medium">
                          {tCommon('minutes')}
                        </span>
                      </div>
                    </div>
                  )}
                  {stats.peakHour && (
                    <div className="flex items-center justify-between border-t pt-3">
                      <span className="text-muted-foreground text-sm font-medium">
                        {t('peakHour')}
                      </span>
                      <div className="flex items-center">
                        <span className="text-foreground text-sm font-bold tabular-nums">
                          <LocalTime
                            time={
                              stats.peakHour.includes('T')
                                ? stats.peakHour
                                : (() => {
                                    const now = new Date();
                                    const [h, m] = stats.peakHour.split(':').map(Number);
                                    now.setUTCHours(h, m, 0, 0);
                                    return now.toISOString();
                                  })()
                            }
                            timeZone={park.timezone}
                          />
                        </span>
                        <PeakHourBadge peakHour={stats.peakHour} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Attractions Status Card */}
            {stats && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" />
                    {t('attractions')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-center py-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-foreground text-4xl font-bold tabular-nums">
                        {stats.operatingAttractions}
                      </span>
                      <span className="text-muted-foreground text-xl font-medium">
                        / {stats.totalAttractions}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="rounded-md bg-green-50 px-2 py-1.5 text-center dark:bg-green-950/30">
                      <div className="font-semibold text-green-700 dark:text-green-400">
                        {stats.operatingAttractions}
                      </div>
                      <div className="text-muted-foreground">{t('operating')}</div>
                    </div>
                    <div className="rounded-md bg-red-50 px-2 py-1.5 text-center dark:bg-red-950/30">
                      <div className="font-semibold text-red-700 dark:text-red-400">
                        {stats.closedAttractions}
                      </div>
                      <div className="text-muted-foreground">{tCommon('closed')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default variant (full stats grid) - kept for backwards compatibility
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
                  const TrendIcon = trendIconMap[analytics.occupancy.trend];
                  return (
                    <>
                      <TrendIcon
                        className={cn(
                          'h-5 w-5',
                          (analytics.occupancy.trend === 'up' ||
                            analytics.occupancy.trend === 'increasing') &&
                            'text-crowd-high',
                          (analytics.occupancy.trend === 'down' ||
                            analytics.occupancy.trend === 'decreasing') &&
                            'text-crowd-low',
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
                  (analytics.occupancy.comparisonStatus === 'lower' ||
                    analytics.occupancy.comparisonStatus === 'much_lower') &&
                    'border-crowd-low text-crowd-low',
                  (analytics.occupancy.comparisonStatus === 'higher' ||
                    analytics.occupancy.comparisonStatus === 'much_higher') &&
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
