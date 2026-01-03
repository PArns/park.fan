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

  return (
    <Link
      href={`${parkPath}/${attraction.slug}` as '/europe/germany/rust/europa-park/blue-fire'}
      className="group block h-full"
    >
      <Card className="hover:bg-muted/50 relative h-full overflow-hidden transition-colors">
        <CardContent className="flex h-full flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate leading-tight font-medium">{attraction.name}</h3>

              {/* Wait Time & Trend */}
              {status === 'OPERATING' && waitTime !== null && (
                <div className="mt-1 flex items-baseline gap-2">
                  <div className="flex items-center gap-1.5 text-lg font-bold">
                    <Clock className="h-4 w-4" />
                    {waitTime} min
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
                    ?.filter((q) => q.queueType !== 'STANDBY')
                    .map((queue, i) => {
                      let Icon = Ticket;
                      let label = '';
                      let variant: 'outline' | 'secondary' | 'default' = 'outline';

                      switch (queue.queueType) {
                        case 'SINGLE_RIDER':
                          Icon = User;
                          label =
                            queue.waitTime !== null
                              ? `Single Rider: ${queue.waitTime} min`
                              : 'Single Rider';
                          variant = 'outline'; // Or success-like style if available
                          break;

                        case 'PAID_RETURN_TIME':
                          Icon = Zap;
                          label = queue.price?.formatted
                            ? `Lightning Lane: ${queue.price.formatted}`
                            : 'Lightning Lane';
                          variant = 'secondary'; // Premium feel
                          break;

                        case 'PAID_STANDBY':
                          Icon = Zap;
                          label = queue.price?.formatted
                            ? `Express: ${queue.price.formatted}`
                            : 'Express';
                          variant = 'secondary';
                          break;

                        case 'RETURN_TIME':
                          Icon = Ticket;
                          if (queue.state === 'AVAILABLE' && queue.returnStart) {
                            const start = new Date(queue.returnStart).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                            const end = queue.returnEnd
                              ? new Date(queue.returnEnd).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '';
                            label = `Return: ${start}${end ? ` - ${end}` : ''}`;
                          } else {
                            label = queue.state === 'FULL' ? 'Virtual Queue Full' : 'Virtual Queue';
                          }
                          variant = 'outline';
                          break;

                        case 'BOARDING_GROUP':
                          Icon = Ticket;
                          if (queue.allocationStatus === 'AVAILABLE') {
                            label = queue.currentGroupStart
                              ? `Boarding Groups: ${queue.currentGroupStart}-${queue.currentGroupEnd}`
                              : 'Boarding Groups Available';
                          } else {
                            label =
                              queue.allocationStatus === 'FINISHED'
                                ? 'Groups Distributed'
                                : 'Boarding Groups Paused';
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
              {status === 'OPERATING' &&
                (attraction.crowdLevel || attraction.currentLoad?.crowdLevel) && (
                  <CrowdLevelBadge
                    level={attraction.crowdLevel || attraction.currentLoad!.crowdLevel}
                    className="h-5 px-1.5 text-[10px]"
                  />
                )}
            </div>
          </div>

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

// Need to import WaitTimeSparkline
import { WaitTimeSparkline } from './wait-time-sparkline';
