import { Link } from '@/i18n/navigation';
import { Clock, AlertTriangle, Wrench, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ParkAttraction, AttractionStatus, ParkStatus } from '@/lib/api/types';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

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
  const t = useTranslations('parks');
  const tStatus = useTranslations('attractions.label');

  const status = getStatus(attraction, parkStatus);
  // If park is closed, force wait time to null
  const waitTime = parkStatus && parkStatus !== 'OPERATING' ? null : getWaitTime(attraction);
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Link
      href={`${parkPath}/${attraction.slug}` as '/europe/germany/rust/europa-park/blue-fire'}
      className="block h-full"
    >
      <Card className="hover:bg-muted/50 h-full transition-colors">
        <CardContent className="flex items-center justify-between p-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium">{attraction.name}</h3>
            {status === 'OPERATING' && waitTime !== null && (
              <div className="flex items-center gap-1.5 text-sm font-bold">
                <Clock className="h-4 w-4" />
                {waitTime} min
              </div>
            )}
          </div>
          <Badge
            className={cn(
              'ml-3 shrink-0 border-0 text-white',
              status === 'OPERATING'
                ? 'bg-emerald-500 hover:bg-emerald-600'
                : 'bg-rose-500 hover:bg-rose-600'
            )}
          >
            <StatusIcon className="mr-1 h-3 w-3" />
            {tStatus(status)}
          </Badge>
        </CardContent>
        {/* Current Load / Crowd Level Badge */}
        {status === 'OPERATING' && attraction.currentLoad && (
          <div className="mt-2 flex justify-end px-4 pb-4">
            {(() => {
              const level = attraction.currentLoad.crowdLevel;
              const crowdConfig: Record<string, string> = {
                very_low: 'bg-emerald-500 hover:bg-emerald-600',
                low: 'bg-emerald-400 hover:bg-emerald-500',
                normal: 'bg-blue-500 hover:bg-blue-600',
                moderate: 'bg-blue-500 hover:bg-blue-600',
                higher: 'bg-orange-400 hover:bg-orange-500',
                high: 'bg-orange-500 hover:bg-orange-600',
                very_high: 'bg-rose-500 hover:bg-rose-600',
                extreme: 'bg-rose-700 hover:bg-rose-800',
              };

              const colorClass = crowdConfig[level] || 'bg-slate-500';

              return (
                <Badge
                  className={cn(
                    'h-5 border-0 px-1.5 text-[10px] font-bold text-white uppercase',
                    colorClass
                  )}
                >
                  {t(`crowdLevels.${level}`)}
                </Badge>
              );
            })()}
          </div>
        )}
      </Card>
    </Link>
  );
}
