import { useTranslations } from 'next-intl';
import { fromZonedTime } from 'date-fns-tz';
import { Clock, Users, TrendingUp, ActivitySquare } from 'lucide-react';
import { LocalTime } from '@/components/ui/local-time';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CrowdLevelBadge } from './crowd-level-badge';
import { PeakHourBadge } from './peak-hour-badge';
import { ParkStatusBadge } from './park-status-badge';
import { TrendIndicator } from './trend-indicator';
import { cn } from '@/lib/utils';
import type { ParkWithAttractions, ParkResponse } from '@/lib/api/types';

type ParkData = ParkWithAttractions | ParkResponse;

interface ParkStatusProps {
  park: ParkData;
  variant: 'compact' | 'detailed' | 'card' | 'hero';
  className?: string;
}

export function ParkStatus({ park, variant, className }: ParkStatusProps) {
  const analytics = 'analytics' in park ? park.analytics : null;
  const currentLoad = 'currentLoad' in park ? park.currentLoad : null;
  const status = 'status' in park ? park.status : undefined;
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
              <span>
                {analytics.statistics.avgWaitTime} {tCommon('minutes')} {tCommon('avgWait')}
              </span>
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
          <Badge variant="outline" className="px-4 py-1 text-base backdrop-blur-md">
            <Clock className="mr-2 h-4 w-4" />
            {analytics.statistics.avgWaitTime} {tCommon('minutes')} {tCommon('avgWait')}
          </Badge>
        )}
        {analytics?.statistics?.peakWaitToday !== undefined && (
          <Badge variant="outline" className="px-4 py-1 text-base backdrop-blur-md">
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
                                ? 'text-trend-up'
                                : 'text-trend-down'
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
                    <span className="text-muted-foreground text-sm font-medium">
                      {tCommon('current')}
                    </span>
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
                      <TrendIndicator
                        trend={occupancy.trend}
                        variant="pill"
                        label={tCommon(occupancy.trend)}
                      />
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
                                    const today = new Date().toLocaleDateString('en-CA', {
                                      timeZone: park.timezone,
                                    });
                                    return fromZonedTime(
                                      `${today}T${stats.peakHour}:00`,
                                      park.timezone
                                    ).toISOString();
                                  })()
                            }
                            timeZone={park.timezone}
                          />
                        </span>
                        <PeakHourBadge peakHour={stats.peakHour} timezone={park.timezone} />
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
                    <div className="bg-status-operating/10 rounded-md px-2 py-1.5 text-center">
                      <div className="text-status-operating font-semibold">
                        {stats.operatingAttractions}
                      </div>
                      <div className="text-muted-foreground">{t('operating')}</div>
                    </div>
                    <div className="bg-status-closed/10 rounded-md px-2 py-1.5 text-center">
                      <div className="text-status-closed font-semibold">
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

  return null;
}
