import { User, Zap, Ticket } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { QueueDataItem } from '@/lib/api/types';

interface QueueTypeBadgeProps {
  queue: QueueDataItem;
}

export function QueueTypeBadge({ queue }: QueueTypeBadgeProps) {
  const t = useTranslations('attractions');

  let Icon = Ticket;
  let label = '';
  let variant: 'outline' | 'secondary' | 'default' = 'outline';

  const getWaitTime = (q: QueueDataItem): number | null => {
    if (!('waitTime' in q)) return null;
    const wt = q.waitTime;
    return wt !== null && wt !== undefined && typeof wt === 'number' && wt > 0 ? wt : null;
  };

  switch (queue.queueType) {
    case 'STANDBY':
      return null;

    case 'SINGLE_RIDER': {
      const wt = getWaitTime(queue);
      Icon = User;
      label =
        wt !== null
          ? t('queue.details.singleRider', { time: wt })
          : t('queue.details.singleRiderNoTime');
      variant = 'outline';
      break;
    }

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
      if ('allocationStatus' in queue && queue.allocationStatus === 'AVAILABLE') {
        label =
          'currentGroupStart' in queue && queue.currentGroupStart
            ? t('queue.details.boardingGroups', {
                start: queue.currentGroupStart,
                end: 'currentGroupEnd' in queue ? (queue.currentGroupEnd ?? '') : '',
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

    default:
      return null;
  }

  return (
    <Badge
      variant={variant}
      className="flex max-w-full items-center gap-1.5 px-1.5 py-0.5 text-[10px] font-normal"
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span className="min-w-0 truncate">{label}</span>
    </Badge>
  );
}
