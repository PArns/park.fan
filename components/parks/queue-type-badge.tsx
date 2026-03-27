import { User, Zap, Ticket } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { QueueDataItem } from '@/lib/api/types';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';

const QUEUE_GLOSSARY_TERMS: Partial<Record<string, string>> = {
  SINGLE_RIDER: 'single-rider',
  RETURN_TIME: 'virtual-queue',
  BOARDING_GROUP: 'boarding-group',
  PAID_RETURN_TIME: 'lightning-lane',
  PAID_STANDBY: 'express-pass',
};

const colorPrimary =
  'bg-primary/65 text-white border border-primary/80 dark:bg-primary/25 dark:border-primary/40';
const colorPaid =
  'bg-status-down/65 text-white border border-status-down/80 dark:bg-status-down/25 dark:border-status-down/40';

interface QueueTypeBadgeProps {
  queue: QueueDataItem;
  timezone?: string;
}

export function QueueTypeBadge({ queue, timezone }: QueueTypeBadgeProps) {
  const t = useTranslations('attractions');
  const locale = useLocale();

  let Icon = Ticket;
  let label = '';
  let colorClass = colorPrimary;

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
      break;
    }

    case 'PAID_RETURN_TIME':
      Icon = Zap;
      label =
        'price' in queue && queue.price?.formatted
          ? t('queue.details.lightningLane', { price: queue.price.formatted })
          : t('queue.details.lightningLaneNoPrice');
      colorClass = colorPaid;
      break;

    case 'PAID_STANDBY':
      Icon = Zap;
      label =
        'price' in queue && queue.price?.formatted
          ? t('queue.details.express', { price: queue.price.formatted })
          : t('queue.details.expressNoPrice');
      colorClass = colorPaid;
      break;

    case 'RETURN_TIME':
      if (
        'state' in queue &&
        queue.state === 'AVAILABLE' &&
        'returnStart' in queue &&
        queue.returnStart
      ) {
        const timeFormat: Intl.DateTimeFormatOptions = {
          hour: '2-digit',
          minute: '2-digit',
          hour12: locale === 'en',
          ...(timezone ? { timeZone: timezone } : {}),
        };
        const start = new Date(queue.returnStart).toLocaleTimeString(locale, timeFormat);
        const end =
          'returnEnd' in queue && queue.returnEnd
            ? new Date(queue.returnEnd).toLocaleTimeString(locale, timeFormat)
            : '';
        label = t('queue.details.return', { start, end });
      } else {
        label =
          'state' in queue && queue.state === 'FULL'
            ? t('queue.details.virtualQueueFull')
            : t('queue.details.virtualQueue');
      }
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
      break;

    default:
      return null;
  }

  const termId = QUEUE_GLOSSARY_TERMS[queue.queueType];
  const badge = (
    <Badge className={cn('font-bold tracking-wide uppercase backdrop-blur-md', colorClass)}>
      <Icon className="h-3 w-3 shrink-0 text-inherit" />
      <span className="min-w-0 truncate">{label}</span>
    </Badge>
  );

  if (termId) {
    return (
      <GlossaryTermLink termId={termId} tooltipOnly>
        {badge}
      </GlossaryTermLink>
    );
  }

  return badge;
}
