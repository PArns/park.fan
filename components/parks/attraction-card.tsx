import { Link } from '@/i18n/navigation';
import {
  Clock,
  AlertTriangle,
  Wrench,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ParkAttraction, AttractionStatus, ParkStatus } from '@/lib/api/types';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { CrowdLevelBadge } from './crowd-level-badge';

interface AttractionCardProps {
  attraction: ParkAttraction;
  parkPath: string;
  parkStatus?: ParkStatus;
}

const statusConfig: Record<AttractionStatus, { icon: typeof Clock; color: string }> = {
  OPERATING: { icon: Clock, color: 'text-status-operating' },
  DOWN: { icon: AlertTriangle, color: 'text-status-down' },
  CLOSED: { icon: XCircle, color: 'text-status-closed' },
  REFURBISHMENT: { icon: Wrench, color: 'text-status-refurbishment' },
};

function getWaitTime(attraction: ParkAttraction): number | null {
  const standbyQueue = attraction.queues?.find((q) => q.queueType === 'STANDBY');
  return standbyQueue?.waitTime ?? null;
}

function getStatus(attraction: ParkAttraction, parkStatus?: ParkStatus): AttractionStatus {
  if (parkStatus && parkStatus !== 'OPERATING') {
    return 'CLOSED';
  }
  const standbyQueue = attraction.queues?.find((q) => q.queueType === 'STANDBY');
  return standbyQueue?.status ?? attraction.status ?? 'CLOSED';
}

export function AttractionCard({ attraction, parkPath, parkStatus }: AttractionCardProps) {
  const tStatus = useTranslations('attractions.label');
  const t = useTranslations('attractions'); // You might need to add keys for 'peak' etc if not exist, or use hardcoded/common for now.
  // Using common translations or fallback

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

  // Virtual Queue (Boarding Group)
  const boardingGroup = attraction.queues?.find(q => q.queueType === 'BOARDING_GROUP');
  const hasReturnTimes = boardingGroup?.returnStart && boardingGroup?.returnEnd;

  return (
    <Link
      href={`${parkPath}/${attraction.slug}` as '/europe/germany/rust/europa-park/blue-fire'}
      className="block h-full group"
    >
      <Card className="hover:bg-muted/50 h-full transition-colors relative overflow-hidden">
        <CardContent className="flex flex-col p-4 h-full">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-medium leading-tight">{attraction.name}</h3>

              {/* Wait Time & Trend */}
              {status === 'OPERATING' && waitTime !== null && (
                <div className="mt-1 flex items-baseline gap-2">
                  <div className="flex items-center gap-1.5 text-lg font-bold">
                    <Clock className="h-4 w-4" />
                    {waitTime} min
                  </div>
                  {TrendIcon && (
                    <span
                      className={cn(
                        'flex items-center text-xs',
                        {
                          'text-rose-500':
                            attraction.trend === 'up' || attraction.trend === 'increasing',
                          'text-emerald-500':
                            attraction.trend === 'down' || attraction.trend === 'decreasing',
                          'text-muted-foreground': attraction.trend === 'stable',
                        }
                      )}
                    >
                      <TrendIcon className="h-3 w-3" />
                    </span>
                  )}
                </div>
              )}

              {/* Peak Wait Time */}
              {status === 'OPERATING' && attraction.statistics?.peakWaitToday !== null && attraction.statistics?.peakWaitToday !== undefined && (
                <div className="text-muted-foreground mt-0.5 text-xs">
                  {t('peak', { time: attraction.statistics.peakWaitToday })}
                </div>
              )}

              {/* Return Times (Virtual Queue) */}
              {status === 'OPERATING' && hasReturnTimes && (
                <div className="text-muted-foreground mt-1 text-xs font-medium">
                  {t('return', {
                    start: new Date(boardingGroup.returnStart!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    end: new Date(boardingGroup.returnEnd!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge
                className={cn(
                  'shrink-0 border-0 text-white',
                  status === 'OPERATING'
                    ? 'bg-emerald-500 hover:bg-emerald-600'
                    : 'bg-rose-500 hover:bg-rose-600'
                )}
              >
                <StatusIcon className="mr-1 h-3 w-3" />
                {tStatus(status)}
              </Badge>

              {/* Crowd Level Badge */}
              {status === 'OPERATING' && (attraction.crowdLevel || attraction.currentLoad?.crowdLevel) && (
                <CrowdLevelBadge level={attraction.crowdLevel || attraction.currentLoad!.crowdLevel} className="h-5 px-1.5 text-[10px]" />
              )}
            </div>
          </div>

          {/* Sparkline */}
          {status === 'OPERATING' && attraction.statistics?.history && attraction.statistics.history.length > 0 && (
            <div className="mt-auto pt-4 h-16 w-full opacity-50 group-hover:opacity-100 transition-opacity">
              <WaitTimeSparkline history={attraction.statistics.history} className="text-primary" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

// Need to import WaitTimeSparkline
import { WaitTimeSparkline } from './wait-time-sparkline';

