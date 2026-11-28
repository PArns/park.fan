import { User, Zap, Ticket } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { QueueDataItem, QueueType } from '@/lib/api/types';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import { formatTime } from '@/lib/utils/intl-format';
import { queueAvailability, queueShut, type QueueShut } from '@/lib/parks/queue-availability';

/** The glossary term that explains each queue type, for the queue labels that link to it. */
export const QUEUE_GLOSSARY_TERMS: Partial<Record<QueueType, string>> = {
  SINGLE_RIDER: 'single-rider',
  // Not `virtual-queue`: at Disney this queue is the paid Lightning Lane Multi Pass.
  RETURN_TIME: 'return-time',
  BOARDING_GROUP: 'boarding-group',
  PAID_RETURN_TIME: 'lightning-lane',
  PAID_STANDBY: 'express-pass',
};

/**
 * The status word for a lane that is full or finished, in `attractions`. The card's chip and the
 * ride page's status badge both read it from here.
 */
export const QUEUE_SHUT_STATUS_KEYS = {
  full: 'queue.status.FULL',
  finished: 'queue.status.FINISHED',
} as const satisfies Record<QueueShut, string>;

const colorPrimary = 'badge-primary';
const colorPaid = 'badge-status-down';
const colorShut = 'badge-status-unknown';

interface QueueTypeBadgeProps {
  queue: QueueDataItem;
  timezone?: string;
}

/**
 * Badge for a ride's extra queue: single rider, return window, boarding groups, Lightning Lane or
 * Express price, or that the lane is full or finished. Nothing for standby; most link to their
 * glossary term.
 */
export function QueueTypeBadge({ queue, timezone }: QueueTypeBadgeProps) {
  const t = useTranslations('attractions');
  const locale = useLocale();

  let Icon = Ticket;
  let label = '';
  let colorClass = colorPrimary;
  // A full or finished paid lane still carries its price, so the state goes first.
  const shut = queueShut(queue);
  const shutState = shut ? t(QUEUE_SHUT_STATUS_KEYS[shut]) : null;

  const getWaitTime = (q: QueueDataItem): number | null => {
    if (!('waitTime' in q)) return null;
    const wt = q.waitTime;
    return wt !== null && wt !== undefined && typeof wt === 'number' && wt > 0 ? wt : null;
  };

  // The API may send placeholder prices (amount 0, formatted "Unknown") when the
  // real fee isn't available. Treat those as "no price" so we never render junk.
  const getFormattedPrice = (q: QueueDataItem): string | null => {
    if (!('price' in q) || !q.price) return null;
    const { amount, formatted } = q.price;
    if (!formatted || formatted.trim().toLowerCase() === 'unknown') return null;
    if (typeof amount === 'number' && amount <= 0) return null;
    return formatted;
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

    case 'PAID_RETURN_TIME': {
      Icon = Zap;
      const price = getFormattedPrice(queue);
      label = shutState
        ? t('queue.details.lightningLaneState', { state: shutState })
        : price
          ? t('queue.details.lightningLane', { price })
          : t('queue.details.lightningLaneNoPrice');
      colorClass = shutState ? colorShut : colorPaid;
      break;
    }

    case 'PAID_STANDBY': {
      Icon = Zap;
      const price = getFormattedPrice(queue);
      label = shutState
        ? t('queue.details.expressState', { state: shutState })
        : price
          ? t('queue.details.express', { price })
          : t('queue.details.expressNoPrice');
      colorClass = shutState ? colorShut : colorPaid;
      break;
    }

    case 'RETURN_TIME':
      if (queueAvailability(queue) === 'available' && queue.returnStart) {
        const timeFormat: Intl.DateTimeFormatOptions = {
          hour: '2-digit',
          minute: '2-digit',
          hour12: locale === 'en',
          ...(timezone ? { timeZone: timezone } : {}),
        };
        const start = formatTime(new Date(queue.returnStart), locale, timeFormat);
        const end = queue.returnEnd
          ? formatTime(new Date(queue.returnEnd), locale, timeFormat)
          : null;
        label = end
          ? t('queue.details.return', { start, end })
          : t('queue.details.returnNoEnd', { start });
      } else if (shutState) {
        // `kind` lets a language agree the word with its own noun: Italian's „orario" is
        // masculine, the shared status words agree with „coda".
        label = t('queue.details.returnState', { state: shutState, kind: shut ?? 'other' });
        colorClass = colorShut;
      } else {
        label = t('queue.RETURN_TIME');
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
    <Badge className={cn(colorClass)}>
      <Icon className="h-3 w-3 shrink-0 text-white" />
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
